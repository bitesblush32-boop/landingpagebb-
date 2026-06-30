import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt, COOKIE_NAME } from '@/lib/session'

const PROTECTED = ['/dashboard', '/status', '/reapply']
const PUBLIC_API = [
  '/api/companions/send-otp',
  '/api/companions/verify-otp',
  '/api/companions/apply',
  '/api/companions/login',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isProtectedApi =
    pathname.startsWith('/api/companions/') && !PUBLIC_API.some((p) => pathname.startsWith(p))

  if (!isProtected && !isProtectedApi) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value ?? req.cookies.get('bb_session')?.value
  const payload = verifyJwt(token)

  if (!payload) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const res = NextResponse.next()
  res.headers.set('x-companion-id', payload.sub)
  res.headers.set('x-companion-email', payload.email)
  res.headers.set('x-companion-name', payload.name ?? '')
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/status', '/reapply', '/api/companions/:path*'],
}
