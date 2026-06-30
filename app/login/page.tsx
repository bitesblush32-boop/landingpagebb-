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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus()
  }, [step])

  async function sendCode() {
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
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
      if (!r.ok) { setError(data.error ?? 'Failed to send code.'); return }
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
    }
  }

  async function verifyCode() {
    const otp = digits.join('')
    if (otp.length < 6) return
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/companions/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error ?? 'Incorrect code.'); return }
      router.push(next)
    } finally {
      setLoading(false)
    }
  }

  const S: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#07090f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
    card: { background: '#0d1117', border: '1px solid #1c2333', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400, position: 'relative', overflow: 'hidden' },
    accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' },
    eyebrow: { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 8 },
    heading: { fontFamily: 'var(--font-serif)', fontSize: 28, color: '#eeeef0', lineHeight: 1.3, marginBottom: 6 },
    sub: { fontSize: 14, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 },
    input: { width: '100%', background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: '#eeeef0', outline: 'none', marginBottom: 8 },
    btn: { width: '100%', background: '#e8607a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 500, cursor: 'pointer', minHeight: 48, transition: 'opacity .15s', opacity: loading ? 0.7 : 1 },
    ghost: { background: 'transparent', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: '8px 0', textAlign: 'left' as const },
    err: { background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 },
    otpRow: { display: 'flex', gap: 8, marginBottom: 24 },
    otpInput: { flex: 1, background: '#111620', border: '1px solid #1c2333', borderRadius: 10, padding: '14px 0', fontSize: 22, fontWeight: 600, color: '#eeeef0', textAlign: 'center' as const, outline: 'none', minHeight: 52 },
    logo: { fontFamily: 'var(--font-serif)', fontSize: 20, color: '#eeeef0', marginBottom: 32, display: 'block' },
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.accent} />
        <span style={S.logo}>BlushBite</span>

        {step === 'email' ? (
          <>
            <p style={S.eyebrow}>Companion portal</p>
            <h1 style={S.heading}>Welcome <em style={{ color: '#e8607a' }}>back.</em></h1>
            <p style={S.sub}>Enter your email and we&apos;ll send a login code.</p>
            {error && <div style={S.err}>{error}</div>}
            <input
              style={S.input}
              type="email"
              placeholder="your@email.com"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendCode()}
            />
            <button style={S.btn} onClick={sendCode} disabled={loading}>
              {loading ? 'Sending…' : 'Send login code'}
            </button>
            <div style={{ marginTop: 24, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
              Don&rsquo;t have an account?{' '}
              <Link href="/" style={{ color: '#e8607a', textDecoration: 'none' }}>Apply as a companion</Link>
            </div>
          </>
        ) : (
          <>
            <p style={S.eyebrow}>Enter your code</p>
            <h1 style={S.heading}>Check your <em style={{ color: '#e8607a' }}>inbox.</em></h1>
            <p style={S.sub}>Sent to {email} — expires in 10 minutes.</p>
            {error && <div style={S.err}>{error}</div>}
            <div style={S.otpRow} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  style={S.otpInput}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                />
              ))}
            </div>
            <button
              style={{ ...S.btn, opacity: loading || digits.join('').length < 6 ? 0.5 : 1 }}
              onClick={verifyCode}
              disabled={loading || digits.join('').length < 6}
            >
              {loading ? 'Verifying…' : 'Enter'}
            </button>
            <button style={{ ...S.ghost, marginTop: 16 }} onClick={() => { setStep('email'); setDigits(['','','','','','']); setError('') }}>
              ← Different email
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
