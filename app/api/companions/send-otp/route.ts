import { NextRequest, NextResponse } from 'next/server'
import { generateOtp, storeOtp, checkRate } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email ?? '').toLowerCase().trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!checkRate(email)) {
    return NextResponse.json({ error: 'Too many code requests. Please wait 10 minutes.' }, { status: 429 })
  }

  const otp = generateOtp()
  storeOtp(email, otp)

  try {
    await sendOtpEmail(email, otp)
  } catch (err) {
    console.error('[send-otp]', err)
    return NextResponse.json({ error: 'Could not send the code. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
