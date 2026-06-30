import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'
import { query } from '@/lib/db'
import { buildSessionCookie } from '@/lib/session'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email ?? '').toLowerCase().trim()
  const otp = String(body.otp ?? '').trim()

  const result = verifyOtp(email, otp)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
  }

  const rows = await query<{ id: string; email: string; name: string }>(
    'SELECT id, email, name FROM companions WHERE email = $1 LIMIT 1',
    [email]
  )
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: 'Companion not found.' }, { status: 404 })
  }

  const c = rows[0]
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', buildSessionCookie(c.id, c.email, c.name ?? ''))
  return res
}
