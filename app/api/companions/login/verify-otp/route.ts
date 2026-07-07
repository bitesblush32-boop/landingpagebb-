import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'
import { query } from '@/lib/db'
import { buildSessionCookie, buildCommunityCookie } from '@/lib/session'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email ?? '').toLowerCase().trim()
  const otp = String(body.otp ?? '').trim()

  const result = verifyOtp(email, otp)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
  }

  const rows = await query<{ id: string; email: string; name: string; gender_community: string }>(
    'SELECT id, email, name, gender_community FROM companions WHERE email = $1 LIMIT 1',
    [email]
  )
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: 'Companion not found.' }, { status: 404 })
  }

  const c = rows[0]

  // Determine where to send the companion after login
  const statusRows = await query<{ review_status: string; is_live: boolean }>(
    `SELECT cop.status AS review_status, COALESCE(cp.is_live, false) AS is_live
     FROM companion_onboarding_progress cop
     LEFT JOIN companion_profiles cp ON cp.companion_id = cop.companion_id
     WHERE cop.companion_id = $1 AND cop.stage = 7
     LIMIT 1`,
    [c.id]
  )

  let redirectTo = '/dashboard'
  if (statusRows.length > 0 && statusRows[0].review_status === 'rejected') redirectTo = '/reapply'

  const res = NextResponse.json({ ok: true, redirectTo })
  res.headers.set('Set-Cookie', buildSessionCookie(c.id, c.email, c.name ?? '', c.gender_community))
  res.headers.append('Set-Cookie', buildCommunityCookie(c.gender_community ?? 'female'))
  return res
}
