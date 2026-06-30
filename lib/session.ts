import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const JWT_SECRET = process.env.COMPANION_JWT_SECRET ?? process.env.JWT_SECRET ?? ''
const IS_PROD = process.env.NODE_ENV === 'production'

export const COOKIE_NAME = IS_PROD ? '__Host-bb_session' : 'bb_session'

export interface SessionPayload {
  sub: string
  email: string
  name: string
  exp: number
}

function base64url(buf: Buffer): string {
  return buf.toString('base64url')
}

export function signJwt(payload: SessionPayload): string {
  const hdr = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const bdy = base64url(Buffer.from(JSON.stringify(payload)))
  const sig = createHmac('sha256', JWT_SECRET).update(`${hdr}.${bdy}`).digest('base64url')
  return `${hdr}.${bdy}.${sig}`
}

export function verifyJwt(token: string | undefined): SessionPayload | null {
  try {
    const parts = (token ?? '').split('.')
    if (parts.length !== 3) return null
    const [hdr, bdy, sig] = parts
    const expected = createHmac('sha256', JWT_SECRET).update(`${hdr}.${bdy}`).digest('base64url')
    const aBuf = Buffer.from(sig, 'base64url')
    const bBuf = Buffer.from(expected, 'base64url')
    if (aBuf.length !== bBuf.length || !timingSafeEqual(aBuf, bBuf)) return null
    const payload: SessionPayload = JSON.parse(Buffer.from(bdy, 'base64url').toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

/** Call from a Server Component or Route Handler (server side only) */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value ?? jar.get('bb_session')?.value
  return verifyJwt(token)
}

/** Read session from the incoming request (middleware / Route Handler req) */
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? req.cookies.get('bb_session')?.value
  return verifyJwt(token)
}

/** Build the Set-Cookie header value */
export function buildSessionCookie(companionId: string, email: string, name: string): string {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  const token = signJwt({ sub: companionId, email, name, exp })
  const secure = IS_PROD ? 'Secure; ' : ''
  return `${COOKIE_NAME}=${token}; HttpOnly; ${secure}SameSite=Strict; Path=/; Max-Age=604800`
}

export function clearSessionCookie(): string {
  const secure = IS_PROD ? 'Secure; ' : ''
  return `${COOKIE_NAME}=; HttpOnly; ${secure}SameSite=Strict; Path=/; Max-Age=0`
}
