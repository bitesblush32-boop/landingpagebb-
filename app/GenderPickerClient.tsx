'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getFingerprint } from '@/lib/fingerprint'

type Community = 'female' | 'male' | 'shemale'
type UIState = 'checking' | 'picker' | 'selecting'

const VALID: Community[] = ['female', 'male', 'shemale']

const COMMUNITIES: {
  id: Community
  label: string
  symbol: string
  desc: string
  color: string
  colorBg: string
  colorBorder: string
}[] = [
  {
    id: 'female',
    label: 'Female',
    symbol: '♀',
    desc: 'Female escorts & companions',
    color: '#e8607a',
    colorBg: 'rgba(232,96,122,.08)',
    colorBorder: 'rgba(232,96,122,.3)',
  },
  {
    id: 'male',
    label: 'Male',
    symbol: '♂',
    desc: 'Male escorts & companions',
    color: '#60a5fa',
    colorBg: 'rgba(96,165,250,.08)',
    colorBorder: 'rgba(96,165,250,.3)',
  },
  {
    id: 'shemale',
    label: 'TS / Shemale',
    symbol: '⚥',
    desc: 'TS escorts & shemale companions',
    color: '#c084fc',
    colorBg: 'rgba(192,132,252,.08)',
    colorBorder: 'rgba(192,132,252,.3)',
  },
]

// ── Cookie helper ─────────────────────────────────────────────────────────────

function setCommunityCookie(community: Community) {
  document.cookie = `bb_community=${community}; max-age=31536000; path=/; SameSite=Lax`
  try {
    localStorage.setItem('bb_community', community)
  } catch {
    // ignore
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GenderPickerClient() {
  const router = useRouter()
  const [uiState, setUiState] = useState<UIState>('checking')
  const [hoveredId, setHoveredId] = useState<Community | null>(null)
  const fpHashRef = useRef<string>('')

  const doRedirect = useCallback(
    (community: Community) => {
      setCommunityCookie(community)
      router.replace(`/${community}`)
    },
    [router]
  )

  useEffect(() => {
    let cancelled = false

    async function check() {
      // ── Layer 1: localStorage fast path ─────────────────────────────────
      try {
        const stored = localStorage.getItem('bb_community') as Community | null
        if (stored && VALID.includes(stored)) {
          if (!cancelled) doRedirect(stored)
          return
        }
      } catch {
        // ignore
      }

      // ── Layer 3: browser fingerprint → DB lookup ─────────────────────────
      try {
        const fp = await getFingerprint()
        fpHashRef.current = fp

        const res = await fetch(`/api/device/community-lookup?fp=${fp}`)
        if (res.ok) {
          const data: { found: boolean; community?: string } = await res.json()
          if (data.found && data.community && VALID.includes(data.community as Community)) {
            if (!cancelled) doRedirect(data.community as Community)
            return
          }
        }
      } catch {
        // network error — fall through to picker
      }

      // Nothing found — show picker
      if (!cancelled) setUiState('picker')
    }

    check()
    return () => {
      cancelled = true
    }
  }, [doRedirect])

  async function select(community: Community) {
    setUiState('selecting')
    setCommunityCookie(community)

    // Store fingerprint → community binding (fire-and-forget)
    const fp = fpHashRef.current
    if (fp) {
      fetch('/api/device/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint_hash: fp, community }),
      }).catch(() => {})
    }

    router.push(`/${community}`)
  }

  // ── Loading / checking ───────────────────────────────────────────────────────
  if (uiState === 'checking' || uiState === 'selecting') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#07090f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', opacity: 0.6 }}>
          <Image
            src="/logo.png"
            alt="BlushBite"
            width={160}
            height={56}
            style={{ height: 56, width: 'auto', display: 'inline-block' }}
          />
        </div>
      </div>
    )
  }

  // ── Picker ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07090f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      {/* Subtle grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(232,96,122,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(232,96,122,.03) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 75%)',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 75%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 720 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Image
            src="/logo.png"
            alt="BlushBite"
            width={200}
            height={70}
            style={{ height: 70, width: 'auto', display: 'inline-block' }}
          />
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#4b5563',
              marginBottom: 10,
            }}
          >
            Companion portal
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(28px, 5vw, 44px)',
              color: '#eeeef0',
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            Choose your{' '}
            <em style={{ fontStyle: 'italic', color: '#e8607a' }}>community.</em>
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 380, margin: '0 auto' }}>
            Each community is separate. Your profile, your stories, and your clients — all within
            your own world.
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}
        >
          {COMMUNITIES.map((c) => {
            const isHovered = hoveredId === c.id
            return (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: isHovered ? c.colorBg : '#0d1117',
                  border: `1px solid ${isHovered ? c.colorBorder : '#1c2333'}`,
                  borderRadius: 20,
                  padding: '32px 24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                  boxShadow: isHovered ? `0 8px 32px ${c.colorBg}` : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    marginBottom: 14,
                    color: isHovered ? c.color : '#4b5563',
                    transition: 'color 0.15s ease',
                    lineHeight: 1,
                  }}
                >
                  {c.symbol}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: isHovered ? '#eeeef0' : '#9ca3af',
                    marginBottom: 6,
                    transition: 'color 0.15s ease',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  {c.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: isHovered ? '#6b7280' : '#374151',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {c.desc}
                </div>
                <div
                  style={{
                    marginTop: 20,
                    fontSize: 12,
                    color: isHovered ? c.color : '#374151',
                    transition: 'color 0.15s ease',
                  }}
                >
                  Enter →
                </div>
              </button>
            )
          })}
        </div>

        {/* Already have an account */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Link
            href="/login"
            style={{ fontSize: 13, color: '#4b5563', textDecoration: 'none' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.color = '#e8607a')}
            onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.color = '#4b5563')}
          >
            Already a companion? Sign in →
          </Link>
        </div>

        {/* Legal */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#374151', marginBottom: 6 }}>
            By entering, you confirm you are 18 or older and accept our{' '}
            <Link href="/terms" style={{ color: '#4b5563', textDecoration: 'underline' }}>
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: '#4b5563', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            .
          </p>
          <p style={{ fontSize: 11, color: '#1f2937' }}>
            EU-hosted · GDPR compliant · Netherlands
          </p>
        </div>
      </div>
    </div>
  )
}
