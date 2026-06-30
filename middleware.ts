import { NextRequest, NextResponse } from 'next/server'

// ── Edge-compatible JWT verification (Web Crypto — no Node.js crypto) ──────────
// middleware runs in Edge Runtime; Node.js createHmac is not available there.

const JWT_SECRET = process.env.COMPANION_JWT_SECRET ?? ''

// Must mirror lib/session.ts
const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-bb_session' : 'bb_session'

interface SessionPayload {
  sub: string
  email: string
  name: string
  exp: number
}

function b64urlToBytes(str: string): Uint8Array<ArrayBuffer> {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>
}

function b64urlToString(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return atob(padded)
}

async function verifyJwt(token: string | undefined): Promise<SessionPayload | null> {
  try {
    const parts = (token ?? '').split('.')
    if (parts.length !== 3) return null
    const [hdr, bdy, sig] = parts

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(sig),
      new TextEncoder().encode(`${hdr}.${bdy}`)
    )
    if (!valid) return null

    const payload: SessionPayload = JSON.parse(b64urlToString(bdy))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// ── Route config ──────────────────────────────────────────────────────────────

const PROTECTED = ['/dashboard', '/status', '/reapply']
const PUBLIC_API = [
  '/api/companions/send-otp',
  '/api/companions/verify-otp',
  '/api/companions/apply',
  '/api/companions/login',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isProtectedApi =
    pathname.startsWith('/api/companions/') && !PUBLIC_API.some((p) => pathname.startsWith(p))

  if (!isProtected && !isProtectedApi) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value ?? req.cookies.get('bb_session')?.value

  const payload = await verifyJwt(token)

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
