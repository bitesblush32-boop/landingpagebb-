import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get companion_profile_id
  const profileRows = await query<{ id: string; is_visible_to_users: boolean }>(
    'SELECT id, is_visible_to_users FROM companion_profiles WHERE companion_id = $1',
    [session.sub]
  )
  if (profileRows.length === 0)
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  const profileId = profileRows[0].id

  // Aggregate analytics events — table may not exist yet, so handle gracefully
  try {
    const [viewsToday, viewsWeek, viewsMonth, waClicks, bridgeClicks, chart] = await Promise.all([
      query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM analytics_events
         WHERE companion_profile_id=$1 AND event_type='profile_view'
           AND created_at >= CURRENT_DATE`,
        [profileId]
      ),
      query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM analytics_events
         WHERE companion_profile_id=$1 AND event_type='profile_view'
           AND created_at >= NOW() - INTERVAL '7 days'`,
        [profileId]
      ),
      query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM analytics_events
         WHERE companion_profile_id=$1 AND event_type='profile_view'
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [profileId]
      ),
      query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM analytics_events
         WHERE companion_profile_id=$1 AND event_type='whatsapp_click'
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [profileId]
      ),
      query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM analytics_events
         WHERE companion_profile_id=$1 AND event_type='bridge_click'
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [profileId]
      ),
      query<{ date: string; count: string }>(
        `SELECT DATE(created_at)::text AS date, COUNT(*)::text AS count
         FROM analytics_events
         WHERE companion_profile_id=$1 AND event_type='profile_view'
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [profileId]
      ),
    ])

    return NextResponse.json(
      {
        views_today: parseInt(viewsToday[0]?.cnt ?? '0'),
        views_week: parseInt(viewsWeek[0]?.cnt ?? '0'),
        views_month: parseInt(viewsMonth[0]?.cnt ?? '0'),
        whatsapp_clicks: parseInt(waClicks[0]?.cnt ?? '0'),
        bridge_clicks: parseInt(bridgeClicks[0]?.cnt ?? '0'),
        bookings_pending: 0,
        daily: chart.map((r) => ({ date: r.date, views: parseInt(r.count) })),
        is_visible_to_users: profileRows[0].is_visible_to_users,
      },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      }
    )
  } catch {
    // analytics_events table may not exist in all environments
    return NextResponse.json({
      views_today: 0,
      views_week: 0,
      views_month: 0,
      whatsapp_clicks: 0,
      bridge_clicks: 0,
      bookings_pending: 0,
      daily: [],
      is_visible_to_users: profileRows[0].is_visible_to_users,
    })
  }
}
