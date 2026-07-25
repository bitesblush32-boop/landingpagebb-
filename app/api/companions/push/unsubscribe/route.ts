import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json().catch(() => ({}))
  if (!endpoint) return NextResponse.json({ error: 'endpoint is required.' }, { status: 400 })

  await query(`DELETE FROM push_subscriptions WHERE companion_id = $1 AND endpoint = $2`, [
    session.sub,
    endpoint,
  ])

  return NextResponse.json({ ok: true })
}
