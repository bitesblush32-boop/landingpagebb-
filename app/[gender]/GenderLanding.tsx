'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getFingerprint } from '@/lib/fingerprint'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Community = 'female' | 'male' | 'shemale'

// ── First-visit overlay config ────────────────────────────────────────────────

const OVERLAY_CONFIG: Record<Community, {
  symbol: string
  label: string
  heading: string
  headingEm: string
  sub: string
  accentColor: string
  accentBg: string
  accentBorder: string
  confettiColors: string[]
}> = {
  female: {
    symbol: '♀',
    label: 'Female companion community',
    heading: 'You\'re entering',
    headingEm: 'your world.',
    sub: 'A private space built for female companions. Alias-protected, EU-hosted, and entirely on your terms.',
    accentColor: '#e8607a',
    accentBg: 'rgba(232,96,122,0.08)',
    accentBorder: 'rgba(232,96,122,0.35)',
    confettiColors: ['#e8607a', '#f9a8b8', '#c9a96e', '#ffffff', '#fda4af'],
  },
  male: {
    symbol: '♂',
    label: 'Male companion community',
    heading: 'You\'re entering',
    headingEm: 'your space.',
    sub: 'A dedicated space for male companions. Your profile, your rate, your rules — dreamers here seek you specifically.',
    accentColor: '#60a5fa',
    accentBg: 'rgba(96,165,250,0.08)',
    accentBorder: 'rgba(96,165,250,0.35)',
    confettiColors: ['#60a5fa', '#93c5fd', '#c9a96e', '#ffffff', '#bfdbfe'],
  },
  shemale: {
    symbol: '⚥',
    label: 'TS & Shemale community',
    heading: 'Not a subcategory.',
    headingEm: 'Your own world.',
    sub: 'A fully separate community built for you, by design. Your profiles, your dreamers, your stories — nothing shared.',
    accentColor: '#c084fc',
    accentBg: 'rgba(192,132,252,0.08)',
    accentBorder: 'rgba(192,132,252,0.35)',
    confettiColors: ['#c084fc', '#e879f9', '#c9a96e', '#ffffff', '#d8b4fe'],
  },
}

// ── First-visit overlay ───────────────────────────────────────────────────────

function FirstVisitOverlay({
  community,
  onEnter,
  onStartFade,
  fading,
}: {
  community: Community
  onEnter: () => void
  onStartFade: () => void
  fading: boolean
}) {
  const oc = OVERLAY_CONFIG[community]
  return (
    <div
      onTransitionEnd={() => { if (fading) onEnter() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        background: 'rgba(7,9,15,0.88)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.55s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#0d1117',
          border: `1px solid ${oc.accentBorder}`,
          borderRadius: 24,
          overflow: 'hidden',
          textAlign: 'center',
          boxShadow: `0 0 80px ${oc.accentBg}, 0 0 0 1px ${oc.accentBorder}`,
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            height: 2,
            background: `linear-gradient(90deg, transparent, ${oc.accentColor}, transparent)`,
          }}
        />

        <div style={{ padding: '44px 36px 40px' }}>
          {/* Symbol */}
          <div
            style={{
              fontSize: 56,
              lineHeight: 1,
              marginBottom: 20,
              color: oc.accentColor,
              filter: `drop-shadow(0 0 24px ${oc.accentColor}55)`,
            }}
          >
            {oc.symbol}
          </div>

          {/* Community label pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 100,
              padding: '4px 12px',
              marginBottom: 22,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: oc.accentColor,
              background: oc.accentBg,
              border: `1px solid ${oc.accentBorder}`,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: oc.accentColor,
                display: 'inline-block',
              }}
            />
            {oc.label}
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(26px, 5vw, 32px)',
              color: '#eeeef0',
              lineHeight: 1.25,
              marginBottom: 14,
              fontWeight: 400,
            }}
          >
            {oc.heading}
            <br />
            <em style={{ fontStyle: 'italic', color: oc.accentColor }}>{oc.headingEm}</em>
          </h1>

          {/* Sub */}
          <p
            style={{
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.75,
              marginBottom: 32,
              maxWidth: 300,
              margin: '0 auto 32px',
            }}
          >
            {oc.sub}
          </p>

          {/* Enter button */}
          <EnterButton
            accentColor={oc.accentColor}
            accentBg={oc.accentBg}
            confettiColors={oc.confettiColors}
            onAfterConfetti={onStartFade}
          />

          <p style={{ fontSize: 11, color: '#374151', marginTop: 16 }}>
            EU-hosted · GDPR compliant · 18+ only
          </p>
        </div>
      </div>
    </div>
  )
}

function EnterButton({
  accentColor,
  accentBg,
  confettiColors,
  onAfterConfetti,
}: {
  accentColor: string
  accentBg: string
  confettiColors: string[]
  onAfterConfetti: () => void
}) {
  const [hovered, setHovered] = useState(false)

  async function handleClick() {
    // Fire confetti then trigger overlay fade-out
    try {
      const mod = await import('canvas-confetti')
      const confetti = (mod.default ?? mod) as (opts?: object) => void
      confetti({
        particleCount: 120,
        spread: 80,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.55 },
        colors: confettiColors,
        scalar: 0.9,
        gravity: 1.1,
      })
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 110,
          startVelocity: 30,
          origin: { x: 0.5, y: 0.6 },
          colors: confettiColors,
          scalar: 0.75,
          gravity: 1.2,
        })
      }, 180)
    } catch {
      // confetti is non-critical
    }
    // Short delay so confetti is visible before fade begins
    setTimeout(onAfterConfetti, 400)
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        minHeight: 52,
        borderRadius: 14,
        border: 'none',
        background: hovered ? accentColor : accentBg,
        color: hovered ? '#ffffff' : accentColor,
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? `0 8px 28px ${accentColor}40` : 'none',
        letterSpacing: '0.01em',
      }}
    >
      Enter →
    </button>
  )
}

// ── Boost types (server-passed) ───────────────────────────────────────────────

export interface BoostCompanion {
  id: string
  boost_type: string
  banner_headline: string | null
  banner_tagline: string | null
  companion_name: string
  alias: string | null
  tagline: string | null
  city: string | null
  primary_photo_url: string | null
}

export interface ActiveBoosts {
  headerBanner: BoostCompanion | null
  rightRail:    BoostCompanion | null
  featured:     BoostCompanion[]
}

// ── Header Banner ─────────────────────────────────────────────────────────────

function HeaderBanner({ boost, accentColor, accentBg }: { boost: BoostCompanion; accentColor: string; accentBg: string }) {
  const name     = boost.banner_headline || boost.alias || boost.companion_name
  const subtitle = boost.banner_tagline  || boost.tagline  || ''
  const city     = boost.city

  return (
    <div
      style={{
        background: '#0d1117',
        borderBottom: `1px solid ${accentColor}25`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        transform: 'translateZ(0)', // GPU layer
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Photo thumbnail */}
        {boost.primary_photo_url ? (
          <div style={{
            width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
            border: `1px solid ${accentColor}40`,
          }}>
            <img
              src={boost.primary_photo_url}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: accentBg, border: `1px solid ${accentColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: accentColor,
          }}>
            ✦
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', fontFamily: 'var(--font-serif)' }}>
              {name}
            </span>
            {city && (
              <span style={{ fontSize: 11, color: '#6b7280' }}>· {city}</span>
            )}
            <span style={{
              fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em',
              color: accentColor, background: accentBg,
              border: `1px solid ${accentColor}35`, borderRadius: 4, padding: '2px 6px',
            }}>
              Featured
            </span>
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontStyle: 'italic' }}>
              &quot;{subtitle}&quot;
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#4b5563' }}>
        Promoted · BlushBite
      </div>
    </div>
  )
}

// ── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({ boost, accentColor, accentBg }: { boost: BoostCompanion; accentColor: string; accentBg: string }) {
  const name = boost.alias || boost.companion_name
  const tag  = boost.tagline ? `"${boost.tagline}"` : null

  return (
    <div style={{
      background: '#0d1117',
      border: `1px solid ${accentColor}30`,
      borderRadius: 16,
      overflow: 'hidden',
      flexShrink: 0,
      width: 'clamp(160px, 40vw, 200px)',
      transform: 'translateZ(0)',
    }}>
      {/* Photo */}
      <div style={{ aspectRatio: '3/4', background: accentBg, position: 'relative', overflow: 'hidden' }}>
        {boost.primary_photo_url ? (
          <img
            src={boost.primary_photo_url}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: accentColor }}>
            ✦
          </div>
        )}
        {/* Featured badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: accentColor, background: 'rgba(7,9,15,.85)',
          border: `1px solid ${accentColor}40`, borderRadius: 4, padding: '2px 7px',
        }}>
          Featured
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#eeeef0', fontFamily: 'var(--font-serif)', marginBottom: 2 }}>
          {name}
        </div>
        {boost.city && (
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{boost.city}</div>
        )}
        {tag && (
          <div style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic', lineHeight: 1.4 }}>
            {tag.length > 60 ? tag.slice(0, 57) + '…"' : tag}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Right Rail ────────────────────────────────────────────────────────────────

function RightRail({ boost, accentColor, accentBg }: { boost: BoostCompanion; accentColor: string; accentBg: string }) {
  const name = boost.alias || boost.companion_name

  return (
    <div style={{
      width: 220, flexShrink: 0,
      position: 'sticky', top: 76,  // below fixed nav (64px) + 12px gap
      alignSelf: 'flex-start',
      transform: 'translateZ(0)',
    }}>
      <div style={{
        background: '#0d1117',
        border: `1px solid ${accentColor}30`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Top accent */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
        <div style={{ padding: '12px 14px 6px', fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Featured tonight
        </div>
        {/* Photo */}
        <div style={{ aspectRatio: '3/4', background: accentBg, overflow: 'hidden' }}>
          {boost.primary_photo_url ? (
            <img
              src={boost.primary_photo_url}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: accentColor }}>
              ✦
            </div>
          )}
        </div>
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', fontFamily: 'var(--font-serif)', marginBottom: 3 }}>
            {name}
          </div>
          {boost.city && (
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{boost.city}</div>
          )}
          {boost.tagline && (
            <div style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic', lineHeight: 1.5 }}>
              &quot;{boost.tagline.slice(0, 80)}{boost.tagline.length > 80 ? '…' : ''}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Community config ──────────────────────────────────────────────────────────

const COMMUNITY_CONFIG: Record<Community, {
  badge: string
  heroH1: string
  heroEm: string
  heroSub: string
  accentColor: string
  accentBg: string
  accentGrid: string
  heroBgImage?: string
}> = {
  female: {
    badge: 'Female companion community',
    heroH1: 'Build your private world.',
    heroEm: 'Entirely yours.',
    heroSub: 'BlushBite is a curated companion platform for women. Alias-protected, EU-hosted, and built so you earn on your own terms — from your first profile to your tenth story.',
    accentColor: '#e8607a',
    accentBg: 'rgba(232,96,122,.1)',
    accentGrid: 'rgba(232,96,122,.04)',
  },
  male: {
    badge: 'Male companion community',
    heroH1: 'Build your private world.',
    heroEm: 'On your terms.',
    heroSub: 'BlushBite gives male companions a dedicated space — alias-protected, EU-hosted, with dreamers who seek you specifically. Your profile, your rate, your rules.',
    accentColor: '#60a5fa',
    accentBg: 'rgba(96,165,250,.1)',
    accentGrid: 'rgba(96,165,250,.04)',
  },
  shemale: {
    badge: 'TS & Shemale — your own community',
    heroH1: 'Your world.',
    heroEm: 'Not a subcategory.',
    heroSub: "BlushBite's TS community is fully separate — your own profiles, your own dreamers, your own stories. Not a filter on female. A space built for you, by design.",
    accentColor: '#c084fc',
    accentBg: 'rgba(192,132,252,.1)',
    accentGrid: 'rgba(192,132,252,.04)',
    heroBgImage: '/shemale-hero.png',
  },
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Trusted, vetted dreamers',
    body: 'Every dreamer passes age verification and onboarding before they can reach you. No cold enquiries, no browsers. People who arrive have genuine intent — and they are ready to book.',
  },
  {
    title: 'Full booking management',
    body: 'Receive booking requests directly in your dashboard. Accept, decline, or add notes — you control every interaction. No intermediaries, no surprises.',
  },
  {
    title: 'Complete anonymity, always',
    body: 'Your alias is your only identity on BlushBite. Real name, phone number, and location are never shown to dreamers. EU-hosted and GDPR-compliant.',
  },
  {
    title: 'In-person, online, or both',
    body: 'Set your own session modality from your dashboard. Work from your city, from home, or anywhere with a connection. Change your settings any time.',
  },
  {
    title: 'You set your own rates',
    body: 'You price every session. Duration, type, and fee are yours to define on your own session cards. The platform never negotiates on your behalf.',
  },
  {
    title: 'Build a following with stories',
    body: 'Publish stories that keep dreamers returning between sessions. Your content builds your brand and your income — active story libraries consistently earn more.',
  },
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

function focusIn(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#e8607a'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.11)'
}
function focusOut(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#1c2333'
  e.currentTarget.style.boxShadow = 'none'
}

// ── OTP digit box ─────────────────────────────────────────────────────────────

function OtpDigit({
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
  const [focused, setFocused] = useState(false)
  const filled = value !== ''
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

// ── Apply Form ────────────────────────────────────────────────────────────────

function ApplyForm({ community }: { community: Community }) {
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const fpHashRef = useRef<string>('')

  const [uiState, setUiState] = useState<'form' | 'otp' | 'success'>('form')
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pre-compute fingerprint so it's ready by the time apply succeeds
  useEffect(() => {
    getFingerprint().then((fp) => { fpHashRef.current = fp }).catch(() => {})
  }, [])

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [agreeAge, setAgreeAge] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const [digits, setDigits] = useState(['', '', '', '', '', ''])

  function goTo(state: 'form' | 'otp' | 'success') {
    setAnimKey((k) => k + 1)
    setUiState(state)
    window.scrollTo({ top: document.getElementById('apply')?.offsetTop ?? 0, behavior: 'smooth' })
  }

  async function sendOtp() {
    setError('')
    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Enter a stage name — at least 2 characters.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!agreeAge) {
      setError('Please confirm you are 18 or older.')
      return
    }
    if (!agreeTerms) {
      setError('Please accept the Terms & Conditions to continue.')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/companions/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await r.json()
      if (!r.ok) {
        setError(d.error ?? 'Failed to send code. Try again.')
        return
      }
      goTo('otp')
      setTimeout(() => otpRefs.current[0]?.focus(), 150)
    } finally {
      setLoading(false)
    }
  }

  function handleDigit(idx: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = v
    setDigits(next)
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (next.every((d) => d) && v) verifyAndCreate(next.join(''))
  }

  function handleDigitKey(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      otpRefs.current[5]?.focus()
      verifyAndCreate(text)
    }
  }

  async function verifyAndCreate(otp: string) {
    setError('')
    setLoading(true)
    try {
      const vr = await fetch('/api/companions/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const vd = await vr.json()

      if (!vr.ok) {
        setError(vd.error ?? 'Incorrect code. Try again.')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
        return
      }

      const ar = await fetch('/api/companions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email,
          agreeToTerms: true,
          gender_community: community,
        }),
      })
      const ad = await ar.json()

      if (!ar.ok) {
        if (ar.status === 409) {
          setError('This email is already registered.')
          setUiState('form')
        } else {
          setError(ad.error ?? 'Something went wrong. Please try again.')
        }
        return
      }

      // Bind fingerprint → companion_id now that session cookie is set.
      // This ensures admin delete can cleanly remove the device binding later.
      if (fpHashRef.current) {
        fetch('/api/device/bind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint_hash: fpHashRef.current, community }),
        }).catch(() => {})
      }

      goTo('success')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: '#0d1117', border: '1px solid #1c2333' }}
    >
      <div
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #e8607a 35%, #c9a96e 65%, transparent 100%)',
        }}
      />

      <div className="px-6 pt-7 pb-8 sm:px-8">
        {/* Step track */}
        <div className="flex gap-2 mb-7">
          {[1, 2, 3].map((n) => {
            const stateIdx = uiState === 'form' ? 1 : uiState === 'otp' ? 2 : 3
            return (
              <div
                key={n}
                className="flex-1 h-[3px] rounded-full transition-all duration-[400ms]"
                style={{
                  background:
                    stateIdx > n
                      ? 'linear-gradient(90deg,#e8607a,#c9a96e)'
                      : stateIdx === n
                        ? 'rgba(232,96,122,0.55)'
                        : '#1c2333',
                }}
              />
            )
          })}
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-[13px] mb-5"
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              color: '#f87171',
            }}
          >
            {error}
            {error.includes('already registered') && (
              <Link href="/login" style={{ marginLeft: 8, color: '#e8607a', textDecoration: 'underline' }}>
                Sign in →
              </Link>
            )}
          </div>
        )}

        {uiState === 'form' && (
          <div key={`form-${animKey}`} className="animate-fade-up">
            <p className="text-[11px] uppercase tracking-[0.1em] mb-1.5" style={{ color: '#6b7280' }}>
              Step 1 of 2
            </p>
            <h2
              className="text-[26px] sm:text-[28px] leading-tight mb-2"
              style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
            >
              Your{' '}
              <em className="italic" style={{ color: '#e8607a' }}>
                stage
              </em>
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#6b7280' }}>
              Two fields. Your alias and email — that&rsquo;s it. Your real name stays completely private.
            </p>

            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>
              Stage name
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="The name dreamers will know you by"
              maxLength={60}
              inputMode="text"
              autoCapitalize="words"
              autoComplete="off"
              onFocus={focusIn}
              onBlur={focusOut}
            />
            <p className="text-[11px] -mt-2 mb-5" style={{ color: '#4b5563' }}>
              Your persona, not your legal name. E.g. Ava, Seren, Maëve.
            </p>

            <label className="block text-[12px] mb-1.5" style={{ color: '#9ca3af' }}>
              Email address
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              inputMode="email"
              autoComplete="email"
              onFocus={focusIn}
              onBlur={focusOut}
            />

            <div className="flex flex-col gap-3 mb-6">
              <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAgreeAge((v) => !v)}>
                <span
                  className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-[150ms]"
                  style={{
                    background: agreeAge ? '#e8607a' : 'transparent',
                    border: `1.5px solid ${agreeAge ? '#e8607a' : '#1c2333'}`,
                  }}
                >
                  {agreeAge && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="text-[13px] leading-[1.55]" style={{ color: '#9ca3af' }}>
                  I confirm I am <strong style={{ color: '#eeeef0' }}>18 years of age or older</strong>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAgreeTerms((v) => !v)}>
                <span
                  className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-[150ms]"
                  style={{
                    background: agreeTerms ? '#e8607a' : 'transparent',
                    border: `1.5px solid ${agreeTerms ? '#e8607a' : '#1c2333'}`,
                  }}
                >
                  {agreeTerms && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="text-[13px] leading-[1.55]" style={{ color: '#9ca3af' }}>
                  I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener" style={{ color: '#e8607a', textDecoration: 'none' }}>
                    Terms &amp; Conditions
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" rel="noopener" style={{ color: '#e8607a', textDecoration: 'none' }}>
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full rounded-xl text-[15px] font-medium min-h-[52px] transition-all duration-[150ms] active:scale-[0.98] disabled:opacity-60 cursor-pointer mt-1"
              style={{ background: '#e8607a', color: '#fff', border: 'none' }}
            >
              {loading ? 'Sending…' : 'Send verification code →'}
            </button>
          </div>
        )}

        {uiState === 'otp' && (
          <div key={`otp-${animKey}`} className="animate-fade-up">
            <p className="text-[11px] uppercase tracking-[0.1em] mb-1.5" style={{ color: '#6b7280' }}>
              Step 2 of 2
            </p>
            <h2
              className="text-[26px] sm:text-[28px] leading-tight mb-2"
              style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
            >
              Verify your{' '}
              <em className="italic" style={{ color: '#e8607a' }}>
                email
              </em>
            </h2>
            <p className="text-[14px] mb-2" style={{ color: '#6b7280' }}>
              Code sent to <strong style={{ color: '#eeeef0' }}>{email}</strong>
            </p>
            <p className="text-[11px] mb-6" style={{ color: '#4b5563' }}>
              expires in 10 min · private · secure
            </p>

            <div className="flex gap-2 mb-5" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <OtpDigit
                  key={i}
                  idx={i}
                  value={d}
                  inputRef={(el) => { otpRefs.current[i] = el }}
                  onChange={handleDigit}
                  onKeyDown={handleDigitKey}
                />
              ))}
            </div>

            {loading && (
              <p className="text-center text-[13px] mb-4 animate-pulse" style={{ color: '#6b7280' }}>
                Creating your account…
              </p>
            )}

            <button
              onClick={() => { setUiState('form'); setDigits(['', '', '', '', '', '']); setAnimKey((k) => k + 1) }}
              className="text-[13px] bg-transparent border-none p-0 cursor-pointer"
              style={{ color: '#4b5563' }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = '#eeeef0' }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = '#4b5563' }}
            >
              ← Different email
            </button>
          </div>
        )}

        {uiState === 'success' && (
          <div key={`success-${animKey}`} className="animate-scale-in text-center py-4">
            <div style={{ fontSize: 36, marginBottom: 12, color: '#c9a96e' }}>✦</div>
            <p className="text-[11px] uppercase tracking-[0.1em] mb-1.5" style={{ color: '#6b7280' }}>
              Welcome to BlushBite
            </p>
            <h2
              className="text-[26px] sm:text-[28px] leading-tight mb-3"
              style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
            >
              Your stage is{' '}
              <em className="italic" style={{ color: '#e8607a' }}>
                waiting.
              </em>
            </h2>
            <p className="text-[14px] leading-[1.75] mb-8 max-w-[340px] mx-auto" style={{ color: '#6b7280' }}>
              Your profile is live. Dreamers can already find you — add photos, write your first story, and set your rate to attract your first bookings.
            </p>
            <Link
              href="/dashboard?welcome=1"
              className="inline-flex items-center justify-center rounded-xl text-[15px] font-medium min-h-[52px] px-8 transition-all duration-[150ms] active:scale-[0.98]"
              style={{ background: '#e8607a', color: '#fff', textDecoration: 'none' }}
            >
              Go to your dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Full gender landing page ───────────────────────────────────────────────────

export default function GenderLanding({
  community,
  companionCount = 0,
  cityCount = 0,
  activeBoosts = { headerBanner: null, rightRail: null, featured: [] },
}: {
  community: Community
  companionCount?: number
  cityCount?: number
  activeBoosts?: ActiveBoosts
}) {
  const cfg = COMMUNITY_CONFIG[community]

  // ── First-visit overlay state ──────────────────────────────────────────────
  // null = still checking localStorage (SSR-safe), true = show, false = hidden
  const [showOverlay, setShowOverlay] = useState<boolean | null>(null)
  const [overlayFading, setOverlayFading] = useState(false)

  const dismissOverlay = useCallback(() => {
    setShowOverlay(false)
  }, [])

  function handleEnterClick() {
    // Start fade-out — the overlay's onTransitionEnd will call dismissOverlay
    setOverlayFading(true)
  }

  // ── Device binding ────────────────────────────────────────────────────────
  useEffect(() => {
    // Check first-visit: if bb_community not set in localStorage, this is a new visitor
    let isFirstVisit = false
    try {
      const stored = localStorage.getItem('bb_community')
      isFirstVisit = stored !== community
    } catch {
      isFirstVisit = false
    }
    setShowOverlay(isFirstVisit)

    // Bind device to this community (cookie + localStorage + fingerprint DB binding)
    document.cookie = `bb_community=${community}; max-age=31536000; path=/; SameSite=Lax`
    try { localStorage.setItem('bb_community', community) } catch { /* ignore */ }

    // Persist fingerprint → community in DB so other browsers on same device auto-redirect
    getFingerprint().then((fp) => {
      fetch('/api/device/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint_hash: fp, community }),
      }).catch(() => {})
    }).catch(() => {})
  }, [community])

  return (
    <div style={{ background: '#07090f', color: '#eeeef0', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── First-visit community welcome overlay ── */}
      {showOverlay === true && (
        <FirstVisitOverlay
          community={community}
          onEnter={dismissOverlay}
          onStartFade={handleEnterClick}
          fading={overlayFading}
        />
      )}

      {/* ── Noise texture overlay ── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1000,
          opacity: 0.5,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[900] flex items-center justify-between px-4 sm:px-8 h-16"
        style={{
          background: 'rgba(7,9,15,.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1c2333',
        }}
      >
        <Image src="/logo.png" alt="BlushBite" width={200} height={70} style={{ height: 70, width: 'auto', display: 'block' }} />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-medium rounded-full px-3 min-h-[36px] inline-flex items-center transition-all duration-[150ms]"
            style={{
              color: '#eeeef0',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
          <a
            href="#apply"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full px-4 min-h-[40px] transition-all duration-[150ms]"
            style={{
              color: cfg.accentColor,
              background: cfg.accentBg,
              border: `1px solid ${cfg.accentColor}44`,
              textDecoration: 'none',
            }}
          >
            Apply now
          </a>
        </div>
      </nav>

      {/* ── Header Banner (promoted companion) ── */}
      {activeBoosts.headerBanner && (
        <div style={{ paddingTop: 64 /* nav height */ }}>
          <HeaderBanner
            boost={activeBoosts.headerBanner}
            accentColor={cfg.accentColor}
            accentBg={cfg.accentBg}
          />
        </div>
      )}

      {/* ── Hero ── */}
      <section className={`relative min-h-screen flex flex-col items-center justify-center text-center px-5 pb-20 overflow-hidden ${activeBoosts.headerBanner ? 'pt-12' : 'pt-28'}`}>
        {cfg.heroBgImage && (
          <>
            <div
              className="bb-hero-bg-image absolute inset-0 pointer-events-none z-0"
              style={{
                top: '4rem',
                backgroundImage: `url(${cfg.heroBgImage})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                opacity: 0.7,
                filter: 'brightness(0.9) contrast(1.05)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 95%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 95%)',
              }}
            />
            <style>{`
              .bb-hero-bg-image {
                background-position: left 35%;
              }
              @media (min-width: 1024px) {
                .bb-hero-bg-image {
                  background-position: center 35%;
                }
              }
            `}</style>
          </>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${cfg.accentGrid} 1px,transparent 1px),linear-gradient(90deg,${cfg.accentGrid} 1px,transparent 1px)`,
            backgroundSize: '60px 60px',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%,black 25%,transparent 80%)',
            maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%,black 25%,transparent 80%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `radial-gradient(ellipse 72% 58% at 50% 28%,${cfg.accentBg} 0%,transparent 70%)`,
          }}
        />
        <div className="relative z-10 animate-fade-up">
          <div
            className="inline-flex items-center gap-2 rounded-full text-[11px] font-medium uppercase tracking-[0.07em] px-3.5 py-1.5 mb-4"
            style={{
              color: cfg.accentColor,
              background: cfg.accentBg,
              border: `1px solid ${cfg.accentColor}40`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.accentColor }} />
            {cfg.badge}
          </div>

          {/* Live stats */}
          {companionCount > 0 && (
            <div className="flex items-center justify-center gap-5 mb-7">
              <div className="text-center">
                <div className="text-[22px] font-semibold leading-none mb-0.5" style={{ fontFamily: 'var(--font-serif)', color: '#c9a96e' }}>
                  {companionCount}
                </div>
                <div className="text-[10px] uppercase tracking-[0.08em]" style={{ color: '#4b5563' }}>companions</div>
              </div>
              <div style={{ width: 1, height: 28, background: '#1c2333' }} />
              {cityCount > 0 && (
                <>
                  <div className="text-center">
                    <div className="text-[22px] font-semibold leading-none mb-0.5" style={{ fontFamily: 'var(--font-serif)', color: '#c9a96e' }}>
                      {cityCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.08em]" style={{ color: '#4b5563' }}>cities</div>
                  </div>
                  <div style={{ width: 1, height: 28, background: '#1c2333' }} />
                </>
              )}
              <div className="text-center">
                <div className="text-[22px] font-semibold leading-none mb-0.5" style={{ fontFamily: 'var(--font-serif)', color: '#c9a96e' }}>EU</div>
                <div className="text-[10px] uppercase tracking-[0.08em]" style={{ color: '#4b5563' }}>verified</div>
              </div>
            </div>
          )}
          <h1
            className="text-[clamp(32px,5.5vw,58px)] font-normal leading-[1.12] mb-5 max-w-[680px] mx-auto"
            style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
          >
            {cfg.heroH1}
            <br />
            <em className="italic" style={{ color: '#e8607a' }}>
              {cfg.heroEm}
            </em>
          </h1>
          <p
            className="text-[15px] leading-[1.75] max-w-[460px] mx-auto mb-10"
            style={{ color: '#6b7280' }}
          >
            {cfg.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="#apply"
              className="inline-flex items-center justify-center rounded-full font-medium text-[14px] px-7 min-h-[50px] min-w-[180px] transition-all duration-[150ms] active:scale-[0.98]"
              style={{ color: '#fff', background: '#e8607a', border: 'none', textDecoration: 'none' }}
            >
              Begin your journey
            </a>
            <a
              href="#why-join"
              className="inline-flex items-center justify-center rounded-full text-[14px] min-h-[50px] px-6 transition-all duration-[150ms]"
              style={{ color: '#6b7280', border: '1px solid #1c2333', textDecoration: 'none' }}
            >
              See what&rsquo;s inside ↓
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
          ['✦', 'Instant access — build your profile today'],
          ['▶', 'Dedicated companion support'],
        ].map(([icon, text], i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: '#6b7280' }}>
            <span style={{ color: '#c9a96e' }}>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* ── Featured companions (social proof) ── */}
      {activeBoosts.featured.length > 0 && (
        <div style={{ padding: '24px 0', borderBottom: '1px solid #1c2333' }}>
          <div className="max-w-[1100px] mx-auto px-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: cfg.accentColor }}>Featured</span>
                <span style={{ width: 1, height: 10, background: '#1c2333', display: 'inline-block' }} />
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4b5563' }}>Active this week</span>
              </div>
            </div>
            <div style={{
              display: 'flex', gap: 12, overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 4,
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}>
              {activeBoosts.featured.map(b => (
                <div key={b.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                  <FeaturedCard boost={b} accentColor={cfg.accentColor} accentBg={cfg.accentBg} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Why join (with optional right rail) ── */}
      <div id="why-join" style={{ position: 'relative' }}>
        {/* Right rail — desktop only (≥1100px), rendered as a sibling via flex */}
        {activeBoosts.rightRail && (
          <div
            className="bb-right-rail"
            style={{
              position: 'absolute', top: 0, right: 20,
              display: 'none', // shown via CSS below
            }}
          >
            <RightRail boost={activeBoosts.rightRail} accentColor={cfg.accentColor} accentBg={cfg.accentBg} />
          </div>
        )}
        <style>{`
          @media (min-width: 1100px) {
            .bb-right-rail { display: block !important; }
          }
          /* hide scrollbar on featured row */
          ::-webkit-scrollbar { display: none; }
        `}</style>
      </div>

      {/* ── Why join original content ── */}
      <div id="why-join-content">
        <div className="max-w-[1100px] mx-auto px-5 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: '#6b7280' }}>
            For Companions
          </p>
          <h2
            className="text-[clamp(26px,4vw,40px)] font-normal leading-tight mb-3 max-w-[560px]"
            style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
          >
            Why companions choose{' '}
            <em className="italic" style={{ color: '#e8607a' }}>
              BlushBite
            </em>
          </h2>
          <p className="text-[15px] leading-[1.75] max-w-[500px] mb-10" style={{ color: '#6b7280' }}>
            Not a listing site. Not a directory. A private ecosystem built so you can build, earn,
            and grow — entirely on your own terms.
          </p>

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
                style={{
                  borderRight: i < 2 ? '1px solid #1c2333' : 'none',
                  borderBottom: i < 2 ? '1px solid #1c2333' : 'none',
                }}
              >
                <span
                  className="block text-[34px] leading-none mb-2"
                  style={{ fontFamily: 'var(--font-serif)', color: '#c9a96e' }}
                >
                  {num}
                </span>
                <span
                  className="block text-[11px] uppercase tracking-[0.07em] leading-snug whitespace-pre-line"
                  style={{ color: '#6b7280' }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
            {FEATURES.map((f) => (
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

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center rounded-2xl p-7 sm:p-10"
            style={{ background: '#0d1117', border: '1px solid rgba(232,96,122,.2)' }}
          >
            <div>
              <h3
                className="text-[24px] sm:text-[26px] font-normal leading-[1.35] mb-4"
                style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
              >
                Your world. Your income.
                <br />
                <em className="italic" style={{ color: '#e8607a' }}>Your rules.</em>
              </h3>
              <p className="text-[13px] leading-[1.8]" style={{ color: '#6b7280' }}>
                Once you join, you get instant access to a full companion dashboard — everything you need to
                build a presence, attract dreamers, and run your sessions your way.
              </p>
            </div>
            <div>
              {ACCESS_LIST.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-[13px] py-2.5"
                  style={{
                    borderBottom: i < ACCESS_LIST.length - 1 ? '1px solid #1c2333' : 'none',
                    color: '#eeeef0',
                  }}
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
          <p className="text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: '#6b7280' }}>
            The process
          </p>
          <h2
            className="text-[clamp(26px,4vw,40px)] font-normal leading-tight mb-10 max-w-[560px]"
            style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
          >
            From application{' '}
            <em className="italic" style={{ color: '#e8607a' }}>to live</em>
          </h2>
          {[
            {
              title: 'Apply in seconds',
              body: 'Enter your stage name and email. Confirm your age and accept our terms. We send a verification code — enter it and your profile is live instantly.',
            },
            {
              title: 'Build your profile',
              body: 'Log in to your companion dashboard. Upload photos and videos, write your stories, set your session cards, and define your pricing — all at your own pace.',
            },
            {
              title: 'Go live on your terms',
              body: 'Toggle visibility from your dashboard when you are ready. Dreamers can find you, view your profile, and send booking requests — which you approve or decline.',
            },
          ].map((s, i) => (
            <div
              key={i}
              className="flex gap-6 items-start py-7"
              style={{ borderBottom: i < 2 ? '1px solid #1c2333' : 'none' }}
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
        <p className="text-[11px] uppercase tracking-[0.1em] mb-2 text-center" style={{ color: '#6b7280' }}>
          Apply now
        </p>
        <h2
          className="text-[clamp(26px,4vw,40px)] font-normal leading-tight mb-2 text-center"
          style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
        >
          Begin your{' '}
          <em className="italic" style={{ color: '#e8607a' }}>journey.</em>
        </h2>
        <p className="text-[15px] leading-[1.75] text-center mb-10" style={{ color: '#6b7280' }}>
          Two fields. Instant access. Your stage is ready in under a minute.
        </p>
        <ApplyForm community={community} />
        <p className="text-center text-[12px] mt-5" style={{ color: '#4b5563' }}>
          Already a member?{' '}
          <Link href="/login" style={{ color: '#e8607a', textDecoration: 'none' }}>
            Sign in to your dashboard
          </Link>
        </p>
      </div>

      {/* ── Footer ── */}
      <footer className="px-5 py-8" style={{ borderTop: '1px solid #1c2333', background: '#0d1117' }}>
        <div className="max-w-[900px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
            <Image src="/logo.png" alt="BlushBite" width={200} height={70} style={{ height: 70, width: 'auto', display: 'block' }} />
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px]" style={{ color: '#4b5563' }}>
              <Link href="/terms" style={{ color: '#4b5563', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
              <Link href="/privacy" style={{ color: '#4b5563', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/companion-guidelines" style={{ color: '#4b5563', textDecoration: 'none' }}>Companion Guidelines</Link>
              <a href="mailto:hello@blushbite.co" style={{ color: '#4b5563', textDecoration: 'none' }}>Contact</a>
            </div>
          </div>
          <div className="h-px mb-5" style={{ background: '#1c2333' }} />
          <p className="text-center text-[11px]" style={{ color: '#374151' }}>
            &copy; BlushBite &nbsp;·&nbsp; EU-hosted · GDPR compliant · Netherlands &nbsp;·&nbsp; Your real name and data are never shared with dreamers.
          </p>
        </div>
      </footer>
    </div>
  )
}
