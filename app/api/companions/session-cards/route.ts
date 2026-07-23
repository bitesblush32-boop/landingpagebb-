import { NextRequest, NextResponse } from 'next/server'
import { query, pool } from '@/lib/db'
import { getSession } from '@/lib/session'

const VALID_SESSION_TYPES = ['in_person', 'audio_call', 'video_call', 'chat', 'custom']
const VALID_CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'SEK', 'DKK', 'NOK', 'CAD', 'AUD', 'INR']

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query<{
    id: string
    title: string
    description: string | null
    duration_minutes: number | null
    price: string | null
    currency: string
    session_type: string | null
    is_active: boolean
    sort_order: number
  }>(
    `SELECT sc.id, sc.title, sc.description, sc.duration_minutes,
            sc.price::text AS price, sc.currency, sc.session_type,
            sc.is_active, sc.sort_order
     FROM session_cards sc
     JOIN companion_profiles cp ON cp.id = sc.companion_profile_id
     WHERE cp.companion_id = $1
       AND sc.deleted_at IS NULL
     ORDER BY sc.sort_order ASC, sc.created_at ASC`,
    [session.sub]
  )

  return NextResponse.json({ cards: rows })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Record<string, unknown> = await req.json().catch(() => ({}))
  const { title, description, duration_minutes, price, currency, session_type } = body

  if (!title || String(title).trim().length < 2)
    return NextResponse.json({ error: 'Title must be at least 2 characters.' }, { status: 400 })

  const cleanType = VALID_SESSION_TYPES.includes(String(session_type ?? ''))
    ? String(session_type)
    : null
  const cleanCurrency = VALID_CURRENCIES.includes(String(currency ?? ''))
    ? String(currency)
    : 'EUR'

  const client = await pool.connect()
  try {
    // Get companion_profile_id
    const profileRows = await client.query<{ id: string }>(
      'SELECT id FROM companion_profiles WHERE companion_id = $1 LIMIT 1',
      [session.sub]
    )
    if (profileRows.rows.length === 0)
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })

    const profileId = profileRows.rows[0].id

    // Get next sort_order
    const countRows = await client.query<{ cnt: string }>(
      'SELECT COUNT(*)::text AS cnt FROM session_cards WHERE companion_profile_id = $1 AND deleted_at IS NULL',
      [profileId]
    )
    const sortOrder = parseInt(countRows.rows[0].cnt)

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO session_cards
         (companion_profile_id, title, description, duration_minutes, price, currency,
          session_type, is_active, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW(), NOW())
       RETURNING id`,
      [
        profileId,
        String(title).trim(),
        description ? String(description).trim() : null,
        duration_minutes ? parseInt(String(duration_minutes)) : null,
        price ? parseFloat(String(price)) : null,
        cleanCurrency,
        cleanType,
        sortOrder,
      ]
    )

    return NextResponse.json({ id: inserted.rows[0].id }, { status: 201 })
  } finally {
    client.release()
  }
}
