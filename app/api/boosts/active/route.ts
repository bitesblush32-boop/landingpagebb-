import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

const VALID = ['female', 'male', 'shemale']

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const community = searchParams.get('community')
  if (!community || !VALID.includes(community)) {
    return NextResponse.json({ error: 'Invalid community' }, { status: 400 })
  }

  const now = new Date().toISOString()

  try {
    const [settingsRows, boostRows] = await Promise.all([
      query<{
        header_banner_enabled: boolean
        right_rail_enabled: boolean
        mid_grid_enabled: boolean
        featured_enabled: boolean
      }>(`SELECT header_banner_enabled, right_rail_enabled, mid_grid_enabled, featured_enabled
          FROM boost_settings WHERE id = 1`).catch(() => []),

      query<{
        id: string
        boost_type: string
        banner_image_url: string | null
        banner_headline: string | null
        banner_tagline: string | null
        companion_name: string
        alias: string | null
        tagline: string | null
        city: string | null
        hourly_rate: string | null
        currency: string | null
        primary_photo_url: string | null
      }>(
        `SELECT
           cb.id,
           cb.boost_type,
           cb.banner_image_url,
           cb.banner_headline,
           cb.banner_tagline,
           c.name  AS companion_name,
           c.alias,
           cp.tagline,
           cp.city,
           cp.hourly_rate::text,
           cp.currency,
           (SELECT url FROM companion_photos
            WHERE companion_profile_id = cp.id
              AND is_primary = true
              AND deleted_at IS NULL
            LIMIT 1) AS primary_photo_url
         FROM companion_boosts cb
         JOIN companions c  ON c.id  = cb.companion_id
         JOIN companion_profiles cp ON cp.companion_id = cb.companion_id
         WHERE cb.community = $1
           AND cb.status = 'active'
           AND cb.is_enabled = true
           AND $2::timestamptz BETWEEN cb.week_start::timestamptz
               AND (cb.week_end + INTERVAL '1 day')::timestamptz
         ORDER BY cb.boost_type, cb.created_at`,
        [community, now]
      ).catch(() => []),
    ])

    const s = settingsRows[0] ?? {
      header_banner_enabled: true,
      right_rail_enabled: true,
      mid_grid_enabled: true,
      featured_enabled: true,
    }

    const headerBanner = boostRows.find(b => b.boost_type === 'header_banner') ?? null
    const rightRail    = boostRows.find(b => b.boost_type === 'right_rail')    ?? null
    const midGrid      = boostRows.find(b => b.boost_type === 'mid_grid')      ?? null
    const featured     = boostRows
      .filter(b => b.boost_type.startsWith('featured'))
      .slice(0, 3)

    return NextResponse.json({
      settings: s,
      headerBanner: s.header_banner_enabled ? headerBanner : null,
      rightRail:    s.right_rail_enabled    ? rightRail    : null,
      midGrid:      s.mid_grid_enabled      ? midGrid      : null,
      featured:     s.featured_enabled      ? featured     : [],
    })
  } catch (err) {
    console.error('GET /api/boosts/active error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
