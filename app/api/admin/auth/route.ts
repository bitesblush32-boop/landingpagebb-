import { NextResponse } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'

// POST /api/admin/auth — set admin cookie
export async function POST(req: Request) {
  let body: { key?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.key || body.key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  const cookieStr = [
    `bb_admin_key=${process.env.CRON_SECRET}`,
    'Path=/admin',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=86400',  // 24 hours
    ...(isProduction ? ['Secure'] : []),
  ].join('; ')

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': cookieStr,
      },
    }
  )
}

// DELETE /api/admin/auth — clear admin cookie
export async function DELETE() {
  const cookieStr = [
    'bb_admin_key=',
    'Path=/admin',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ')

  return NextResponse.json(
    { success: true },
    { headers: { 'Set-Cookie': cookieStr } }
  )
}
