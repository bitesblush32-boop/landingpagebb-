'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 80)
    }
  }, [step])

  async function sendCode() {
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That doesn't look like a valid email — try again.")
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/companions/login/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'Failed to send code.')
        return
      }
      setAnimKey((k) => k + 1)
      setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  function handleDigit(idx: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = v
    setDigits(next)
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus()
    if (next.every((d) => d) && v) verifyCode(next.join(''))
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      inputRefs.current[5]?.focus()
      verifyCode(text)
    }
  }

  async function verifyCode(otp?: string) {
    const code = otp ?? digits.join('')
    if (code.length < 6) return
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/companions/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? "That code isn't right — check your inbox and try again.")
        return
      }
      setVerified(true)
      const destination = data.redirectTo ?? next
      setTimeout(() => { window.location.href = destination }, 900)
    } finally {
      setLoading(false)
    }
  }

  function resetToEmail() {
    setStep('email')
    setDigits(['', '', '', '', '', ''])
    setError('')
    setVerified(false)
    setAnimKey((k) => k + 1)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: '#07090f' }}
    >
      {/* Ambient rose glow — GPU composited via opacity */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 38%, rgba(232,96,122,0.065) 0%, transparent 68%)',
        }}
      />
      {/* Faint grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(232,96,122,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(232,96,122,0.03) 1px,transparent 1px)',
          backgroundSize: '56px 56px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 75%)',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 75%)',
        }}
      />

      <div className="relative w-full max-w-[420px] animate-fade-up">
        {/* ── Card ── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: '#0d1117', border: '1px solid #1c2333' }}
        >
          {/* Top iridescent line */}
          <div
            className="h-px w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, #e8607a 35%, #c9a96e 65%, transparent 100%)',
            }}
          />

          <div className="px-7 pt-7 pb-9 sm:px-9 sm:pt-9">
            {/* Logo */}
            <span
              className="block mb-8 tracking-wide text-xl"
              style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
            >
              BlushBite
            </span>

            {/* ── Step: email ── */}
            {step === 'email' && (
              <div key={`email-${animKey}`} className="animate-fade-up">
                <p
                  className="text-[11px] uppercase tracking-[0.11em] mb-2"
                  style={{ color: '#6b7280' }}
                >
                  Companion portal
                </p>
                <h1
                  className="text-[28px] sm:text-[30px] leading-tight mb-2"
                  style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
                >
                  Welcome{' '}
                  <em className="italic" style={{ color: '#e8607a' }}>
                    back.
                  </em>
                </h1>
                <p className="text-[14px] leading-relaxed mb-7" style={{ color: '#6b7280' }}>
                  Enter your email and we&apos;ll send a private login code.
                </p>

                {error && (
                  <div
                    className="rounded-xl px-4 py-3 text-[13px] mb-5 animate-fade-in"
                    style={{
                      background: 'rgba(248,113,113,0.08)',
                      border: '1px solid rgba(248,113,113,0.25)',
                      color: '#f87171',
                    }}
                  >
                    {error}
                  </div>
                )}

                <input
                  type="email"
                  placeholder="your@email.com"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                  className="w-full rounded-xl px-4 text-[16px] outline-none mb-3 min-h-[52px] transition-all duration-[150ms]"
                  style={{
                    background: '#111620',
                    border: '1px solid #1c2333',
                    color: '#eeeef0',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#e8607a'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#1c2333'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />

                <button
                  onClick={sendCode}
                  disabled={loading}
                  className="w-full rounded-xl text-[15px] min-h-[52px] transition-all duration-[150ms] active:scale-[0.98] active:opacity-90 disabled:opacity-60 cursor-pointer"
                  style={{
                    background: '#f0ece4',
                    color: '#0d1117',
                    border: 'none',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                  }}
                  onMouseOver={(e) => {
                    if (!loading) (e.currentTarget as HTMLElement).style.background = '#e2ddd6'
                  }}
                  onMouseOut={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = '#f0ece4'
                  }}
                >
                  {loading ? 'Sending…' : 'Send login code'}
                </button>

                <p className="text-center text-[13px] mt-6" style={{ color: '#6b7280' }}>
                  No account?{' '}
                  <Link
                    href="/"
                    style={{ color: '#e8607a', textDecoration: 'none' }}
                    className="hover:underline"
                  >
                    Apply as a companion
                  </Link>
                </p>
              </div>
            )}

            {/* ── Step: OTP ── */}
            {step === 'otp' && (
              <div key={`otp-${animKey}`} className="animate-fade-up">
                {verified ? (
                  /* ── Verified state ── */
                  <div className="flex flex-col items-center py-6 animate-scale-in">
                    <div
                      className="check-draw w-16 h-16 rounded-full flex items-center justify-center mb-5"
                      style={{
                        background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.3)',
                      }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p
                      className="text-[18px] mb-1"
                      style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
                    >
                      Identity confirmed.
                    </p>
                    <p className="text-[13px]" style={{ color: '#6b7280' }}>
                      Stepping into your world…
                    </p>
                  </div>
                ) : (
                  <>
                    <p
                      className="text-[11px] uppercase tracking-[0.11em] mb-2"
                      style={{ color: '#6b7280' }}
                    >
                      Your private code
                    </p>
                    <h1
                      className="text-[28px] sm:text-[30px] leading-tight mb-1"
                      style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
                    >
                      Check your{' '}
                      <em className="italic" style={{ color: '#e8607a' }}>
                        inbox.
                      </em>
                    </h1>
                    <p className="text-[14px] leading-relaxed mb-7" style={{ color: '#6b7280' }}>
                      Sent to <span style={{ color: '#c9a96e', fontWeight: 500 }}>{email}</span>
                      <span className="block text-[11px] mt-0.5" style={{ color: '#4b5563' }}>
                        expires in 10 min · private · secure
                      </span>
                    </p>

                    {error && (
                      <div
                        className="rounded-xl px-4 py-3 text-[13px] mb-5 animate-fade-in"
                        style={{
                          background: 'rgba(248,113,113,0.08)',
                          border: '1px solid rgba(248,113,113,0.25)',
                          color: '#f87171',
                        }}
                      >
                        {error}
                      </div>
                    )}

                    {/* ── OTP boxes ── */}
                    <div className="flex gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
                      {digits.map((d, i) => (
                        <OtpBox
                          key={i}
                          idx={i}
                          value={d}
                          inputRef={(el) => {
                            inputRefs.current[i] = el
                          }}
                          onChange={handleDigit}
                          onKeyDown={handleKeyDown}
                        />
                      ))}
                    </div>

                    {loading && (
                      <p className="text-center text-[13px] mb-4" style={{ color: '#6b7280' }}>
                        <span className="inline-block animate-pulse">Verifying…</span>
                      </p>
                    )}

                    <button
                      onClick={() => verifyCode()}
                      disabled={loading || digits.join('').length < 6}
                      className="w-full rounded-xl text-[15px] min-h-[52px] transition-all duration-[150ms] active:scale-[0.98] disabled:opacity-40 cursor-pointer mb-5"
                      style={{
                        background: '#f0ece4',
                        color: '#0d1117',
                        border: 'none',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                      }}
                    >
                      {loading ? 'Verifying…' : 'Enter'}
                    </button>

                    <button
                      onClick={resetToEmail}
                      className="text-[13px] bg-transparent border-none p-0 cursor-pointer transition-colors duration-[150ms]"
                      style={{ color: '#4b5563' }}
                      onMouseOver={(e) => {
                        ;(e.currentTarget as HTMLElement).style.color = '#eeeef0'
                      }}
                      onMouseOut={(e) => {
                        ;(e.currentTarget as HTMLElement).style.color = '#4b5563'
                      }}
                    >
                      ← Different email
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer trust */}
        <p className="text-center text-[11px] mt-5" style={{ color: '#374151' }}>
          Your identity stays private — always. EU‑hosted · GDPR compliant.
        </p>
      </div>
    </div>
  )
}

/* ── OTP single digit box ── */
function OtpBox({
  idx,
  value,
  inputRef,
  onChange,
  onKeyDown,
}: {
  idx: number
  value: string
  inputRef: (el: HTMLInputElement | null) => void
  onChange: (idx: number, val: string) => void
  onKeyDown: (idx: number, e: React.KeyboardEvent) => void
}) {
  const filled = value !== ''
  const [focused, setFocused] = useState(false)

  return (
    <input
      ref={inputRef}
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(idx, e.target.value)}
      onKeyDown={(e) => onKeyDown(idx, e)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-10 h-10 text-center text-[16px] font-semibold rounded-lg outline-none transition-all duration-[150ms]"
      style={{
        background: '#111620',
        border: `1px solid ${filled ? 'rgba(201,169,110,0.5)' : focused ? '#e8607a' : '#1c2333'}`,
        color: filled ? '#c9a96e' : '#eeeef0',
        boxShadow: filled
          ? '0 0 0 3px rgba(201,169,110,0.09)'
          : focused
            ? '0 0 0 3px rgba(232,96,122,0.13)'
            : 'none',
      }}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
