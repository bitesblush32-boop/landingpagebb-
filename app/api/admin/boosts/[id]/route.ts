import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { pool } from '@/lib/db'

async function isAuthed(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ') && auth.slice(7) === process.env.CRON_SECRET) return true
  try {
    const jar = await cookies()
    return jar.get('bb_admin_key')?.value === process.env.CRON_SECRET
  } catch { return false }
}

// PATCH /api/admin/boosts/[id] — toggle is_enabled, cancel, or change status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { is_enabled?: boolean; status?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const updates: string[] = []
  const values: unknown[] = []

  if (typeof body.is_enabled === 'boolean') {
    values.push(body.is_enabled)
    updates.push(`is_enabled = $${values.length}`)
  }
  if (body.status && ['active', 'cancelled', 'expired'].includes(body.status)) {
    values.push(body.status)
    updates.push(`status = $${values.length}`)
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  values.push(id)
  const sql = `UPDATE companion_boosts SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, status, is_enabled`

  const client = await pool.connect()
  try {
    const res = await client.query(sql, values)
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, boost: res.rows[0] })
  } catch (err) {
    console.error('PATCH /api/admin/boosts/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
