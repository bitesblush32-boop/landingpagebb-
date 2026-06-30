'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getExampleNumber, isValidPhoneNumber } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const phoneExamples = require('libphonenumber-js/examples.mobile.json')

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

// ── Shared input styles ───────────────────────────────────────────────────────

const inputCls = [
  'w-full rounded-xl px-4 text-[16px] outline-none min-h-[52px]',
  'transition-all duration-[150ms] mb-4',
].join(' ')

const inputStyle: React.CSSProperties = {
  background: '#111620',
  border: '1px solid #1c2333',
  color: '#eeeef0',
}

function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#e8607a'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.11)'
}
function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#1c2333'
  e.currentTarget.style.boxShadow = 'none'
}

// ── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ val, current, label, onClick }: { val: string; current: string; label: string; onClick: () => void }) {
  const active = current === val
  return (
    <button
      onClick={onClick}
      className="rounded-full text-[13px] cursor-pointer min-h-[36px] px-4 transition-all duration-[150ms] active:scale-95"
      style={{
        border: `1px solid ${active ? '#e8607a' : '#1c2333'}`,
        color: active ? '#e8607a' : '#6b7280',
        background: active ? 'rgba(232,96,122,0.1)' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}

// ── OTP digit box ─────────────────────────────────────────────────────────────

function OtpDigit({
  idx, value, inputRef, onChange, onKeyDown,
}: {
  idx: number
  value: string
  inputRef: (el: HTMLInputElement | null) => void
  onChange: (idx: number, val: string) => void
  onKeyDown: (idx: number, e: React.KeyboardEvent) => void
}) {
  const [focused, setFocused] = useState(false)
  const filled = value !== ''
  return (
    <input
      ref={inputRef}
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={e => onChange(idx, e.target.value)}
      onKeyDown={e => onKeyDown(idx, e)}
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

// ── City Autocomplete (Photon / OpenStreetMap — free, no API key) ─────────────

function CityAutocomplete({
  countryCode, value, onChange,
}: {
  countryCode: string
  value: string
  onChange: (city: string) => void
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    onChange(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.length < 2) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setFetching(true)
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=8&lang=en&layer=city`
        const res = await fetch(url)
        const data = await res.json()
        const seen = new Set<string>()
        const cities: string[] = []
        for (const f of data.features ?? []) {
          const props = f.properties
          if (countryCode && props.countrycode?.toUpperCase() !== countryCode) continue
          const name: string = props.name
          if (name && !seen.has(name)) { seen.add(name); cities.push(name) }
          if (cities.length >= 6) break
        }
        setSuggestions(cities)
        setOpen(cities.length > 0)
      } catch { setSuggestions([]); setOpen(false) }
      finally { setFetching(false) }
    }, 300)
  }

  function select(city: string) {
    setQuery(city); onChange(city); setSuggestions([]); setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative mb-4">
      <input
        className="w-full rounded-xl px-4 text-[16px] outline-none min-h-[52px] transition-all duration-[150ms]"
        style={inputStyle}
        value={query}
        onChange={e => handleInput(e.target.value)}
        placeholder={countryCode ? 'Start typing your city…' : 'Select a country first'}
        inputMode="text"
        autoCapitalize="words"
        autoComplete="off"
        onFocus={e => { focusIn(e); if (suggestions.length > 0) setOpen(true) }}
        onBlur={focusOut}
      />
      {/* spinner */}
      {fetching && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: '#1c2333', borderTopColor: '#e8607a' }}
          />
        </div>
      )}
      {/* dropdown */}
      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl overflow-hidden z-50 animate-fade-in"
          style={{ background: '#161d2a', border: '1px solid #1c2333', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
        >
          {suggestions.map((city, i) => (
            <button
              key={city}
              type="button"
              onMouseDown={() => select(city)}
              className="w-full text-left px-4 py-3 text-[14px] transition-colors duration-[100ms] cursor-pointer"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: i < suggestions.length - 1 ? '1px solid #1c2333' : 'none',
                color: '#eeeef0',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#1c2333' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ color: '#e8607a', marginRight: 8, fontSize: 11 }}>▸</span>
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Phone Input (libphonenumber-js — country-aware) ───────────────────────────

function PhoneInput({
  countryCode, value, onChange, onValidityChange,
}: {
  countryCode: string
  value: string
  onChange: (val: string) => void
  onValidityChange: (valid: boolean) => void
}) {
  const [touched, setTouched] = useState(false)
  const [valid, setValid] = useState(true)

  // derive max national digits and placeholder from libphonenumber-js
  const example = countryCode
    ? getExampleNumber(countryCode as CountryCode, phoneExamples) ?? null
    : null
  const maxDigits = example ? String(example.nationalNumber).length : 15
  const placeholder = example ? example.formatNational() : '+-- --- ---- ----'

  function validate(digits: string): boolean {
    if (!countryCode || !digits) return true
    const dialCode = example?.countryCallingCode ? `+${example.countryCallingCode}` : ''
    const full = `${dialCode}${digits.replace(/^0+/, '')}`
    return isValidPhoneNumber(full, countryCode as CountryCode)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, maxDigits)
    onChange(digits)
    if (touched) {
      const v = validate(digits)
      setValid(v); onValidityChange(v)
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    focusOut(e); setTouched(true)
    const v = validate(value)
    setValid(v); onValidityChange(v)
  }

  const showError = touched && !valid && value.length > 0

  return (
    <div className="mb-4">
      <input
        className="w-full rounded-xl px-4 text-[16px] outline-none min-h-[52px] transition-all duration-[150ms]"
        style={{
          ...inputStyle,
          borderColor: showError ? 'rgba(248,113,113,0.6)' : '#1c2333',
          boxShadow: showError ? '0 0 0 3px rgba(248,113,113,0.1)' : 'none',
        }}
        value={value}
        onChange={handleChange}
        onFocus={e => { if (!showError) focusIn(e) }}
        onBlur={handleBlur}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={maxDigits}
      />
      {showError && (
        <p className="text-[12px] mt-1.5 animate-fade-in" style={{ color: '#f87171' }}>
          {countryCode === 'IN' && 'Indian numbers are 10 digits starting with 6–9'}
          {countryCode === 'GB' && 'UK mobile numbers are 10 digits starting with 7'}
          {countryCode === 'US' && 'US numbers are 10 digits (area code first)'}
          {!['IN', 'GB', 'US'].includes(countryCode) && `Enter a valid ${maxDigits}-digit number for this country`}
        </p>
      )}
      {countryCode && !showError && value.length > 0 && (
        <p className="text-[11px] mt-1" style={{ color: '#4b5563' }}>
          {value.length}/{maxDigits} digits
        </p>
      )}
    </div>
  )
}

// ── Apply Form ────────────────────────────────────────────────────────────────

function ApplyForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [step, setStep] = useState(1)
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resumed, setResumed] = useState(false)   // true when restored from localStorage

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
  const [, setPhoneIsValid] = useState(true)

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

  // ── localStorage helpers ──────────────────────────────────────────────────

  const STORAGE_KEY = 'bb_apply_v1'

  function saveProgress(toStep: 2 | 3, fields: {
    fullName: string; email: string; dob: string
    country: string; city: string; whatsappNum: string
  }) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: toStep, ...fields }))
    } catch { /* storage unavailable */ }
  }

  function clearProgress() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  // ── Restore on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const p = JSON.parse(raw) as {
        step: 2 | 3; fullName: string; email: string; dob: string
        country: string; city: string; whatsappNum: string
      }
      if (!p.email || !p.step) return
      // Restore all fields
      setFullName(p.fullName ?? '')
      setEmail(p.email)
      setDob(p.dob ?? '')
      setCountry(p.country ?? '')
      setCity(p.city ?? '')
      setWhatsappNum(p.whatsappNum ?? '')
      // Mark as verified and jump to saved step
      setVerified(true)
      setOtpSent(true)
      setStep(p.step)
      setResumed(true)
      setAnimKey(k => k + 1)
    } catch { /* corrupted data — ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function startFresh() {
    clearProgress()
    setStep(1); setAnimKey(k => k + 1); setResumed(false)
    setFullName(''); setEmail(''); setDob('')
    setVerified(false); setOtpSent(false); setDigits(['','','','','',''])
    setCountry(''); setCity(''); setWhatsappNum(''); setPhoneIsValid(true)
    setError('')
    window.scrollTo({ top: document.getElementById('apply')?.offsetTop ?? 0, behavior: 'smooth' })
  }

  function goStep(n: number) {
    setAnimKey(k => k + 1)
    setStep(n)
    window.scrollTo({ top: document.getElementById('apply')?.offsetTop ?? 0, behavior: 'smooth' })
  }

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
      setAnimKey(k => k + 1)
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
      saveProgress(2, { fullName, email, dob, country: '', city: '', whatsappNum: '' })
    } finally { setLoading(false) }
  }

  function step2Next() {
    setError('')
    if (!country) { setError('Select your country.'); return }
    if (!city.trim()) { setError('Enter your city.'); return }
    if (!whatsappNum.trim()) { setError('Enter your WhatsApp number.'); return }
    const valid = isValidPhoneNumber(whatsappFull, country as CountryCode)
    if (!valid) { setError('Enter a valid WhatsApp number for your country.'); return }
    saveProgress(3, { fullName, email, dob, country, city, whatsappNum })
    goStep(3)
  }

  function onPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return }
    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file))
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
          whatsappNumber: whatsappFull, displayName, gender, tagline, bio,
          sessionModality: modality,
          ...(photoUrl ? { profilePhotoUrl: photoUrl } : {}),
        }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Submission failed.'); return }
      clearProgress()
      router.push(d.redirectTo ?? '/status?new=1')
    } finally { setLoading(false) }
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: '#0d1117', border: '1px solid #1c2333' }}
    >
      {/* Top gradient line */}
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #e8607a 35%, #c9a96e 65%, transparent 100%)' }}
      />

      <div className="px-6 pt-7 pb-8 sm:px-8">

        {/* Step track */}
        <div className="flex gap-2 mb-7">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="flex-1 h-[3px] rounded-full transition-all duration-[400ms]"
              style={{
                background: step > n
                  ? 'linear-gradient(90deg,#e8607a,#c9a96e)'
                  : step === n
                    ? 'rgba(232,96,122,0.55)'
                    : '#1c2333',
              }}
            />
          ))}
        </div>

        {/* ── Resume banner ── */}
        {resumed && (
          <div
            className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-5 animate-fade-in"
            style={{ background: 'rgba(201,169,110,0.07)', border: '1px solid rgba(201,169,110,0.22)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span style={{ color: '#c9a96e', flexShrink: 0 }}>✦</span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: '#c9a96e' }}>
                  Picking up where you left off — step {step} of 3
                </p>
                <p className="text-[11px] truncate" style={{ color: '#6b7280' }}>{email}</p>
              </div>
            </div>
            <button
              onClick={startFresh}
              className="text-[12px] flex-shrink-0 cursor-pointer transition-colors duration-[150ms] whitespace-nowrap"
              style={{ background: 'none', border: 'none', color: '#4b5563', padding: 0 }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#eeeef0' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#4b5563' }}
            >
              Start fresh ×
            </button>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-[13px] mb-5 animate-fade-in"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {/* ── Step 1: Identity + OTP ── */}
        {step === 1 && (
          <div key={`s1-${animKey}`} className="animate-fade-up">
            <p className="text-[11px] uppercase tracking-[0.1em] mb-1.5" style={{ color: '#6b7280' }}>Step 1 of 3</p>
            <h2 className="text-[26px] sm:text-[28px] leading-tight mb-2" style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}>
              Who <em className="italic" style={{ color: '#e8607a' }}>you are</em>
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#6b7280' }}>
              We review every application personally. Start with the basics.
            </p>

            {!otpSent ? (
              <>
                <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>Full name</label>
                <input
                  className={inputCls} style={inputStyle}
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Your legal name (stays private)"
                  autoComplete="name"
                  onFocus={focusIn} onBlur={focusOut}
                />

                <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>Email address</label>
                <input
                  className={inputCls} style={inputStyle}
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  inputMode="email" autoComplete="email"
                  onFocus={focusIn} onBlur={focusOut}
                />

                <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>Date of birth</label>
                <input
                  className={inputCls} style={inputStyle}
                  type="date" value={dob} onChange={e => setDob(e.target.value)}
                  max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().slice(0, 10)}
                  onFocus={focusIn} onBlur={focusOut}
                />
                <p className="text-[11px] -mt-2 mb-5" style={{ color: '#4b5563' }}>Must be 18 or older. Never shown publicly.</p>

                <button
                  onClick={sendOtp} disabled={loading}
                  className="w-full rounded-xl text-[15px] font-medium min-h-[52px] transition-all duration-[150ms] active:scale-[0.98] disabled:opacity-60 cursor-pointer mt-1"
                  style={{ background: '#e8607a', color: '#fff', border: 'none' }}
                >
                  {loading ? 'Sending…' : 'Send verification code →'}
                </button>
              </>
            ) : !verified ? (
              /* ── OTP entry ── */
              <div key={`otp-${animKey}`} className="animate-fade-up">
                <p className="text-[14px] mb-2" style={{ color: '#6b7280' }}>
                  Code sent to <strong style={{ color: '#eeeef0' }}>{email}</strong>
                </p>
                <p className="text-[11px] mb-6" style={{ color: '#4b5563' }}>expires in 10 min · private · secure</p>

                {/* OTP boxes */}
                <div className="flex gap-2 mb-5" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <OtpDigit
                      key={i} idx={i} value={d}
                      inputRef={el => { otpRefs.current[i] = el }}
                      onChange={handleDigit}
                      onKeyDown={handleDigitKey}
                    />
                  ))}
                </div>

                {loading && (
                  <p className="text-center text-[13px] mb-4 animate-pulse" style={{ color: '#6b7280' }}>Verifying…</p>
                )}

                <button
                  onClick={() => { clearProgress(); setOtpSent(false); setDigits(['', '', '', '', '', '']); setVerified(false); setResumed(false); setAnimKey(k => k + 1) }}
                  className="text-[13px] bg-transparent border-none p-0 cursor-pointer transition-colors duration-[150ms]"
                  style={{ color: '#4b5563' }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#eeeef0' }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#4b5563' }}
                >
                  ← Different email
                </button>
              </div>
            ) : (
              /* ── Verified ── */
              <div className="animate-scale-in">
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-6"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <div
                    className="check-draw w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.15)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: '#22c55e' }}>Email verified</p>
                    <p className="text-[11px]" style={{ color: '#4b5563' }}>{email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { if (verified) { setError(''); goStep(2) } }} disabled={loading}
                  className="w-full rounded-xl text-[15px] font-medium min-h-[52px] transition-all duration-[150ms] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  style={{ background: '#e8607a', color: '#fff', border: 'none' }}
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Location ── */}
        {step === 2 && (
          <div key={`s2-${animKey}`} className="animate-fade-up">
            <p className="text-[11px] uppercase tracking-[0.1em] mb-1.5" style={{ color: '#6b7280' }}>Step 2 of 3</p>
            <h2 className="text-[26px] sm:text-[28px] leading-tight mb-2" style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}>
              Where <em className="italic" style={{ color: '#e8607a' }}>you are</em>
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#6b7280' }}>
              Let us know where you are based and how dreamers can reach you privately.
            </p>

            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>Country</label>
            <select
              className={inputCls} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const }}
              value={country} onChange={e => { setCountry(e.target.value); setWhatsappNum(''); setPhoneIsValid(true) }}
              onFocus={focusIn} onBlur={focusOut}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>

            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>City</label>
            <CityAutocomplete
              countryCode={country}
              value={city}
              onChange={setCity}
            />

            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>WhatsApp number</label>
            {/* dial code badge */}
            {dialCode && (
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center rounded-lg px-3 py-1 text-[13px] font-medium"
                  style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)', color: '#c9a96e' }}
                >
                  {dialCode}
                </span>
                <span className="text-[12px]" style={{ color: '#4b5563' }}>country code prepended automatically</span>
              </div>
            )}
            <PhoneInput
              countryCode={country}
              value={whatsappNum}
              onChange={v => { setWhatsappNum(v); setPhoneIsValid(true) }}
              onValidityChange={setPhoneIsValid}
            />
            <p className="text-[11px] mb-6 -mt-2" style={{ color: '#4b5563' }}>
              Used for private booking notifications only — never shown to dreamers.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => goStep(1)}
                className="rounded-xl px-5 text-[14px] min-h-[52px] transition-all duration-[150ms] active:scale-95 cursor-pointer"
                style={{ background: 'transparent', border: '1px solid #1c2333', color: '#6b7280' }}
              >
                ←
              </button>
              <button
                onClick={step2Next} disabled={loading}
                className="flex-1 rounded-xl text-[15px] font-medium min-h-[52px] transition-all duration-[150ms] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                style={{ background: '#e8607a', color: '#fff', border: 'none' }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Essence ── */}
        {step === 3 && (
          <div key={`s3-${animKey}`} className="animate-fade-up">
            <p className="text-[11px] uppercase tracking-[0.1em] mb-1.5" style={{ color: '#6b7280' }}>Step 3 of 3</p>
            <h2 className="text-[26px] sm:text-[28px] leading-tight mb-2" style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}>
              Your <em className="italic" style={{ color: '#e8607a' }}>essence</em>
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#6b7280' }}>
              How dreamers will first meet you. Write as if you are whispering into someone&rsquo;s ear.
            </p>

            {/* Photo upload */}
            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>
              Profile photo <span className="text-[10px]" style={{ color: '#4b5563' }}>(optional)</span>
            </label>
            {photoPreview ? (
              <div className="relative w-[100px] h-[136px] mb-4 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(''); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] cursor-pointer"
                  style={{ background: 'rgba(7,9,15,0.85)', border: '1px solid #1c2333', color: '#eeeef0' }}
                >✕</button>
              </div>
            ) : (
              <div
                className="rounded-xl p-7 text-center cursor-pointer mb-4 transition-all duration-[150ms]"
                style={{ border: '2px dashed #1c2333' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,96,122,0.5)' }}
                onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1c2333' }}
                onDrop={handleDrop}
              >
                <div className="text-2xl mb-2">📷</div>
                <div className="text-[13px]" style={{ color: '#6b7280' }}>Click or drag a photo here</div>
                <div className="text-[11px] mt-1" style={{ color: '#4b5563' }}>JPG or PNG · max 5 MB · face clearly visible</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhotoSelect} />
            <p className="text-[11px] mb-5" style={{ color: '#4b5563' }}>A clear photo helps our review team — not shown publicly until you go live.</p>

            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>Display name</label>
            <input
              className={inputCls} style={inputStyle}
              value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="The name dreamers will know you by"
              maxLength={60} inputMode="text" autoCapitalize="words"
              onFocus={focusIn} onBlur={focusOut}
            />
            <p className="text-[11px] -mt-2 mb-5" style={{ color: '#4b5563' }}>Your persona — not your legal name. E.g. Ava, Seren, Maëve.</p>

            <label className="block text-[12px] mb-2" style={{ color: '#9ca3af' }}>Gender identity</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {GENDERS.map(g => <Pill key={g.v} val={g.v} current={gender} label={g.label} onClick={() => setGender(g.v === gender ? '' : g.v)} />)}
            </div>

            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>Vibe headline</label>
            <input
              className={inputCls} style={inputStyle}
              value={tagline} onChange={e => setTagline(e.target.value)}
              placeholder="A short line about your vibe…"
              maxLength={300}
              onFocus={focusIn} onBlur={focusOut}
            />

            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>About you</label>
            <textarea
              className="w-full rounded-xl px-4 py-3.5 text-[16px] outline-none mb-4 resize-y min-h-[100px] transition-all duration-[150ms]"
              style={inputStyle}
              value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell dreamers about yourself — how you move, what you love, what a session with you feels like…"
              maxLength={2000}
              onFocus={focusIn} onBlur={focusOut}
            />

            <label className="block text-[12px] mb-2" style={{ color: '#9ca3af' }}>Session type</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {MODALITIES.map(m => <Pill key={m.v} val={m.v} current={modality} label={m.label} onClick={() => setModality(m.v === modality ? '' : m.v)} />)}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => goStep(2)}
                className="rounded-xl px-5 text-[14px] min-h-[52px] transition-all duration-[150ms] active:scale-95 cursor-pointer"
                style={{ background: 'transparent', border: '1px solid #1c2333', color: '#6b7280' }}
              >
                ←
              </button>
              <button
                onClick={submitApplication} disabled={loading}
                className="flex-1 rounded-xl text-[15px] font-medium min-h-[52px] transition-all duration-[150ms] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                style={{ background: '#e8607a', color: '#fff', border: 'none' }}
              >
                {loading ? 'Submitting…' : 'Submit application →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ background: '#07090f', color: '#eeeef0', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[900] flex items-center justify-between px-4 sm:px-8 h-16"
        style={{ background: 'rgba(7,9,15,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1c2333' }}
      >
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#eeeef0' }}>BlushBite</span>
        <div className="flex items-center gap-3">
          <a href="/login" className="hidden sm:block text-[13px]" style={{ color: '#6b7280', textDecoration: 'none' }}>Sign in</a>
          <a
            href="#apply"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full px-4 min-h-[40px] transition-all duration-[150ms] active:scale-95"
            style={{ color: '#e8607a', background: 'rgba(232,96,122,.1)', border: '1px solid rgba(232,96,122,.28)', textDecoration: 'none' }}
          >
            Apply now
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-28 pb-20">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(232,96,122,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(232,96,122,.05) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%,black 25%,transparent 80%)',
            maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%,black 25%,transparent 80%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 72% 58% at 50% 28%,rgba(232,96,122,.07) 0%,transparent 70%)' }}
        />
        <div className="relative z-10 animate-fade-up">
          <div
            className="inline-flex items-center gap-2 rounded-full text-[11px] font-medium uppercase tracking-[0.07em] px-3.5 py-1.5 mb-7"
            style={{ color: '#e8607a', background: 'rgba(232,96,122,.1)', border: '1px solid rgba(232,96,122,.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#e8607a' }} />
            Now accepting companions
          </div>
          <h1
            className="text-[clamp(32px,5.5vw,58px)] font-normal leading-[1.12] mb-5 max-w-[680px] mx-auto"
            style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
          >
            Build your private world.<br />
            <em className="italic" style={{ color: '#e8607a' }}>Entirely yours.</em>
          </h1>
          <p className="text-[15px] leading-[1.75] max-w-[440px] mx-auto mb-10" style={{ color: '#6b7280' }}>
            BlushBite is a curated companion platform. Alias-protected, EU-hosted, and built so you
            earn on your own terms — from your first profile to your tenth story.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="#apply"
              className="inline-flex items-center justify-center rounded-full font-medium text-[14px] px-7 min-h-[50px] min-w-[180px] transition-all duration-[150ms] active:scale-[0.98]"
              style={{ color: '#fff', background: '#e8607a', border: 'none', textDecoration: 'none' }}
            >
              Apply as a companion
            </a>
            <a
              href="#why-join"
              className="inline-flex items-center justify-center rounded-full text-[14px] min-h-[50px] px-6 transition-all duration-[150ms] active:scale-[0.98]"
              style={{ color: '#6b7280', border: '1px solid #1c2333', textDecoration: 'none' }}
            >
              Learn more ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div
        className="flex flex-wrap justify-center gap-x-8 gap-y-3 px-5 py-5"
        style={{ borderTop: '1px solid #1c2333', borderBottom: '1px solid #1c2333', background: '#0d1117' }}
      >
        {[
          ['✦', 'EU-hosted · GDPR compliant'],
          ['🔒', 'Your real name is never shown'],
          ['✦', 'Admin-verified before you go live'],
          ['▶', 'Dedicated companion support'],
        ].map(([icon, text], i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: '#6b7280' }}>
            <span style={{ color: '#c9a96e' }}>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* ── Why join ── */}
      <div id="why-join">
        <div className="max-w-[1100px] mx-auto px-5 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: '#6b7280' }}>For Companions</p>
          <h2
            className="text-[clamp(26px,4vw,40px)] font-normal leading-tight mb-3 max-w-[560px]"
            style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
          >
            Why companions choose <em className="italic" style={{ color: '#e8607a' }}>BlushBite</em>
          </h2>
          <p className="text-[15px] leading-[1.75] max-w-[500px] mb-10" style={{ color: '#6b7280' }}>
            Not a listing site. Not a directory. A private ecosystem built so you can build, earn, and grow — entirely on your own terms.
          </p>

          {/* Stats — 1 col on mobile, 3 on sm+ */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl overflow-hidden mb-10"
            style={{ background: '#0d1117', border: '1px solid #1c2333' }}
          >
            {[
              ['€0', 'Hidden fees —\nyour rate goes to you'],
              ['100%', 'Alias-based identity —\nreal name never shown'],
              ['EU', 'Hosted in Netherlands,\nfully GDPR compliant'],
            ].map(([num, label], i) => (
              <div
                key={i}
                className="px-5 py-7 text-center"
                style={{ borderRight: i < 2 ? '1px solid #1c2333' : 'none', borderBottom: i < 2 ? '1px solid #1c2333' : 'none' }}
              >
                <span
                  className="block text-[34px] leading-none mb-2"
                  style={{ fontFamily: 'var(--font-serif)', color: '#c9a96e' }}
                >
                  {num}
                </span>
                <span className="block text-[11px] uppercase tracking-[0.07em] leading-snug whitespace-pre-line" style={{ color: '#6b7280' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Feature grid — 1 col mobile, 2 col md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="flex flex-col gap-2.5 rounded-2xl p-6"
                style={{ background: '#111620', border: '1px solid #1c2333' }}
              >
                <div className="w-7 h-[3px] rounded-full" style={{ background: '#e8607a' }} />
                <div className="text-[14px] font-medium" style={{ color: '#eeeef0' }}>{f.title}</div>
                <div className="text-[13px] leading-[1.75]" style={{ color: '#6b7280' }}>{f.body}</div>
              </div>
            ))}
          </div>

          {/* Highlight card — stacked on mobile, side-by-side on md+ */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center rounded-2xl p-7 sm:p-10"
            style={{ background: '#0d1117', border: '1px solid rgba(232,96,122,.2)' }}
          >
            <div>
              <h3
                className="text-[24px] sm:text-[26px] font-normal leading-[1.35] mb-4"
                style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
              >
                Your world. Your income.<br />
                <em className="italic" style={{ color: '#e8607a' }}>Your rules.</em>
              </h3>
              <p className="text-[13px] leading-[1.8]" style={{ color: '#6b7280' }}>
                Once approved, you get access to a full companion dashboard — everything you need to build a presence, attract dreamers, and run your sessions your way. Write stories. Upload photos and video. Watch your analytics grow.
              </p>
            </div>
            <div>
              {ACCESS_LIST.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-[13px] py-2.5"
                  style={{ borderBottom: i < ACCESS_LIST.length - 1 ? '1px solid #1c2333' : 'none', color: '#eeeef0' }}
                >
                  <span style={{ color: '#c9a96e', flexShrink: 0 }}>✦</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px max-w-[1100px] mx-auto" style={{ background: '#1c2333' }} />

      {/* ── How it works ── */}
      <div id="how-it-works">
        <div className="max-w-[1100px] mx-auto px-5 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: '#6b7280' }}>The process</p>
          <h2
            className="text-[clamp(26px,4vw,40px)] font-normal leading-tight mb-3 max-w-[560px]"
            style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
          >
            From application <em className="italic" style={{ color: '#e8607a' }}>to live</em>
          </h2>
          <p className="text-[15px] leading-[1.75] max-w-[500px] mb-10" style={{ color: '#6b7280' }}>
            Four steps. Entirely online. You are in control at every stage.
          </p>
          {[
            { title: 'Apply in minutes', body: 'Fill out a short application — your details, your vibe, an optional photo. No lengthy forms. No waiting rooms. Just you, your words, and a button.' },
            { title: 'Personal review', body: 'Every application is reviewed by our team within 24–48 hours. We look at your profile holistically. You will get an email either way.' },
            { title: 'Build your profile', body: 'Once approved, log in to your companion dashboard. Upload photos and videos, write your stories, set your session cards, and define your pricing.' },
            { title: 'Go live on your terms', body: 'Toggle visibility from your dashboard when you are ready. Dreamers can find you, view your profile, and send booking requests — which you approve or decline.' },
          ].map((s, i) => (
            <div
              key={i}
              className="flex gap-6 items-start py-7"
              style={{ borderBottom: i < 3 ? '1px solid #1c2333' : 'none' }}
            >
              <div
                className="text-[42px] leading-none flex-shrink-0 w-12"
                style={{ fontFamily: 'var(--font-serif)', color: 'rgba(232,96,122,.25)' }}
              >
                0{i + 1}
              </div>
              <div>
                <div className="text-[16px] font-medium mb-1.5" style={{ color: '#eeeef0' }}>{s.title}</div>
                <div className="text-[13px] leading-[1.75]" style={{ color: '#6b7280' }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px max-w-[1100px] mx-auto" style={{ background: '#1c2333' }} />

      {/* ── Apply form ── */}
      <div id="apply" className="max-w-[620px] mx-auto px-5 py-16 sm:py-20">
        <p className="text-[11px] uppercase tracking-[0.1em] mb-2 text-center" style={{ color: '#6b7280' }}>Apply now</p>
        <h2
          className="text-[clamp(26px,4vw,40px)] font-normal leading-tight mb-2 text-center"
          style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
        >
          Begin your <em className="italic" style={{ color: '#e8607a' }}>journey.</em>
        </h2>
        <p className="text-[15px] leading-[1.75] text-center mb-10" style={{ color: '#6b7280' }}>
          Takes about 3 minutes. We review every application personally.
        </p>
        <ApplyForm />
        <p className="text-center text-[12px] mt-5" style={{ color: '#4b5563' }}>
          Already approved?{' '}
          <a href="/login" style={{ color: '#e8607a', textDecoration: 'none' }}>Sign in to your dashboard</a>
        </p>
      </div>

      {/* ── Footer ── */}
      <footer
        className="px-5 py-8 text-center text-[12px]"
        style={{ borderTop: '1px solid #1c2333', color: '#4b5563' }}
      >
        <p className="mb-1.5">
          <span style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}>BlushBite</span>
          {' · '}EU-hosted · GDPR compliant
        </p>
        <p>Your real name and data are never shared with dreamers.</p>
      </footer>
    </div>
  )
}
