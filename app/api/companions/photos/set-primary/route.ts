import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photoId } = await req.json().catch(() => ({}))
  if (!photoId) return NextResponse.json({ error: 'photoId required.' }, { status: 400 })

  const client = await pool.connect()
  try {
    const check = await client.query(
      `SELECT cp.id FROM companion_photos cp
       JOIN companion_profiles prof ON prof.id = cp.companion_profile_id
       WHERE cp.id = $1 AND prof.companion_id = $2 AND cp.deleted_at IS NULL`,
      [photoId, session.sub]
    )
    if (check.rows.length === 0) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })

    await client.query(
      `UPDATE companion_photos SET is_primary = false
       WHERE companion_profile_id = (SELECT id FROM companion_profiles WHERE companion_id = $1)`,
      [session.sub]
    )
    await client.query('UPDATE companion_photos SET is_primary = true WHERE id = $1', [photoId])
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
