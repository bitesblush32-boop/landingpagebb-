import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await query(
      `SELECT
         br.id, br.status, br.message, br.scheduled_at, br.created_at,
         br.companion_notes, br.dreamer_id,
         sc.title AS session_title, sc.duration_minutes, sc.price::text, sc.currency,
         u.name AS dreamer_name
       FROM booking_requests br
       LEFT JOIN session_cards sc ON sc.id = br.session_card_id
       LEFT JOIN users u ON u.id = br.dreamer_id
       WHERE br.companion_id = $1
       ORDER BY br.created_at DESC
       LIMIT 50`,
      [session.sub]
    )
    return NextResponse.json(rows)
  } catch {
    // booking_requests may not exist yet
    return NextResponse.json([])
  }
}
