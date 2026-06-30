import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email ?? '').toLowerCase().trim()
  const otp = String(body.otp ?? '').trim()

  const result = verifyOtp(email, otp)
  if (!result.ok) {
    return NextResponse.json({ verified: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ verified: true })
}
