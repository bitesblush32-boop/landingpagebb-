import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const lat = typeof body.latitude === 'number' ? body.latitude : parseFloat(body.latitude)
  const lng = typeof body.longitude === 'number' ? body.longitude : parseFloat(body.longitude)

  if (isNaN(lat) || lat < -90 || lat > 90)
    return NextResponse.json({ error: 'Invalid latitude.' }, { status: 400 })
  if (isNaN(lng) || lng < -180 || lng > 180)
    return NextResponse.json({ error: 'Invalid longitude.' }, { status: 400 })

  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE companion_profiles
       SET latitude = $1,
           longitude = $2,
           location_enabled = true,
           location_updated_at = NOW(),
           updated_at = NOW()
       WHERE companion_id = $3`,
      [lat, lng, session.sub]
    )
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
