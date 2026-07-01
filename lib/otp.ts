/**
 * In-memory OTP store — works correctly on Railway (persistent Node.js process).
 * Module-level singletons persist across requests within the same process.
 */

interface OtpEntry {
  otp: string
  expiry: number // ms since epoch
  attempts: number
}

interface RateEntry {
  count: number
  windowStart: number // ms since epoch
}

const OTP_TTL = 10 * 60 * 1000 // 10 minutes
const RATE_WINDOW = 10 * 60 * 1000 // 10 minutes
const RATE_MAX = 3

declare global {
  var _otpStore: Map<string, OtpEntry> | undefined
  var _rateStore: Map<string, RateEntry> | undefined
}

const otpStore: Map<string, OtpEntry> = global._otpStore ?? (global._otpStore = new Map())
const rateStore: Map<string, RateEntry> = global._rateStore ?? (global._rateStore = new Map())

export function generateOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000))
}

export function storeOtp(email: string, otp: string): void {
  // Sweep expired entries to prevent unbounded memory growth
  const now = Date.now()
  for (const [key, entry] of otpStore) {
    if (now > entry.expiry) otpStore.delete(key)
  }
  otpStore.set(email, { otp, expiry: now + OTP_TTL, attempts: 0 })
}

export function verifyOtp(email: string, otp: string): { ok: boolean; error?: string } {
  const entry = otpStore.get(email)
  if (!entry) return { ok: false, error: 'No code sent for this email. Request a new one.' }
  if (Date.now() > entry.expiry) {
    otpStore.delete(email)
    return { ok: false, error: 'Code expired. Request a new one.' }
  }
  if (entry.attempts >= 5) {
    otpStore.delete(email)
    return { ok: false, error: 'Too many attempts. Request a new code.' }
  }
  if (entry.otp !== otp) {
    entry.attempts++
    return { ok: false, error: 'That code is incorrect.' }
  }
  otpStore.delete(email)
  return { ok: true }
}

export function checkRate(email: string): boolean {
  const now = Date.now()
  const e = rateStore.get(email)
  if (!e || now - e.windowStart > RATE_WINDOW) {
    rateStore.set(email, { count: 1, windowStart: now })
    return true
  }
  if (e.count >= RATE_MAX) return false
  e.count++
  return true
}
