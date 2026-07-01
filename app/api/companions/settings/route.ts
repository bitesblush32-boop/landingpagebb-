import { NextRequest, NextResponse } from 'next/server'
import { query, pool } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    `SELECT c.email, c.name, c.whatsapp_number,
            cp.instagram_handle, cp.website_url, cp.availability_status
     FROM companions c
     LEFT JOIN companion_profiles cp ON cp.companion_id = c.id
     WHERE c.id = $1`,
    [session.sub]
  )
  if (rows.length === 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { whatsapp_number, instagram_handle, website_url, is_live } = body

  if (whatsapp_number && !/^\+[1-9]\d{6,14}$/.test(String(whatsapp_number))) {
    return NextResponse.json(
      { error: 'Invalid WhatsApp number. Use E.164 format.' },
      { status: 400 }
    )
  }

  const client = await pool.connect()
  try {
    // Toggle live status
    if (typeof is_live === 'boolean') {
      await client.query(
        `UPDATE companion_profiles SET is_live = $1, is_visible_to_users = $1, updated_at = NOW() WHERE companion_id = $2`,
        [is_live, session.sub]
      )
      return NextResponse.json({ ok: true })
    }

    if (whatsapp_number !== undefined) {
      await client.query(
        'UPDATE companions SET whatsapp_number = $1, updated_at = NOW() WHERE id = $2',
        [whatsapp_number || null, session.sub]
      )
    }
    await client.query(
      `UPDATE companion_profiles SET
         instagram_handle = COALESCE($1, instagram_handle),
         website_url      = COALESCE($2, website_url),
         updated_at       = NOW()
       WHERE companion_id = $3`,
      [instagram_handle ?? null, website_url ?? null, session.sub]
    )
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest) {
  // Password change
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { current_password, new_password } = await req.json().catch(() => ({}))
  if (!new_password || String(new_password).length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    if (current_password) {
      const rows = await client.query<{ hashed_password: string | null }>(
        'SELECT hashed_password FROM companions WHERE id = $1',
        [session.sub]
      )
      const existing = rows.rows[0]?.hashed_password
      if (existing) {
        const ok = await bcrypt.compare(String(current_password), existing)
        if (!ok)
          return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      }
    }

    const hashed = await bcrypt.hash(String(new_password), 12)
    await client.query(
      'UPDATE companions SET hashed_password = $1, updated_at = NOW() WHERE id = $2',
      [hashed, session.sub]
    )
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE companion_profiles SET is_live = false, is_visible_to_users = false, updated_at = NOW() WHERE companion_id = $1`,
      [session.sub]
    )
    await client.query(
      `UPDATE companions SET onboarding_complete = false, updated_at = NOW() WHERE id = $1`,
      [session.sub]
    )
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
