import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status, companion_notes } = await req.json().catch(() => ({}))

  const VALID = ['accepted', 'declined', 'completed']
  if (status && !VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const res = await client.query(
      `UPDATE booking_requests SET
         status = COALESCE($1, status),
         companion_notes = COALESCE($2, companion_notes),
         updated_at = NOW()
       WHERE id = $3 AND companion_id = $4`,
      [status ?? null, companion_notes ?? null, id, session.sub]
    )
    if (res.rowCount === 0)
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
