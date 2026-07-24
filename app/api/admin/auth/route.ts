import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE = 'bb_admin_key'
const MAX_AGE = 60 * 60 * 24 // 24 hours

export async function POST(req: NextRequest) {
  let body: { key?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const adminKey = process.env.CRON_SECRET
  if (!adminKey || body.key !== adminKey) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE, adminKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
  return NextResponse.json({ success: true })
}
