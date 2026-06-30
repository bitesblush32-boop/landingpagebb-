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
  if (profileRows.length === 0) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
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

    return NextResponse.json({
      profile_views: {
        today: parseInt(viewsToday[0]?.cnt ?? '0'),
        week: parseInt(viewsWeek[0]?.cnt ?? '0'),
        month: parseInt(viewsMonth[0]?.cnt ?? '0'),
      },
      whatsapp_clicks: { month: parseInt(waClicks[0]?.cnt ?? '0') },
      bridge_clicks: { month: parseInt(bridgeClicks[0]?.cnt ?? '0') },
      chart: chart.map(r => ({ date: r.date, count: parseInt(r.count) })),
      is_visible_to_users: profileRows[0].is_visible_to_users,
    }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    // analytics_events table may not exist in all environments
    return NextResponse.json({
      profile_views: { today: 0, week: 0, month: 0 },
      whatsapp_clicks: { month: 0 },
      bridge_clicks: { month: 0 },
      chart: [],
      is_visible_to_users: profileRows[0].is_visible_to_users,
    })
  }
}
