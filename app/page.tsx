'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Constants ────────────────────────────────────────────────────────────────

const GENDERS = [
  { v: 'woman', label: 'Woman' },
  { v: 'man', label: 'Man' },
  { v: 'non_binary', label: 'Non-binary' },
  { v: 'trans_woman', label: 'Trans woman' },
  { v: 'trans_man', label: 'Trans man' },
  { v: 'genderqueer', label: 'Genderqueer' },
  { v: 'genderfluid', label: 'Genderfluid' },
  { v: 'agender', label: 'Agender' },
  { v: 'other', label: 'Other' },
  { v: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const MODALITIES = [
  { v: 'in_person', label: 'In Person' },
  { v: 'online', label: 'Online' },
  { v: 'both', label: 'Both' },
]

const COUNTRIES: { code: string; name: string; dial: string }[] = [
  { code: 'NL', name: 'Netherlands', dial: '+31' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'BE', name: 'Belgium', dial: '+32' },
  { code: 'ES', name: 'Spain', dial: '+34' },
  { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'CH', name: 'Switzerland', dial: '+41' },
  { code: 'AT', name: 'Austria', dial: '+43' },
  { code: 'SE', name: 'Sweden', dial: '+46' },
  { code: 'DK', name: 'Denmark', dial: '+45' },
  { code: 'NO', name: 'Norway', dial: '+47' },
  { code: 'FI', name: 'Finland', dial: '+358' },
  { code: 'PT', name: 'Portugal', dial: '+351' },
  { code: 'PL', name: 'Poland', dial: '+48' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420' },
  { code: 'HU', name: 'Hungary', dial: '+36' },
  { code: 'RO', name: 'Romania', dial: '+40' },
  { code: 'GR', name: 'Greece', dial: '+30' },
  { code: 'IE', name: 'Ireland', dial: '+353' },
  { code: 'HR', name: 'Croatia', dial: '+385' },
  { code: 'SK', name: 'Slovakia', dial: '+421' },
  { code: 'BG', name: 'Bulgaria', dial: '+359' },
  { code: 'EE', name: 'Estonia', dial: '+372' },
  { code: 'LV', name: 'Latvia', dial: '+371' },
  { code: 'LT', name: 'Lithuania', dial: '+370' },
  { code: 'LU', name: 'Luxembourg', dial: '+352' },
  { code: 'MT', name: 'Malta', dial: '+356' },
  { code: 'CY', name: 'Cyprus', dial: '+357' },
  { code: 'UA', name: 'Ukraine', dial: '+380' },
  { code: 'RS', name: 'Serbia', dial: '+381' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'BR', name: 'Brazil', dial: '+55' },
  { code: 'MX', name: 'Mexico', dial: '+52' },
  { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'CO', name: 'Colombia', dial: '+57' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'KR', name: 'South Korea', dial: '+82' },
  { code: 'TH', name: 'Thailand', dial: '+66' },
  { code: 'PH', name: 'Philippines', dial: '+63' },
  { code: 'MY', name: 'Malaysia', dial: '+60' },
  { code: 'ID', name: 'Indonesia', dial: '+62' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'NG', name: 'Nigeria', dial: '+234' },
  { code: 'KE', name: 'Kenya', dial: '+254' },
  { code: 'TR', name: 'Turkey', dial: '+90' },
]

const FEATURES = [
  { title: 'Trusted, vetted dreamers', body: 'Every dreamer passes age verification and onboarding before they can reach you. No cold enquiries, no browsers. People who arrive have genuine intent — and they are ready to book.' },
  { title: 'Fast, transparent payments', body: 'Session earnings are released quickly and transparently. No waiting weeks, no opaque fee structures. Your rate is your rate — end of conversation.' },
  { title: 'Complete anonymity, always', body: 'Your alias is your only identity on BlushBite. Real name, phone number, and location are never shown to dreamers. EU-hosted and GDPR-compliant.' },
  { title: 'In-person, online, or both', body: 'Set your own session modality when you apply. Work from your city, from home, or anywhere with a connection. Change your settings any time from your dashboard.' },
  { title: 'You set your own rates', body: 'You price every session. Duration, type, and fee are yours to define on your own session cards. The platform never negotiates on your behalf.' },
  { title: 'Build a following with stories', body: 'Publish stories that keep dreamers returning between sessions. Your content builds your brand and your income — active story libraries consistently earn more.' },
  { title: 'Gold Verified & Licensed badge', body: 'Pass our review and earn the gold ✦ Verified & Licensed badge. Dreamers trust it on arrival — before they read a single word of your bio.' },
  { title: 'Real analytics — not guesswork', body: 'See profile views, story saves, and returning dreamers from your companion dashboard. Understand what resonates, then grow with data, not gut feeling.' },
]

const ACCESS_LIST = [
  'Companion dashboard & profile builder',
  'Story & audio publishing tools',
  'Session card builder — set your own prices',
  'Photo & video gallery management',
  'Analytics & audience insights',
  'Direct dreamer booking system',
  'Gold Verified & Licensed badge',
  'Dedicated companion support team',
]

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: { background: '#07090f', color: '#eeeef0', minHeight: '100vh', overflowX: 'hidden' as const },
  nav: { position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 900, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(7,9,15,.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1c2333' },
  navLogo: { fontFamily: 'var(--font-serif)', fontSize: 20, color: '#eeeef0', textDecoration: 'none' },
  navPill: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#e8607a', background: 'rgba(232,96,122,.1)', border: '1px solid rgba(232,96,122,.28)', padding: '8px 18px', borderRadius: 24, minHeight: 44, cursor: 'pointer', textDecoration: 'none' as const },
  hero: { position: 'relative' as const, minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const, padding: '120px 24px 80px' },
  heroGrid: { position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const, backgroundImage: 'linear-gradient(rgba(232,96,122,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(232,96,122,.05) 1px,transparent 1px)', backgroundSize: '60px 60px', WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%,black 25%,transparent 80%)', maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%,black 25%,transparent 80%)' },
  heroGlow: { position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const, background: 'radial-gradient(ellipse 72% 58% at 50% 28%,rgba(232,96,122,.07) 0%,transparent 70%)' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: '#e8607a', background: 'rgba(232,96,122,.1)', border: '1px solid rgba(232,96,122,.25)', padding: '6px 13px', borderRadius: 20, marginBottom: 28 },
  chipDot: { width: 6, height: 6, borderRadius: '50%', background: '#e8607a' },
  h1: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px,5.5vw,60px)', fontWeight: 400, lineHeight: 1.13, color: '#eeeef0', marginBottom: 20, maxWidth: 680 },
  heroSub: { fontSize: 15, color: '#6b7280', lineHeight: 1.75, maxWidth: 460, marginBottom: 40 },
  section: { maxWidth: 1100, margin: '0 auto', padding: '80px 24px' },
  sLabel: { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 8 },
  sTitle: { fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 400, color: '#eeeef0', lineHeight: 1.2, marginBottom: 14, maxWidth: 600 },
  sSub: { fontSize: 15, color: '#6b7280', lineHeight: 1.75, maxWidth: 520, marginBottom: 48 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, overflow: 'hidden', marginBottom: 48 },
  stat: { padding: '28px 20px', textAlign: 'center' as const, borderRight: '1px solid #1c2333' },
  statNum: { display: 'block', fontFamily: 'var(--font-serif)', fontSize: 34, color: '#c9a96e', lineHeight: 1, marginBottom: 6 },
  statLabel: { display: 'block', fontSize: 11, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.07em', lineHeight: 1.4 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 },
  featureCard: { background: '#111620', border: '1px solid #1c2333', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 10 },
  fCardAccent: { width: 28, height: 3, background: '#e8607a', borderRadius: 2 },
  fCardTitle: { fontSize: 14, fontWeight: 500, color: '#eeeef0' },
  fCardBody: { fontSize: 13, color: '#6b7280', lineHeight: 1.75 },
  highlightCard: { background: '#0d1117', border: '1px solid rgba(232,96,122,.2)', borderRadius: 16, padding: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' },
  highlightTitle: { fontFamily: 'var(--font-serif)', fontSize: 26, color: '#eeeef0', lineHeight: 1.35, marginBottom: 16 },
  highlightBody: { fontSize: 13, color: '#6b7280', lineHeight: 1.8 },
  accessItem: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#eeeef0', padding: '10px 0', borderBottom: '1px solid #1c2333' },
  accessDot: { color: '#c9a96e', flexShrink: 0 },
  howStep: { display: 'flex', gap: 24, alignItems: 'flex-start', padding: '28px 0', borderBottom: '1px solid #1c2333' },
  howNum: { fontFamily: 'var(--font-serif)', fontSize: 42, color: 'rgba(232,96,122,.25)', lineHeight: 1, flexShrink: 0, width: 48 },
  howTitle: { fontSize: 16, fontWeight: 500, color: '#eeeef0', marginBottom: 6 },
  howBody: { fontSize: 13, color: '#6b7280', lineHeight: 1.75 },
  applySection: { maxWidth: 640, margin: '0 auto', padding: '80px 24px' },
  card: { background: '#0d1117', border: '1px solid #1c2333', borderRadius: 20, overflow: 'hidden', padding: 32 },
  stepTrack: { display: 'flex', gap: 8, marginBottom: 32 },
  stepDot: (active: boolean, done: boolean): React.CSSProperties => ({ flex: 1, height: 3, borderRadius: 2, background: done ? '#e8607a' : active ? 'rgba(232,96,122,.6)' : '#1c2333', transition: 'background .3s' }),
  label: { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 6 },
  heading: { fontFamily: 'var(--font-serif)', fontSize: 26, color: '#eeeef0', lineHeight: 1.3, marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 28 },
  fieldLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#eeeef0', outline: 'none', marginBottom: 16 },
  select: { width: '100%', background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#eeeef0', outline: 'none', marginBottom: 16, cursor: 'pointer', appearance: 'none' as const },
  textarea: { width: '100%', background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#eeeef0', outline: 'none', resize: 'vertical' as const, minHeight: 80, marginBottom: 16 },
  pillRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 },
  btnPrimary: { width: '100%', background: '#e8607a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 500, cursor: 'pointer', minHeight: 48, marginTop: 8 },
  btnBack: { background: 'transparent', border: '1px solid #1c2333', color: '#6b7280', borderRadius: 12, padding: '12px 20px', fontSize: 14, cursor: 'pointer', minHeight: 48 },
  err: { background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 },
  otpRow: { display: 'flex', gap: 8, marginBottom: 24 },
  otpInput: { flex: 1, background: '#111620', border: '1px solid #1c2333', borderRadius: 10, padding: '14px 0', fontSize: 22, fontWeight: 600, color: '#eeeef0', textAlign: 'center' as const, outline: 'none', minHeight: 52 },
  photoDrop: { border: '2px dashed #1c2333', borderRadius: 14, padding: '28px 16px', textAlign: 'center' as const, cursor: 'pointer', marginBottom: 16 },
  divider: { height: 1, background: '#1c2333', maxWidth: 1100, margin: '0 auto' },
  trustBar: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center', gap: '12px 32px', padding: '20px 24px', borderTop: '1px solid #1c2333', borderBottom: '1px solid #1c2333', background: '#0d1117' },
  trustItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' },
  footer: { borderTop: '1px solid #1c2333', padding: '32px 24px', textAlign: 'center' as const, fontSize: 12, color: '#4b5563' },
}

// ── Pill component ────────────────────────────────────────────────────────────

function Pill({ val, current, label, onClick }: { val: string; current: string; label: string; onClick: () => void }) {
  const active = current === val
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', minHeight: 34,
      border: `1px solid ${active ? '#e8607a' : '#1c2333'}`,
      color: active ? '#e8607a' : '#6b7280',
      background: active ? 'rgba(232,96,122,.1)' : 'transparent',
    }}>
      {label}
    </button>
  )
}

// ── Apply Form ────────────────────────────────────────────────────────────────

function ApplyForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [verified, setVerified] = useState(false)

  // Step 2
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [whatsappNum, setWhatsappNum] = useState('')

  // Step 3
  const [displayName, setDisplayName] = useState('')
  const [gender, setGender] = useState('')
  const [tagline, setTagline] = useState('')
  const [bio, setBio] = useState('')
  const [modality, setModality] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')

  const dialCode = COUNTRIES.find(c => c.code === country)?.dial ?? ''
  const whatsappFull = dialCode && whatsappNum ? `${dialCode}${whatsappNum.replace(/^0+/, '')}` : whatsappNum

  // ── OTP ──────────────────────────────────────────────────────────────────

  async function sendOtp() {
    setError('')
    if (!fullName.trim()) { setError('Enter your full name.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email.'); return }
    if (!dob) { setError('Enter your date of birth.'); return }
    const age = (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (age < 18) { setError('You must be 18 or older to apply.'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/companions/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Failed to send code.'); return }
      setOtpSent(true)
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } finally { setLoading(false) }
  }

  function handleDigit(idx: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[idx] = v; setDigits(next)
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (next.every(d => d) && v) verifyOtpAuto(next.join(''))
  }

  function handleDigitKey(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) { setDigits(text.split('')); otpRefs.current[5]?.focus(); verifyOtpAuto(text) }
  }

  async function verifyOtpAuto(otp: string) {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/companions/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Incorrect code.'); return }
      setVerified(true)
    } finally { setLoading(false) }
  }

  // ── Step navigation ───────────────────────────────────────────────────────

  function step1Next() {
    if (!verified) { setError('Please verify your email first.'); return }
    setError(''); setStep(2)
    window.scrollTo({ top: document.getElementById('apply')?.offsetTop ?? 0, behavior: 'smooth' })
  }

  function step2Next() {
    setError('')
    if (!country) { setError('Select your country.'); return }
    if (!city.trim()) { setError('Enter your city.'); return }
    if (!whatsappFull.match(/^\+\d{7,15}$/)) { setError('Enter a valid WhatsApp number.'); return }
    setStep(3)
    window.scrollTo({ top: document.getElementById('apply')?.offsetTop ?? 0, behavior: 'smooth' })
  }

  function onPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)) }
  }, [])

  async function submitApplication() {
    setError('')
    if (!displayName.trim()) { setError('Enter your display name.'); return }
    if (!gender) { setError('Select your gender identity.'); return }
    if (!tagline.trim()) { setError('Write a vibe headline.'); return }
    if (!bio.trim()) { setError('Write something about yourself.'); return }
    if (!modality) { setError('Select your session type.'); return }
    setLoading(true)
    try {
      let photoUrl: string | undefined
      if (photoFile) {
        const form = new FormData(); form.append('file', photoFile)
        const r = await fetch('/api/companions/upload-photo', { method: 'POST', body: form })
        const d = await r.json()
        if (!r.ok) { setError(d.error ?? 'Photo upload failed.'); return }
        photoUrl = d.url
      }
      const r = await fetch('/api/companions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName, email, dateOfBirth: dob, country, city,
          whatsappNumber: whatsappFull,
          displayName, gender, tagline, bio,
          sessionModality: modality,
          ...(photoUrl ? { profilePhotoUrl: photoUrl } : {}),
        }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Submission failed.'); return }
      router.push(d.redirectTo ?? '/status?new=1')
    } finally { setLoading(false) }
  }

  return (
    <div style={S.card}>
      <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#e8607a,transparent)', margin: '-32px -32px 32px' }} />

      {/* Step progress */}
      <div style={S.stepTrack}>
        {[1, 2, 3].map(n => (
          <div key={n} style={S.stepDot(step === n, step > n)} />
        ))}
      </div>

      {error && <div style={S.err}>{error}</div>}

      {/* ── Step 1: Identity + OTP ── */}
      {step === 1 && (
        <>
          <p style={S.label}>Step 1 of 3</p>
          <h2 style={S.heading}>Who <em style={{ color: '#e8607a', fontStyle: 'italic' }}>you are</em></h2>
          <p style={S.sub}>We review every application personally. Start with the basics.</p>

          {!otpSent ? (
            <>
              <label style={S.fieldLabel}>Full name</label>
              <input style={S.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your legal name (stays private)" autoComplete="name" />

              <label style={S.fieldLabel}>Email address</label>
              <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" inputMode="email" autoComplete="email" />

              <label style={S.fieldLabel}>Date of birth</label>
              <input style={S.input} type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().slice(0, 10)} />
              <p style={{ fontSize: 11, color: '#4b5563', marginTop: -12, marginBottom: 16 }}>Must be 18 or older. Never shown publicly.</p>

              <button style={{ ...S.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={sendOtp} disabled={loading}>
                {loading ? 'Sending…' : 'Send verification code →'}
              </button>
            </>
          ) : !verified ? (
            <>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
                Code sent to <strong style={{ color: '#eeeef0' }}>{email}</strong>
              </p>
              <div style={S.otpRow} onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    style={S.otpInput}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleDigitKey(i, e)}
                  />
                ))}
              </div>
              {loading && <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 12 }}>Verifying…</p>}
              <button style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: 0 }} onClick={() => { setOtpSent(false); setDigits(['', '', '', '', '', '']) }}>
                ← Different email
              </button>
            </>
          ) : (
            <>
              <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#22c55e', marginBottom: 20 }}>
                ✓ Email verified
              </div>
              <button style={{ ...S.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={step1Next} disabled={loading}>
                Continue →
              </button>
            </>
          )}
        </>
      )}

      {/* ── Step 2: Location ── */}
      {step === 2 && (
        <>
          <p style={S.label}>Step 2 of 3</p>
          <h2 style={S.heading}>Where <em style={{ color: '#e8607a', fontStyle: 'italic' }}>you are</em></h2>
          <p style={S.sub}>Let us know where you are based and how dreamers can reach you privately.</p>

          <label style={S.fieldLabel}>Country</label>
          <select style={S.select} value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">Select your country</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>

          <label style={S.fieldLabel}>City</label>
          <input style={S.input} value={city} onChange={e => setCity(e.target.value)} placeholder="Amsterdam" inputMode="text" autoCapitalize="words" />

          <label style={S.fieldLabel}>WhatsApp number</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {dialCode && (
              <div style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#9ca3af', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {dialCode}
              </div>
            )}
            <input
              style={{ ...S.input, marginBottom: 0, flex: 1 }}
              value={whatsappNum}
              onChange={e => setWhatsappNum(e.target.value)}
              placeholder={dialCode ? '612 345 678' : '+31 612 345 678'}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 20 }}>Used for private booking notifications only — never shown to dreamers.</p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button style={S.btnBack} onClick={() => setStep(1)}>←</button>
            <button style={{ ...S.btnPrimary, marginTop: 0, opacity: loading ? 0.6 : 1 }} onClick={step2Next} disabled={loading}>
              Continue →
            </button>
          </div>
        </>
      )}

      {/* ── Step 3: Essence ── */}
      {step === 3 && (
        <>
          <p style={S.label}>Step 3 of 3</p>
          <h2 style={S.heading}>Your <em style={{ color: '#e8607a', fontStyle: 'italic' }}>essence</em></h2>
          <p style={S.sub}>How dreamers will first meet you. Write as if you are whispering into someone&rsquo;s ear.</p>

          <label style={S.fieldLabel}>Profile photo <span style={{ color: '#4b5563', fontSize: 10 }}>(optional)</span></label>
          {photoPreview ? (
            <div style={{ position: 'relative', width: 110, height: 150, marginBottom: 16, borderRadius: 10, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(''); if (fileRef.current) fileRef.current.value = '' }}
                style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, background: 'rgba(7,9,15,.85)', borderRadius: '50%', border: '1px solid #1c2333', color: '#eeeef0', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          ) : (
            <div
              style={S.photoDrop}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,96,122,.5)' }}
              onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1c2333' }}
              onDrop={handleDrop}
            >
              <div style={{ fontSize: 26, color: '#6b7280', marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Click or drag a photo here</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>JPG or PNG · max 5 MB · face clearly visible</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={onPhotoSelect} />
          <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 16 }}>A clear photo helps our review team — not shown publicly until you go live.</p>

          <label style={S.fieldLabel}>Display name</label>
          <input style={S.input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="The name dreamers will know you by" maxLength={60} inputMode="text" autoCapitalize="words" />
          <p style={{ fontSize: 11, color: '#4b5563', marginTop: -12, marginBottom: 16 }}>Your persona — not your legal name. E.g. Ava, Seren, Maëve.</p>

          <label style={S.fieldLabel}>Gender identity</label>
          <div style={S.pillRow}>
            {GENDERS.map(g => <Pill key={g.v} val={g.v} current={gender} label={g.label} onClick={() => setGender(g.v === gender ? '' : g.v)} />)}
          </div>

          <label style={S.fieldLabel}>Vibe headline</label>
          <input style={S.input} value={tagline} onChange={e => setTagline(e.target.value)} placeholder="A short line about your vibe…" maxLength={300} />

          <label style={S.fieldLabel}>About you</label>
          <textarea style={S.textarea} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell dreamers about yourself — how you move, what you love, what a session with you feels like…" maxLength={2000} />

          <label style={S.fieldLabel}>Session type</label>
          <div style={S.pillRow}>
            {MODALITIES.map(m => <Pill key={m.v} val={m.v} current={modality} label={m.label} onClick={() => setModality(m.v === modality ? '' : m.v)} />)}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button style={S.btnBack} onClick={() => setStep(2)}>←</button>
            <button style={{ ...S.btnPrimary, marginTop: 0, opacity: loading ? 0.6 : 1 }} onClick={submitApplication} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit application →'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <span style={S.navLogo}>BlushBite</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/login" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Sign in</a>
          <a href="#apply" style={S.navPill}>Apply now</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.heroGrid} />
        <div style={S.heroGlow} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={S.chip}>
            <div style={S.chipDot} />
            Now accepting companions
          </div>
          <h1 style={S.h1}>
            Build your private world.<br />
            <em style={{ fontStyle: 'italic', color: '#e8607a' }}>Entirely yours.</em>
          </h1>
          <p style={S.heroSub}>
            BlushBite is a curated companion platform. Alias-protected, EU-hosted, and built so you
            earn on your own terms — from your first profile to your tenth story.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#apply" style={{ ...S.navPill, fontSize: 14, padding: '12px 28px' }}>Apply as a companion</a>
            <a href="#why-join" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#6b7280', border: '1px solid #1c2333', padding: '12px 24px', borderRadius: 24, textDecoration: 'none' }}>
              Learn more ↓
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div style={S.trustBar}>
        {[
          ['✦', 'EU-hosted · GDPR compliant'],
          ['🔒', 'Your real name is never shown'],
          ['✦', 'Admin-verified before you go live'],
          ['▶', 'Dedicated companion support'],
        ].map(([icon, text], i) => (
          <div key={i} style={S.trustItem}>
            <span style={{ color: '#c9a96e' }}>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Why join */}
      <div id="why-join">
        <div style={S.section}>
          <p style={S.sLabel}>For Companions</p>
          <h2 style={S.sTitle}>Why companions choose <em style={{ fontStyle: 'italic', color: '#e8607a' }}>BlushBite</em></h2>
          <p style={S.sSub}>Not a listing site. Not a directory. A private ecosystem built so you can build, earn, and grow — entirely on your own terms.</p>

          <div style={S.statsRow}>
            {[
              ['€0', 'Hidden fees —\nyour rate goes to you'],
              ['100%', 'Alias-based identity —\nreal name never shown'],
              ['EU', 'Hosted in Netherlands,\nfully GDPR compliant'],
            ].map(([num, label], i) => (
              <div key={i} style={{ ...S.stat, borderRight: i < 2 ? '1px solid #1c2333' : 'none' }}>
                <span style={S.statNum}>{num}</span>
                <span style={S.statLabel}>{label}</span>
              </div>
            ))}
          </div>

          <div style={S.featureGrid}>
            {FEATURES.map(f => (
              <div key={f.title} style={S.featureCard}>
                <div style={S.fCardAccent} />
                <div style={S.fCardTitle}>{f.title}</div>
                <div style={S.fCardBody}>{f.body}</div>
              </div>
            ))}
          </div>

          <div style={S.highlightCard}>
            <div>
              <h3 style={S.highlightTitle}>Your world. Your income.<br /><em style={{ fontStyle: 'italic', color: '#e8607a' }}>Your rules.</em></h3>
              <p style={S.highlightBody}>Once approved, you get access to a full companion dashboard — everything you need to build a presence, attract dreamers, and run your sessions your way. Write stories. Upload photos and video. Watch your analytics grow.</p>
            </div>
            <div>
              {ACCESS_LIST.map((item, i) => (
                <div key={i} style={{ ...S.accessItem, borderBottom: i < ACCESS_LIST.length - 1 ? '1px solid #1c2333' : 'none' }}>
                  <span style={S.accessDot}>✦</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={S.divider} />

      {/* How it works */}
      <div id="how-it-works">
        <div style={S.section}>
          <p style={S.sLabel}>The process</p>
          <h2 style={S.sTitle}>From application <em style={{ fontStyle: 'italic', color: '#e8607a' }}>to live</em></h2>
          <p style={S.sSub}>Four steps. Entirely online. You are in control at every stage.</p>
          {[
            { title: 'Apply in minutes', body: 'Fill out a short application — your details, your vibe, an optional photo. No lengthy forms. No waiting rooms. Just you, your words, and a button.' },
            { title: 'Personal review', body: 'Every application is reviewed by our team within 24–48 hours. We look at your profile holistically. You will get an email either way.' },
            { title: 'Build your profile', body: 'Once approved, log in to your companion dashboard. Upload photos and videos, write your stories, set your session cards, and define your pricing.' },
            { title: 'Go live on your terms', body: 'Toggle visibility from your dashboard when you are ready. Dreamers can find you, view your profile, and send booking requests — which you approve or decline.' },
          ].map((s, i) => (
            <div key={i} style={{ ...S.howStep, borderBottom: i < 3 ? '1px solid #1c2333' : 'none' }}>
              <div style={S.howNum}>0{i + 1}</div>
              <div>
                <div style={S.howTitle}>{s.title}</div>
                <div style={S.howBody}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.divider} />

      {/* Apply form */}
      <div id="apply" style={S.applySection}>
        <p style={{ ...S.sLabel, textAlign: 'center' }}>Apply now</p>
        <h2 style={{ ...S.sTitle, textAlign: 'center', maxWidth: '100%', marginBottom: 8 }}>
          Begin your <em style={{ fontStyle: 'italic', color: '#e8607a' }}>journey.</em>
        </h2>
        <p style={{ ...S.sSub, textAlign: 'center', maxWidth: '100%', marginBottom: 40 }}>
          Takes about 3 minutes. We review every application personally.
        </p>
        <ApplyForm />
        <p style={{ textAlign: 'center', fontSize: 12, color: '#4b5563', marginTop: 20 }}>
          Already approved?{' '}
          <a href="/login" style={{ color: '#e8607a', textDecoration: 'none' }}>Sign in to your dashboard</a>
        </p>
      </div>

      {/* Footer */}
      <footer style={S.footer}>
        <p style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}>BlushBite</span>
          {' · '}EU-hosted · GDPR compliant
        </p>
        <p>Your real name and data are never shared with dreamers.</p>
      </footer>
    </div>
  )
}
