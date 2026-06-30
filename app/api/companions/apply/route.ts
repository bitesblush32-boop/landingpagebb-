import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { generateAlias } from '@/lib/alias'
import { buildSessionCookie } from '@/lib/session'
import { randomUUID } from 'crypto'

function isAtLeast18(dob: string): boolean {
  const date = new Date(dob)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  const cutoff = new Date(date.getFullYear() + 18, date.getMonth(), date.getDate())
  return today >= cutoff
}

function validate(body: Record<string, unknown>): string | null {
  const { fullName, email, dateOfBirth, country, city, whatsappNumber, gender, sessionModality } = body
  if (!fullName || String(fullName).trim().length < 2) return 'We need your full legal name.'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return 'Enter a valid email address.'
  if (!dateOfBirth || isNaN(new Date(String(dateOfBirth)).getTime())) return 'Enter a valid date of birth.'
  if (!isAtLeast18(String(dateOfBirth))) return 'You must be 18 or older to apply.'
  if (!country || String(country).trim().length < 1) return 'Please select your country.'
  if (!city || String(city).trim().length < 1) return 'Please enter your city.'
  if (whatsappNumber && !/^\+[1-9]\d{6,14}$/.test(String(whatsappNumber))) {
    return 'Invalid WhatsApp number. Use E.164 format, e.g. +31612345678.'
  }
  const VALID_GENDERS = ['woman','man','non_binary','genderqueer','genderfluid','agender','bigender',
    'pangender','two_spirit','trans_woman','trans_man','demi_girl','demi_boy','neutrois','androgyne',
    'intersex','questioning','other','prefer_not_to_say']
  if (gender && !VALID_GENDERS.includes(String(gender))) return 'Invalid gender selection.'
  const VALID_MODALITY = ['in_person','online','both']
  if (sessionModality && !VALID_MODALITY.includes(String(sessionModality))) return 'Invalid session modality.'
  return null
}

export async function POST(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}))

  const err = validate(body)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const { fullName, email, dateOfBirth, country, city, whatsappNumber,
          displayName, gender, tagline, bio, sessionModality, profilePhotoUrl } = body

  const cleanEmail = String(email).toLowerCase().trim()
  const cleanName = String(fullName).trim()
  const now = new Date()
  const id = randomUUID()

  const client = await pool.connect()
  try {
    const existing = await client.query('SELECT id FROM companions WHERE email = $1 LIMIT 1', [cleanEmail])
    if (existing.rows.length > 0) {
      return NextResponse.json({
        error: 'An application with this email already exists. Check your inbox or contact support.',
      }, { status: 409 })
    }

    // Generate unique alias
    let alias = generateAlias()
    for (let i = 0; i < 10; i++) {
      const conflict = await client.query('SELECT id FROM companions WHERE alias = $1 LIMIT 1', [alias])
      if (conflict.rows.length === 0) break
      alias = generateAlias()
    }

    const displayOrFirst = String((displayName && String(displayName).trim()) || cleanName.split(' ')[0] || cleanName)

    await client.query(
      `INSERT INTO companions
        (id, email, name, alias, full_name, date_of_birth, country, whatsapp_number,
         companion_stage, onboarding_complete, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, cleanEmail, displayOrFirst, alias, cleanName, dateOfBirth, country,
       whatsappNumber ?? null, 3, false, now, now]
    )

    const profileRes = await client.query(
      `INSERT INTO companion_profiles
        (companion_id, bio, tagline, city, gender, availability_status, whatsapp_number,
         session_modality, is_verified, is_live, profile_completeness, is_visible_to_users,
         created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [id, bio ?? null, tagline ?? null, city ?? null, gender ?? null, 'offline',
       whatsappNumber ?? null, sessionModality ?? null, false, false, 0, false, now, now]
    )
    const profileId = profileRes.rows[0].id

    if (profilePhotoUrl) {
      await client.query(
        `INSERT INTO companion_photos
          (companion_profile_id, url, storage_key, alt_text, sort_order, is_primary, is_approved, created_at)
         VALUES ($1,$2,'',$3,0,true,false,$4)`,
        [profileId, profilePhotoUrl, null, now]
      )
    }

    // Mark onboarding stages 1 + 2 as complete
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

    // Issue session cookie so companion lands on /status automatically
    const res = NextResponse.json({ success: true, redirectTo: '/status?new=1' }, { status: 201 })
    res.headers.set('Set-Cookie', buildSessionCookie(id, cleanEmail, displayOrFirst))
    return res
  } catch (err) {
    console.error('[apply]', err)
    return NextResponse.json({ error: 'Something went wrong creating your account. Please try again.' }, { status: 500 })
  } finally {
    client.release()
  }
}
