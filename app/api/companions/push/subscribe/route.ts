import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await req.json().catch(() => ({}))
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 })
  }

  await query(
    `INSERT INTO push_subscriptions (companion_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE
       SET companion_id = EXCLUDED.companion_id,
           p256dh = EXCLUDED.p256dh,
           auth = EXCLUDED.auth`,
    [session.sub, endpoint, keys.p256dh, keys.auth]
  )

  return NextResponse.json({ ok: true })
}
