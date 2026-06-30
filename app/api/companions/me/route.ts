import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query<Record<string, unknown>>(
    `SELECT
       c.id, c.email, c.name, c.alias, c.companion_stage, c.full_name,
       c.date_of_birth, c.country, c.whatsapp_number AS companion_whatsapp,
       cp.bio, cp.tagline, cp.city, cp.is_live, cp.is_verified,
       cp.availability_status, cp.whatsapp_number AS profile_whatsapp,
       cp.session_modality, cp.hourly_rate::text AS hourly_rate, cp.currency,
       cp.profile_completeness, cp.is_visible_to_users,
       cp.gender, cp.instagram_handle, cp.website_url,
       cp.height_cm, cp.body_type, cp.eye_color, cp.hair_color, cp.skin_color,
       cop.status AS review_status, cop.notes AS rejection_reason
     FROM companions c
     LEFT JOIN companion_profiles cp ON cp.companion_id = c.id
     LEFT JOIN companion_onboarding_progress cop
            ON cop.companion_id = c.id AND cop.stage = 7
     WHERE c.id = $1`,
    [session.sub]
  )

  if (rows.length === 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const row = rows[0]
  let status = 'pending'
  if (row.review_status === 'rejected') status = 'rejected'
  else if (row.review_status === 'completed' && row.is_live) status = 'approved'

  return NextResponse.json({ ...row, status })
}
