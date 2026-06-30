import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    full_name,
    date_of_birth,
    country,
    city,
    whatsapp_number,
    display_name,
    gender,
    tagline,
    bio,
  } = await req.json()

  await Promise.all([
    query(
      `UPDATE companions
       SET full_name = $1, date_of_birth = $2, country = $3, alias = $4
       WHERE id = $5`,
      [full_name || null, date_of_birth || null, country || null, display_name || null, session.sub]
    ),
    query(
      `UPDATE companion_profiles
       SET city = $1, whatsapp_number = $2, gender = $3, tagline = $4, bio = $5
       WHERE companion_id = $6`,
      [
        city || null,
        whatsapp_number || null,
        gender || null,
        tagline || null,
        bio || null,
        session.sub,
      ]
    ),
  ])

  return NextResponse.json({ ok: true })
}
