import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, pool } from '@/lib/db'
import {
  BOOST_TYPES,
  VALID_COMMUNITIES,
  getWeekStart,
  getWeekEnd,
  addWeeks,
  toDateStr,
  DEFAULT_PRICES,
  type BoostType,
  type BoostCommunity,
} from '@/lib/boosts'

// GET — companion's own boosts (upcoming + active)
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await query<{
      id: string
      boost_type: string
      community: string
      week_start: string
      week_end: string
      price_eur: string
      status: string
      is_enabled: boolean
      banner_image_url: string | null
      banner_headline: string | null
      banner_tagline: string | null
      payment_status: string
      created_at: string
    }>(
      `SELECT id, boost_type, community, week_start::text, week_end::text,
              price_eur::text, status, is_enabled,
              banner_image_url, banner_headline, banner_tagline,
              payment_status, created_at::text
       FROM companion_boosts
       WHERE companion_id = $1
         AND status != 'cancelled'
         AND week_end >= CURRENT_DATE - INTERVAL '1 day'
       ORDER BY week_start, boost_type`,
      [session.sub]
    )

    return NextResponse.json({ boosts: rows })
  } catch (err) {
    console.error('GET /api/companions/boosts error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — book a boost slot
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    boost_type: string
    community: string
    week_start: string  // YYYY-MM-DD (must be a Monday)
    banner_headline?: string
    banner_tagline?: string
    banner_image_url?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { boost_type, community, week_start, banner_headline, banner_tagline, banner_image_url } = body

  if (!BOOST_TYPES.includes(boost_type as BoostType)) {
    return NextResponse.json({ error: 'Invalid boost type' }, { status: 400 })
  }
  if (!VALID_COMMUNITIES.includes(community as BoostCommunity)) {
    return NextResponse.json({ error: 'Invalid community' }, { status: 400 })
  }

  // Validate week_start is a Monday and within booking window
  const weekStartDate = new Date(week_start + 'T00:00:00Z')
  if (isNaN(weekStartDate.getTime()) || weekStartDate.getUTCDay() !== 1) {
    return NextResponse.json({ error: 'week_start must be a Monday (YYYY-MM-DD)' }, { status: 400 })
  }

  const currentWeekStart = getWeekStart()
  const maxWeeks = 4
  const maxDate = addWeeks(currentWeekStart, maxWeeks)

  if (weekStartDate < currentWeekStart) {
    return NextResponse.json({ error: 'Cannot book a past week' }, { status: 400 })
  }
  if (weekStartDate >= maxDate) {
    return NextResponse.json({ error: `Can only book up to ${maxWeeks} weeks in advance` }, { status: 400 })
  }

  const weekEndDate = getWeekEnd(weekStartDate)

  // Get price from settings
  const settingsRows = await query<Record<string, string>>(
    `SELECT price_featured_eur, price_header_banner_eur, price_right_rail_eur, price_mid_grid_eur,
            max_weeks_advance
     FROM boost_settings WHERE id = 1`
  ).catch(() => [])

  const priceMap: Record<string, number> = {
    featured_1:    parseFloat(settingsRows[0]?.price_featured_eur    ?? '15'),
    featured_2:    parseFloat(settingsRows[0]?.price_featured_eur    ?? '15'),
    featured_3:    parseFloat(settingsRows[0]?.price_featured_eur    ?? '15'),
    header_banner: parseFloat(settingsRows[0]?.price_header_banner_eur ?? '25'),
    right_rail:    parseFloat(settingsRows[0]?.price_right_rail_eur  ?? '15'),
    mid_grid:      parseFloat(settingsRows[0]?.price_mid_grid_eur    ?? '10'),
  }
  const price = priceMap[boost_type] ?? DEFAULT_PRICES[boost_type as BoostType]

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Check slot not already taken
    const conflict = await client.query(
      `SELECT id FROM companion_boosts
       WHERE boost_type = $1 AND community = $2 AND week_start = $3 AND status != 'cancelled'`,
      [boost_type, community, toDateStr(weekStartDate)]
    )
    if (conflict.rows.length > 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'This slot is already taken for that week' }, { status: 409 })
    }

    // Get companion_profile_id
    const profileRows = await client.query(
      `SELECT id FROM companion_profiles WHERE companion_id = $1 LIMIT 1`,
      [session.sub]
    )
    if (profileRows.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Insert boost
    const result = await client.query(
      `INSERT INTO companion_boosts
         (companion_id, boost_type, community, week_start, week_end, price_eur,
          status, banner_headline, banner_tagline, banner_image_url, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, 'manual')
       RETURNING id, boost_type, community, week_start::text, week_end::text, price_eur::text, status`,
      [
        session.sub,
        boost_type,
        community,
        toDateStr(weekStartDate),
        toDateStr(weekEndDate),
        price,
        banner_headline?.trim() || null,
        banner_tagline?.trim() || null,
        banner_image_url?.trim() || null,
      ]
    )

    await client.query('COMMIT')
    return NextResponse.json({ success: true, boost: result.rows[0] }, { status: 201 })
  } catch (err: unknown) {
    await client.query('ROLLBACK').catch(() => {})
    // Unique constraint violation = slot taken concurrently
    if ((err as { code?: string })?.code === '23505') {
      return NextResponse.json({ error: 'This slot was just taken — please choose another week' }, { status: 409 })
    }
    console.error('POST /api/companions/boosts error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
