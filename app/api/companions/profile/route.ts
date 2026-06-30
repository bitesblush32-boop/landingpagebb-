import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Record<string, unknown> = await req.json().catch(() => ({}))
  const {
    bio, tagline, city, availability_status, session_modality,
    whatsapp_number, instagram_handle, website_url, hourly_rate,
    gender, height_cm, body_type, eye_color, hair_color, skin_color,
  } = body

  const AVAIL = ['available','busy','offline']
  const MODALITY = ['in_person','online','both']
  if (availability_status && !AVAIL.includes(String(availability_status)))
    return NextResponse.json({ error: 'Invalid availability status.' }, { status: 400 })
  if (session_modality && !MODALITY.includes(String(session_modality)))
    return NextResponse.json({ error: 'Invalid session modality.' }, { status: 400 })
  if (hourly_rate !== undefined && hourly_rate !== null && hourly_rate !== '') {
    const r = parseFloat(String(hourly_rate))
    if (isNaN(r) || r < 0) return NextResponse.json({ error: 'Hourly rate must be a positive number.' }, { status: 400 })
  }
  if (whatsapp_number && !/^\+[1-9]\d{6,14}$/.test(String(whatsapp_number)))
    return NextResponse.json({ error: 'Invalid WhatsApp number. Use E.164 format.' }, { status: 400 })

  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE companion_profiles SET
         bio                 = COALESCE($1, bio),
         tagline             = COALESCE($2, tagline),
         city                = COALESCE($3, city),
         availability_status = COALESCE($4, availability_status),
         session_modality    = COALESCE($5, session_modality),
         whatsapp_number     = COALESCE($6, whatsapp_number),
         instagram_handle    = COALESCE($7, instagram_handle),
         website_url         = COALESCE($8, website_url),
         hourly_rate         = COALESCE($9::numeric, hourly_rate),
         gender              = COALESCE($10, gender),
         height_cm           = COALESCE($11::integer, height_cm),
         body_type           = COALESCE($12, body_type),
         eye_color           = COALESCE($13, eye_color),
         hair_color          = COALESCE($14, hair_color),
         skin_color          = COALESCE($15, skin_color),
         updated_at          = NOW()
       WHERE companion_id = $16`,
      [
        bio ?? null, tagline ?? null, city ?? null, availability_status ?? null,
        session_modality ?? null, whatsapp_number ?? null, instagram_handle ?? null,
        website_url ?? null,
        (hourly_rate !== '' && hourly_rate != null) ? parseFloat(String(hourly_rate)) : null,
        gender ?? null,
        height_cm != null ? parseInt(String(height_cm)) : null,
        body_type ?? null, eye_color ?? null, hair_color ?? null, skin_color ?? null,
        session.sub,
      ]
    )
    if (whatsapp_number) {
      await client.query(
        'UPDATE companions SET whatsapp_number = $1, updated_at = NOW() WHERE id = $2',
        [whatsapp_number, session.sub]
      )
    }
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
