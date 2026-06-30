import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const client = await pool.connect()
  try {
    const res = await client.query(
      `UPDATE companion_photos SET deleted_at = NOW()
       WHERE id = $1
         AND companion_profile_id = (SELECT id FROM companion_profiles WHERE companion_id = $2)
         AND deleted_at IS NULL`,
      [id, session.sub]
    )
    if (res.rowCount === 0) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
