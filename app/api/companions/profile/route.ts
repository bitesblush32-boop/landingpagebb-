import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'
import { toSlug } from '@/lib/slug'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query<Record<string, unknown>>(
    `SELECT cp.ethnicity, cp.languages, cp.vibe_tags, cp.currency,
            cp.height_cm, cp.body_type, cp.eye_color, cp.hair_color, cp.skin_color,
            cp.session_modality, cp.hourly_rate::text AS hourly_rate,
            cp.instagram_handle, cp.website_url, cp.telegram_handle
     FROM companion_profiles cp
     WHERE cp.companion_id = $1`,
    [session.sub]
  )
  if (rows.length === 0) return NextResponse.json({})
  return NextResponse.json(rows[0])
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Record<string, unknown> = await req.json().catch(() => ({}))
  const {
    display_name,
    full_name,
    date_of_birth,
    country,
    bio,
    tagline,
    city,
    availability_status,
    session_modality,
    whatsapp_number,
    telegram_handle,
    instagram_handle,
    website_url,
    hourly_rate,
    gender,
    height_cm,
    body_type,
    eye_color,
    hair_color,
    skin_color,
    ethnicity,
    languages,
    vibe_tags,
    currency,
  } = body

  const AVAIL = ['available', 'busy', 'offline']
  const MODALITY = ['in_person', 'online', 'both']
  if (availability_status && !AVAIL.includes(String(availability_status)))
    return NextResponse.json({ error: 'Invalid availability status.' }, { status: 400 })
  if (session_modality && !MODALITY.includes(String(session_modality)))
    return NextResponse.json({ error: 'Invalid session modality.' }, { status: 400 })
  if (hourly_rate !== undefined && hourly_rate !== null && hourly_rate !== '') {
    const r = parseFloat(String(hourly_rate))
    if (isNaN(r) || r < 0)
      return NextResponse.json({ error: 'Hourly rate must be a positive number.' }, { status: 400 })
  }
  if (whatsapp_number && !/^\+[1-9]\d{6,14}$/.test(String(whatsapp_number)))
    return NextResponse.json(
      { error: 'Invalid WhatsApp number. Use E.164 format.' },
      { status: 400 }
    )

  const client = await pool.connect()
  try {
    const cityVal = city != null ? (String(city).trim() || null) : null
    const citySlug = cityVal ? toSlug(cityVal) : null
    await client.query(
      `UPDATE companion_profiles SET
         bio                 = COALESCE($1, bio),
         tagline             = COALESCE($2, tagline),
         city                = COALESCE($3, city),
         city_slug           = COALESCE($4, city_slug),
         availability_status = COALESCE($5, availability_status),
         session_modality    = COALESCE($6, session_modality),
         whatsapp_number     = COALESCE($7, whatsapp_number),
         telegram_handle     = COALESCE($8, telegram_handle),
         instagram_handle    = COALESCE($9, instagram_handle),
         website_url         = COALESCE($10, website_url),
         hourly_rate         = COALESCE($11::numeric, hourly_rate),
         gender              = COALESCE($12, gender),
         height_cm           = COALESCE($13::integer, height_cm),
         body_type           = COALESCE($14, body_type),
         eye_color           = COALESCE($15, eye_color),
         hair_color          = COALESCE($16, hair_color),
         skin_color          = COALESCE($17, skin_color),
         ethnicity           = COALESCE($18, ethnicity),
         languages           = COALESCE($19, languages),
         vibe_tags           = COALESCE($20, vibe_tags),
         currency            = COALESCE($21, currency),
         updated_at          = NOW()
       WHERE companion_id = $22`,
      [
        bio ?? null,
        tagline ?? null,
        cityVal,
        citySlug,
        availability_status ?? null,
        session_modality ?? null,
        whatsapp_number ?? null,
        telegram_handle ?? null,
        instagram_handle ?? null,
        website_url ?? null,
        hourly_rate !== '' && hourly_rate != null ? parseFloat(String(hourly_rate)) : null,
        gender ?? null,
        height_cm != null ? parseInt(String(height_cm)) : null,
        body_type ?? null,
        eye_color ?? null,
        hair_color ?? null,
        skin_color ?? null,
        ethnicity ?? null,
        languages != null ? JSON.stringify(languages) : null,
        vibe_tags != null ? JSON.stringify(vibe_tags) : null,
        currency ?? null,
        session.sub,
      ]
    )
    if (display_name != null) {
      await client.query('UPDATE companions SET alias = $1, updated_at = NOW() WHERE id = $2', [
        String(display_name) || null,
        session.sub,
      ])
    }
    if (full_name != null && String(full_name).trim()) {
      await client.query('UPDATE companions SET full_name = $1, updated_at = NOW() WHERE id = $2', [
        String(full_name).trim(),
        session.sub,
      ])
    }
    if (date_of_birth != null) {
      await client.query('UPDATE companions SET date_of_birth = $1, updated_at = NOW() WHERE id = $2', [
        date_of_birth,
        session.sub,
      ])
    }
    if (country != null) {
      const countryVal = String(country).trim() || null
      await client.query('UPDATE companions SET country = $1, updated_at = NOW() WHERE id = $2', [
        countryVal,
        session.sub,
      ])
      const countrySlug = countryVal ? toSlug(countryVal) : null
      await client.query(
        'UPDATE companion_profiles SET country_slug = $1, updated_at = NOW() WHERE companion_id = $2',
        [countrySlug, session.sub]
      )
    }
    if (whatsapp_number) {
      await client.query(
        'UPDATE companions SET whatsapp_number = $1, updated_at = NOW() WHERE id = $2',
        [whatsapp_number, session.sub]
      )
    }

    // Sync vibe_tags JSON → companion_vibe_tags junction table (shared DB with blushbite.co)
    if (vibe_tags !== undefined) {
      const profileRow = await client.query<{ id: string }>(
        `SELECT id FROM companion_profiles WHERE companion_id = $1`,
        [session.sub]
      )
      const profileId = profileRow.rows[0]?.id
      if (profileId) {
        await client.query(
          `DELETE FROM companion_vibe_tags WHERE companion_profile_id = $1`,
          [profileId]
        )
        const tags = Array.isArray(vibe_tags) ? vibe_tags : []
        if (tags.length > 0) {
          await client.query(
            `INSERT INTO companion_vibe_tags (companion_profile_id, vibe_tag_id)
             SELECT $1, id FROM vibe_tags
             WHERE name = ANY($2::text[]) AND is_active = true
             ON CONFLICT DO NOTHING`,
            [profileId, tags]
          )
        }
      }
    }

    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
