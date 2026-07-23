import { NextRequest, NextResponse } from 'next/server'
import { query, pool } from '@/lib/db'
import { getSession } from '@/lib/session'
import { sendAdminReapplyNotification } from '@/lib/email'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    `SELECT c.full_name, c.email, c.date_of_birth::text AS date_of_birth,
            c.country, c.whatsapp_number, c.gender_community,
            cp.city, cp.tagline, cp.bio, cp.session_modality
     FROM companions c
     LEFT JOIN companion_profiles cp ON cp.companion_id = c.id
     WHERE c.id = $1`,
    [session.sub]
  )
  if (rows.length === 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify companion is actually rejected before allowing re-apply
  const statusRows = await query<{ review_status: string }>(
    `SELECT cop.status AS review_status
     FROM companion_onboarding_progress cop
     WHERE cop.companion_id = $1 AND cop.stage = 7
     ORDER BY cop.id DESC LIMIT 1`,
    [session.sub]
  )
  if (statusRows.length > 0 && statusRows[0].review_status !== 'rejected') {
    return NextResponse.json(
      { error: 'Re-apply is only available after rejection.' },
      { status: 400 }
    )
  }

  const body: Record<string, unknown> = await req.json().catch(() => ({}))
  const { city, tagline, bio, session_modality, whatsapp_number } = body

  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE companion_profiles SET
         city            = COALESCE($1, city),
         tagline         = COALESCE($2, tagline),
         bio             = COALESCE($3, bio),
         session_modality = COALESCE($4, session_modality),
         whatsapp_number = COALESCE($5, whatsapp_number),
         updated_at      = NOW()
       WHERE companion_id = $6`,
      [
        city ?? null,
        tagline ?? null,
        bio ?? null,
        session_modality ?? null,
        whatsapp_number ?? null,
        session.sub,
      ]
    )

    // Insert a new pending review row for stage 7
    await client.query(
      `INSERT INTO companion_onboarding_progress (companion_id, stage, status, notes)
       VALUES ($1, 7, 'pending', 'Re-applied after rejection')
       ON CONFLICT (companion_id, stage) DO UPDATE SET status='pending', notes='Re-applied after rejection', completed_at=NULL`,
      [session.sub]
    )

    // Notify admin
    const meRows = await query<{ email: string; name: string }>(
      'SELECT email, name FROM companions WHERE id = $1',
      [session.sub]
    )
    if (meRows.length > 0) {
      sendAdminReapplyNotification(session.sub, meRows[0].email, meRows[0].name).catch(
        console.error
      )
    }

    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
