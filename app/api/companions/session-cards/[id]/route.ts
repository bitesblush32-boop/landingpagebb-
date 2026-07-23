import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

const VALID_SESSION_TYPES = ['in_person', 'audio_call', 'video_call', 'chat', 'custom']
const VALID_CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'SEK', 'DKK', 'NOK', 'CAD', 'AUD', 'INR']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body: Record<string, unknown> = await req.json().catch(() => ({}))
  const { title, description, duration_minutes, price, currency, session_type, is_active } = body

  // Verify ownership
  const owned = await query<{ id: string }>(
    `SELECT sc.id FROM session_cards sc
     JOIN companion_profiles cp ON cp.id = sc.companion_profile_id
     WHERE sc.id = $1 AND cp.companion_id = $2 AND sc.deleted_at IS NULL`,
    [id, session.sub]
  )
  if (owned.length === 0)
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const cleanType =
    session_type !== undefined
      ? VALID_SESSION_TYPES.includes(String(session_type)) ? String(session_type) : null
      : undefined
  const cleanCurrency =
    currency !== undefined
      ? VALID_CURRENCIES.includes(String(currency)) ? String(currency) : 'EUR'
      : undefined

  await query(
    `UPDATE session_cards SET
       title            = COALESCE($1, title),
       description      = COALESCE($2, description),
       duration_minutes = COALESCE($3, duration_minutes),
       price            = COALESCE($4, price),
       currency         = COALESCE($5, currency),
       session_type     = COALESCE($6, session_type),
       is_active        = COALESCE($7, is_active),
       updated_at       = NOW()
     WHERE id = $8`,
    [
      title !== undefined ? String(title).trim() : null,
      description !== undefined ? String(description).trim() : null,
      duration_minutes !== undefined ? parseInt(String(duration_minutes)) : null,
      price !== undefined ? parseFloat(String(price)) : null,
      cleanCurrency ?? null,
      cleanType ?? null,
      is_active !== undefined ? Boolean(is_active) : null,
      id,
    ]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify ownership before soft-delete
  const owned = await query<{ id: string }>(
    `SELECT sc.id FROM session_cards sc
     JOIN companion_profiles cp ON cp.id = sc.companion_profile_id
     WHERE sc.id = $1 AND cp.companion_id = $2 AND sc.deleted_at IS NULL`,
    [id, session.sub]
  )
  if (owned.length === 0)
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  await query('UPDATE session_cards SET deleted_at = NOW() WHERE id = $1', [id])

  return NextResponse.json({ ok: true })
}
