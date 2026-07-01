import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/session'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, r) => {
        if (err || !r) return reject(err)
        resolve({ url: r.secure_url, publicId: r.public_id })
      }
    )
    stream.write(buffer)
    stream.end()
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No photo provided.' }, { status: 400 })
  if (!file.type.startsWith('image/'))
    return NextResponse.json({ error: 'File must be an image.' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'File must be under 5 MB.' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let url: string
  let publicId: string

  try {
    const result = await uploadToCloudinary(buffer, 'companion-applications')
    url = result.url
    publicId = result.publicId
  } catch (err) {
    console.error('[upload-photo] Cloudinary error:', err)
    return NextResponse.json({ error: 'Photo upload failed. Please try again.' }, { status: 500 })
  }

  // If logged in, save to DB
  if (session) {
    const client = await pool.connect()
    try {
      const countRes = await client.query(
        `SELECT COUNT(*) AS cnt FROM companion_photos cp
         JOIN companion_profiles prof ON prof.id = cp.companion_profile_id
         WHERE prof.companion_id = $1 AND cp.deleted_at IS NULL`,
        [session.sub]
      )
      if (parseInt(String(countRes.rows[0].cnt)) >= 8) {
        return NextResponse.json(
          { error: 'Maximum 8 photos allowed. Delete one to upload more.' },
          { status: 400 }
        )
      }

      const photoRes = await client.query(
        `INSERT INTO companion_photos
          (companion_profile_id, url, storage_key, sort_order, is_primary, is_approved, created_at)
         SELECT prof.id, $2, $3,
           COALESCE((SELECT MAX(sort_order)+1 FROM companion_photos WHERE companion_profile_id=prof.id AND deleted_at IS NULL),0),
           false, false, NOW()
         FROM companion_profiles prof WHERE prof.companion_id = $1
         RETURNING id`,
        [session.sub, url, publicId]
      )
      return NextResponse.json({ url, photoId: photoRes.rows[0]?.id })
    } finally {
      client.release()
    }
  }

  return NextResponse.json({ url })
}
