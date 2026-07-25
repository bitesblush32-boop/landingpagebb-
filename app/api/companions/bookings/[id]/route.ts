import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notify'

// notificationType values are constrained by the shared DB's `notif_type_check`
// constraint. It has no 'booking_accepted' or 'booking_completed' — only
// 'booking_confirmed' and 'booking_declined' exist for this transition. There is no
// valid type for a "completed" event, so that status intentionally fires no
// notification rather than guessing at a value that would fail the constraint.
const STATUS_COPY: Record<string, { notificationType: string; title: string; body: (name: string) => string }> = {
  accepted: {
    notificationType: 'booking_confirmed',
    title: 'Your invitation was accepted',
    body: (name) => `${name} has accepted your booking request.`,
  },
  declined: {
    notificationType: 'booking_declined',
    title: 'A change of plans',
    body: (name) => `${name} wasn't able to accept your request this time.`,
  },
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status, companion_notes } = await req.json().catch(() => ({}))

  const VALID = ['accepted', 'declined', 'completed']
  if (status && !VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const client = await pool.connect()
  let dreamerId: string | null = null
  try {
    const res = await client.query(
      `UPDATE booking_requests SET
         status = COALESCE($1, status),
         companion_notes = COALESCE($2, companion_notes),
         updated_at = NOW()
       WHERE id = $3 AND companion_profile_id = (SELECT id FROM companion_profiles WHERE companion_id = $4)
       RETURNING user_id`,
      [status ?? null, companion_notes ?? null, id, session.sub]
    )
    if (res.rowCount === 0)
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    dreamerId = res.rows[0].user_id as string
  } finally {
    client.release()
  }

  if (status && dreamerId && STATUS_COPY[status]) {
    const copy = STATUS_COPY[status]
    createNotification({
      recipientType: 'user',
      recipientId: dreamerId,
      notificationType: copy.notificationType,
      title: copy.title,
      body: copy.body(session.name),
      metadata: { booking_id: id },
    }).catch((err) => console.error('createNotification failed:', err))
  }

  return NextResponse.json({ ok: true })
}
