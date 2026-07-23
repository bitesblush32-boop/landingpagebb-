import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { generateAlias } from '@/lib/alias'
import { buildSessionCookie, buildCommunityCookie } from '@/lib/session'
import { sendWelcomeEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

function validate(body: Record<string, unknown>): string | null {
  const { displayName, email, agreeToTerms } = body
  if (!displayName || String(displayName).trim().length < 2)
    return 'Your stage name must be at least 2 characters.'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)))
    return 'Enter a valid email address.'
  if (!agreeToTerms) return 'You must agree to the Terms & Conditions to continue.'
  return null
}

const VALID_COMMUNITIES = ['female', 'male', 'shemale']

export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}))

  const err = validate(body)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const { displayName, email } = body
  const community = VALID_COMMUNITIES.includes(String(body.gender_community ?? ''))
    ? String(body.gender_community)
    : 'female'

  const cleanEmail = String(email).toLowerCase().trim()
  const cleanDisplay = String(displayName).trim()
  const now = new Date()
  const id = randomUUID()

  const client = await pool.connect()
  try {
    const existing = await client.query('SELECT id FROM companions WHERE email = $1 LIMIT 1', [
      cleanEmail,
    ])
    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            'This email is already registered. Sign in instead.',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      )
    }

    // Generate unique alias
    let alias = generateAlias()
    for (let i = 0; i < 10; i++) {
      const conflict = await client.query('SELECT id FROM companions WHERE alias = $1 LIMIT 1', [
        alias,
      ])
      if (conflict.rows.length === 0) break
      alias = generateAlias()
    }

    await client.query('BEGIN')

    await client.query(
      `INSERT INTO companions
        (id, email, name, alias, full_name, date_of_birth, country, whatsapp_number,
         companion_stage, onboarding_complete, gender_community, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        id,
        cleanEmail,
        cleanDisplay,
        alias,
        null,
        null,
        null,
        null,
        3,
        false,
        community,
        now,
        now,
      ]
    )

    await client.query(
      `INSERT INTO companion_profiles
        (companion_id, bio, tagline, city, gender, availability_status, whatsapp_number,
         session_modality, is_verified, is_live, profile_completeness, is_visible_to_users,
         created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id,
        null,
        null,
        null,
        community,
        'offline',
        null,
        'both',
        false,
        true,
        0,
        true,
        now,
        now,
      ]
    )

    // Mark onboarding stages 1, 2, and 7 as complete (instant live — no admin review)
    await client.query(
      `INSERT INTO companion_onboarding_progress (companion_id, stage, status, completed_at, notes)
       VALUES ($1,1,'completed',$2,'Applied via landing page')
       ON CONFLICT (companion_id, stage) DO NOTHING`,
      [id, now]
    )
    await client.query(
      `INSERT INTO companion_onboarding_progress (companion_id, stage, status, completed_at)
       VALUES ($1,2,'completed',$2)
       ON CONFLICT (companion_id, stage) DO NOTHING`,
      [id, now]
    )
    await client.query(
      `INSERT INTO companion_onboarding_progress (companion_id, stage, status, completed_at, notes)
       VALUES ($1,7,'completed',$2,'Auto-approved on registration')
       ON CONFLICT (companion_id, stage) DO NOTHING`,
      [id, now]
    )

    await client.query('COMMIT')

    // Send welcome email non-blocking
    sendWelcomeEmail(cleanEmail, cleanDisplay).catch((e) =>
      console.error('[apply] welcome email failed:', e)
    )

    const res = NextResponse.json({ success: true, redirectTo: '/dashboard?welcome=1' }, { status: 201 })
    res.headers.set('Set-Cookie', buildSessionCookie(id, cleanEmail, cleanDisplay, community))
    res.headers.append('Set-Cookie', buildCommunityCookie(community))
    return res
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[apply]', err)
    return NextResponse.json(
      { error: 'Something went wrong creating your account. Please try again.' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
