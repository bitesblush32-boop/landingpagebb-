import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'
import {
  BOOST_TYPES,
  VALID_COMMUNITIES,
  getWeekStart,
  getWeekEnd,
  addWeeks,
  toDateStr,
  formatWeekRange,
  type WeekSlot,
} from '@/lib/boosts'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const boostType = searchParams.get('type') as string
  const community = searchParams.get('community') as string

  if (!(BOOST_TYPES as readonly string[]).includes(boostType)) {
    return NextResponse.json({ error: 'Invalid boost type' }, { status: 400 })
  }
  if (!(VALID_COMMUNITIES as readonly string[]).includes(community)) {
    return NextResponse.json({ error: 'Invalid community' }, { status: 400 })
  }

  try {
    // Get max_weeks_advance from settings
    const settingsRows = await query<{ max_weeks_advance: number }>(
      `SELECT max_weeks_advance FROM boost_settings WHERE id = 1`
    ).catch(() => [])
    const maxWeeks = settingsRows[0]?.max_weeks_advance ?? 4

    // Current week start
    const currentWeekStart = getWeekStart()
    const rangeEnd = addWeeks(currentWeekStart, maxWeeks)

    // Get all taken slots in this range
    const takenRows = await query<{
      week_start: string
      companion_name: string
      companion_id: string
    }>(
      `SELECT cb.week_start::text, c.name AS companion_name, cb.companion_id::text
       FROM companion_boosts cb
       JOIN companions c ON c.id = cb.companion_id
       WHERE cb.boost_type = $1
         AND cb.community = $2
         AND cb.status != 'cancelled'
         AND cb.week_start >= $3
         AND cb.week_start < $4`,
      [boostType, community, toDateStr(currentWeekStart), toDateStr(rangeEnd)]
    )

    const takenMap = new Map(
      takenRows.map(r => [r.week_start, { name: r.companion_name, id: r.companion_id }])
    )

    // Build slot list for each week in range
    const slots: WeekSlot[] = []
    let cursor = new Date(currentWeekStart)
    for (let i = 0; i < maxWeeks; i++) {
      const ws = toDateStr(cursor)
      const we = toDateStr(getWeekEnd(cursor))
      const taken = takenMap.get(ws)
      slots.push({
        weekStart: ws,
        weekEnd:   we,
        label:     formatWeekRange(cursor),
        isCurrent: i === 0,
        takenBy:   taken ? taken.name : null,
        isYours:   taken ? taken.id === session.sub : false,
      })
      cursor = addWeeks(cursor, 1)
    }

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('GET /api/companions/boosts/slots error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
