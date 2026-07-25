import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    `SELECT id, notification_type, title, body, action_url, is_read, created_at
     FROM notifications
     WHERE recipient_type = 'companion' AND recipient_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [session.sub]
  )
  const unread = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM notifications
     WHERE recipient_type = 'companion' AND recipient_id = $1 AND is_read = false`,
    [session.sub]
  )

  return NextResponse.json({ notifications: rows, unreadCount: Number(unread[0]?.count ?? 0) })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids, all } = await req.json().catch(() => ({}))

  if (all) {
    await query(
      `UPDATE notifications SET is_read = true, read_at = NOW()
       WHERE recipient_type = 'companion' AND recipient_id = $1 AND is_read = false`,
      [session.sub]
    )
    return NextResponse.json({ ok: true })
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids or all is required.' }, { status: 400 })
  }

  await query(
    `UPDATE notifications SET is_read = true, read_at = NOW()
     WHERE recipient_type = 'companion' AND recipient_id = $1 AND id = ANY($2::uuid[])`,
    [session.sub, ids]
  )
  return NextResponse.json({ ok: true })
}
