import { NextRequest, NextResponse } from 'next/server'
import { query, pool } from '@/lib/db'
import { getSession } from '@/lib/session'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    `SELECT cv.id, cv.url, cv.thumbnail_url, cv.duration_seconds, cv.title,
            CASE WHEN cv.is_approved THEN 'approved' ELSE 'pending' END AS moderation_status,
            cv.created_at
     FROM companion_videos cv
     JOIN companion_profiles cp ON cp.id = cv.companion_profile_id
     WHERE cp.companion_id = $1 AND cv.deleted_at IS NULL
     ORDER BY cv.created_at DESC`,
    [session.sub]
  )
  return NextResponse.json(rows)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const videoId = body.videoId ?? body.id
  if (!videoId) return NextResponse.json({ error: 'videoId required.' }, { status: 400 })

  const client = await pool.connect()
  try {
    const res = await client.query(
      `UPDATE companion_videos SET deleted_at = NOW()
       WHERE id = $1
         AND companion_profile_id = (SELECT id FROM companion_profiles WHERE companion_id = $2)
         AND deleted_at IS NULL`,
      [videoId, session.sub]
    )
    if (res.rowCount === 0) return NextResponse.json({ error: 'Video not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
