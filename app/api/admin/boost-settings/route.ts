import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query, pool } from '@/lib/db'

async function isAuthed(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ') && auth.slice(7) === process.env.CRON_SECRET) return true
  try {
    const jar = await cookies()
    return jar.get('bb_admin_key')?.value === process.env.CRON_SECRET
  } catch { return false }
}

// GET — current boost settings
export async function GET(req: Request) {
  if (!await isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await query(
      `SELECT * FROM boost_settings WHERE id = 1`
    )
    return NextResponse.json({ settings: rows[0] ?? null })
  } catch (err) {
    console.error('GET /api/admin/boost-settings error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH — update boost settings
export async function PATCH(req: Request) {
  if (!await isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = [
    'header_banner_enabled',
    'right_rail_enabled',
    'mid_grid_enabled',
    'featured_enabled',
    'price_featured_eur',
    'price_header_banner_eur',
    'price_right_rail_eur',
    'price_mid_grid_eur',
    'max_weeks_advance',
  ]

  const updates: string[] = []
  const values: unknown[] = []

  for (const key of allowed) {
    if (key in body) {
      values.push(body[key])
      updates.push(`${key} = $${values.length}`)
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const res = await client.query(
      `UPDATE boost_settings SET ${updates.join(', ')} WHERE id = 1 RETURNING *`,
      values
    )
    if (res.rows.length === 0) {
      // Row might not exist yet — create it
      await client.query(
        `INSERT INTO boost_settings (id) VALUES (1) ON CONFLICT DO NOTHING`
      )
      const res2 = await client.query(
        `UPDATE boost_settings SET ${updates.join(', ')} WHERE id = 1 RETURNING *`,
        values
      )
      return NextResponse.json({ success: true, settings: res2.rows[0] })
    }
    return NextResponse.json({ success: true, settings: res.rows[0] })
  } catch (err) {
    console.error('PATCH /api/admin/boost-settings error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
