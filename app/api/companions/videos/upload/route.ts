import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { pool, query } from '@/lib/db'
import { getSession } from '@/lib/session'


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check max 3 videos
  const countRows = await query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM companion_videos cv
     JOIN companion_profiles cp ON cp.id = cv.companion_profile_id
     WHERE cp.companion_id = $1 AND cv.deleted_at IS NULL`,
    [session.sub]
  )
  if (parseInt(countRows[0].cnt) >= 3) {
    return NextResponse.json(
      { error: 'Maximum 3 videos allowed. Delete one to upload more.' },
      { status: 400 }
    )
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const file = formData.get('video') as File | null
  if (!file) return NextResponse.json({ error: 'No video provided.' }, { status: 400 })
  if (!file.type.startsWith('video/'))
    return NextResponse.json({ error: 'File must be a video.' }, { status: 400 })
  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: 'Video must be under 20 MB.' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  let url: string,
    publicId: string,
    duration: number | null = null,
    thumbnailUrl: string | null = null

  try {
    const result = await new Promise<{ secure_url: string; public_id: string; duration?: number }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'companion-videos',
            resource_type: 'video',
            eager: [{ format: 'jpg', start_offset: '0' }],
          },
          (err, r) => (err || !r ? reject(err) : resolve(r))
        )
        stream.write(buffer)
        stream.end()
      }
    )
    url = result.secure_url
    publicId = result.public_id
    duration = result.duration ? Math.round(result.duration) : null
    thumbnailUrl = cloudinary.url(`${publicId}.jpg`, { resource_type: 'video' })

    // Enforce 20-second max — delete from Cloudinary and reject
    if (duration !== null && duration > 20) {
      cloudinary.uploader.destroy(publicId, { resource_type: 'video' }).catch(console.error)
      return NextResponse.json(
        { error: 'Video must be 20 seconds or shorter.' },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error('[upload-video] Cloudinary error:', err)
    return NextResponse.json({ error: 'Video upload failed. Please try again.' }, { status: 500 })
  }

  const client = await pool.connect()
  try {
    const res = await client.query(
      `INSERT INTO companion_videos
        (companion_profile_id, url, storage_key, thumbnail_url, duration_seconds, is_approved, created_at)
       SELECT cp.id, $2, $3, $4, $5, false, NOW()
       FROM companion_profiles cp WHERE cp.companion_id = $1
       RETURNING id`,
      [session.sub, url, publicId, thumbnailUrl, duration]
    )
    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found. Cannot save video.' },
        { status: 500 }
      )
    }
    return NextResponse.json({ url, thumbnailUrl, videoId: res.rows[0].id })
  } finally {
    client.release()
  }
}
