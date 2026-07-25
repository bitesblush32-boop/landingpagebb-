'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  views_today: number
  views_week: number
  views_month: number
  whatsapp_clicks: number
  bookings_pending: number
}

interface CompanionMe {
  id: string
  name: string
  is_live: boolean
  profile_completeness: number
  status: string
  companion_whatsapp: string | null
  profile_whatsapp: string | null
  telegram_handle: string | null
  has_primary_photo: number
}

const S: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  greeting: { marginBottom: 32 },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#6b7280',
    marginBottom: 6,
  } as React.CSSProperties,
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 28,
    color: '#eeeef0',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  sub: { fontSize: 14, color: '#6b7280' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 16,
    padding: '20px 22px',
  },
  statNum: {
    fontFamily: 'var(--font-serif)',
    fontSize: 30,
    color: '#e8607a',
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  } as React.CSSProperties,
  completenessCard: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 24,
  },
  progressBg: {
    background: '#1c2333',
    borderRadius: 99,
    height: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  quickLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
  },
  quickLink: {
    background: '#111620',
    border: '1px solid #1c2333',
    borderRadius: 14,
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    textDecoration: 'none',
    transition: 'border-color .15s',
  } as React.CSSProperties,
  shimmer: {
    background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 16,
    animation: 'shimmer 1.5s infinite',
  },
}

const QUICK_LINKS = [
  { href: '/dashboard/profile', label: 'Edit profile', icon: '◉', desc: 'Update your bio & details' },
  { href: '/dashboard/photos', label: 'Manage photos', icon: '◻', desc: 'Upload & set your primary photo' },
  { href: '/dashboard/videos', label: 'Add videos', icon: '▷', desc: 'Share short video clips' },
  { href: '/dashboard/stories', label: 'Write a story', icon: '✦', desc: 'Publish companion stories' },
  { href: '/dashboard/bookings', label: 'Bookings', icon: '◷', desc: 'View & respond to requests' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '▥', desc: 'See your profile stats' },
]

// ─── Tour Modal ────────────────────────────────────────────────────────────────

const WA_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path fill="#25D366" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.977-1.418A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
    <path fill="#fff" d="M16.75 14.4c-.25-.125-1.475-.73-1.7-.812-.228-.083-.394-.125-.56.125-.167.25-.645.812-.79.98-.146.166-.292.187-.542.062-.25-.125-1.055-.389-2.01-1.24-.743-.663-1.244-1.48-1.39-1.73-.146-.25-.015-.385.11-.51.113-.11.25-.291.375-.437.125-.145.167-.25.25-.416.083-.167.042-.313-.02-.438-.063-.125-.56-1.354-.769-1.854-.202-.487-.408-.42-.56-.428l-.477-.008c-.167 0-.438.063-.667.313-.23.25-.875.854-.875 2.083 0 1.23.896 2.417 1.021 2.584.125.166 1.764 2.694 4.271 3.778.597.257 1.063.41 1.426.526.599.19 1.145.163 1.576.099.48-.072 1.475-.604 1.684-1.188.208-.583.208-1.083.146-1.187-.063-.104-.23-.167-.48-.292z"/>
  </svg>
)

const TG_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#26A5E4"/>
    <path fill="#fff" d="M17.707 7.293l-2.12 10.003c-.155.688-.562.856-1.137.532l-3.146-2.317-1.518 1.46c-.168.168-.308.308-.632.308l.226-3.196 5.826-5.263c.253-.226-.055-.35-.394-.125L7.07 13.99 3.97 13.02c-.674-.21-.687-.674.14-.998l13.257-5.11c.562-.203 1.054.137.87 1.381h-.53z"/>
  </svg>
)

const CAM_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const GRID_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)

const SUCCESS_SVG = (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="28" fill="rgba(34,197,94,.12)"/>
    <circle cx="28" cy="28" r="20" fill="rgba(34,197,94,.2)"/>
    <path stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M19 28l6 6 12-12"/>
  </svg>
)

const TOUR_STEPS = [
  {
    eyebrow: 'Step 1 of 3',
    title: 'Start with who you are.',
    body: 'Open Identity & Details. Fill your name, contact info, and bio.',
    rows: [
      { icon: WA_SVG,   label: 'WhatsApp',  desc: 'Dreamers reach you directly' },
      { icon: TG_SVG,   label: 'Telegram',  desc: 'Your username or number' },
    ],
    cta: 'Go to Identity & Details →',
    ctaHref: '/dashboard/profile',
  },
  {
    eyebrow: 'Step 2 of 3',
    title: 'Name your price.',
    body: 'Go to your profile, open the Rates tab, add one service.',
    rows: [
      { icon: <span style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>₿</span>, label: 'Service name', desc: 'What you offer dreamers' },
      { icon: <span style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>€</span>, label: 'Rate',         desc: "What they'll see before booking" },
    ],
    cta: 'Set my rates →',
    ctaHref: '/dashboard/profile',
  },
  {
    eyebrow: 'Step 3 of 3',
    title: 'Let them see your world.',
    body: 'Upload at least one photo. It shows on every discovery card.',
    rows: [
      { icon: CAM_SVG,  label: 'Primary photo', desc: 'Your face on every card' },
      { icon: GRID_SVG, label: 'Gallery',        desc: 'Shown when a dreamer opens your profile' },
    ],
    cta: 'Upload a photo →',
    ctaHref: '/dashboard/photos',
  },
]

function TourModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const isSuccess = step === 3

  function advance() {
    if (step < 3) setStep((s) => s + 1)
    else onClose()
  }

  const current = !isSuccess ? TOUR_STEPS[step] : null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7,9,15,0.92)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          background: '#0d1117',
          border: '1px solid #1c2333',
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 480,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Success card */}
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              {SUCCESS_SVG}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: '#eeeef0', lineHeight: 1.3, marginBottom: 10 }}>
              You&apos;re all set.
            </h2>
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65, marginBottom: 28 }}>
              Your stage is ready. Dreamers can now find you.
            </p>
            <button
              onClick={onClose}
              style={{
                background: '#e8607a',
                border: 'none',
                color: '#fff',
                padding: '13px 20px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Enter my dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Step dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 99,
                    background: i === step ? '#e8607a' : '#1c2333',
                    transition: 'width .2s ease',
                  }}
                />
              ))}
            </div>

            <p style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 8 }}>
              {current!.eyebrow}
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#eeeef0', lineHeight: 1.3, marginBottom: 12 }}>
              {current!.title}
            </h2>
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65, marginBottom: 24 }}>
              {current!.body}
            </p>

            {/* Feature rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {current!.rows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: '#111620',
                    borderRadius: 12,
                    border: '1px solid #1c2333',
                  }}
                >
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{row.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0', marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{row.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={current!.ctaHref}
                style={{
                  display: 'block',
                  background: '#e8607a',
                  color: '#fff',
                  textDecoration: 'none',
                  textAlign: 'center',
                  padding: '13px 20px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {current!.cta}
              </a>
              <button
                onClick={advance}
                style={{
                  background: 'transparent',
                  border: '1px solid #1c2333',
                  color: '#6b7280',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontSize: 13,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Next →
              </button>
            </div>

            {/* Skip — step 0 only */}
            {step === 0 && (
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  color: '#4b5563',
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 4,
                }}
                aria-label="Skip tour"
              >
                ×
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Required Action Banner ────────────────────────────────────────────────────

function RequiredActionBanner({
  hasWhatsapp,
  hasTelegram,
  hasPrimaryPhoto,
}: {
  hasWhatsapp: boolean
  hasTelegram: boolean
  hasPrimaryPhoto: boolean
}) {
  const hasContact = hasWhatsapp && hasTelegram
  const allDone = hasContact && hasPrimaryPhoto
  if (allDone) return null

  const items = [
    {
      label: 'Add WhatsApp & Telegram',
      done: hasContact,
      href: '/dashboard/profile',
      hint: hasWhatsapp && !hasTelegram ? 'Telegram missing' : !hasWhatsapp ? 'WhatsApp missing' : '',
    },
    {
      label: 'Upload your primary photo',
      done: hasPrimaryPhoto,
      href: '/dashboard/photos',
      hint: '',
    },
  ]

  return (
    <div
      style={{
        background: 'rgba(232,96,122,.05)',
        border: '1px solid rgba(232,96,122,.25)',
        borderRadius: 16,
        padding: '20px 22px',
        marginBottom: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#e8607a',
            flexShrink: 0,
          }}
        />
        <p style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0' }}>
          Your profile is hidden from dreamers
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `1px solid ${item.done ? '#22c55e' : 'rgba(232,96,122,.5)'}`,
                background: item.done ? 'rgba(34,197,94,.12)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: item.done ? '#22c55e' : 'transparent',
                flexShrink: 0,
              }}
            >
              ✓
            </span>
            {item.done ? (
              <span style={{ fontSize: 13, color: '#6b7280', textDecoration: 'line-through' }}>
                {item.label}
              </span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <a href={item.href} style={{ fontSize: 13, color: '#e8607a', textDecoration: 'none' }}>
                  {item.label} →
                </a>
                {item.hint && (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#6b7280',
                      background: '#111620',
                      border: '1px solid #1c2333',
                      borderRadius: 6,
                      padding: '2px 7px',
                    }}
                  >
                    {item.hint}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard Content ────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === '1'

  const [me, setMe] = useState<CompanionMe | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/companions/me').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/companions/analytics').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([meData, statsData]) => {
        if (!meData) {
          router.replace('/login')
          return
        }
        setMe(meData)
        setStats(statsData)

        const hasWhatsapp = !!(meData.companion_whatsapp || meData.profile_whatsapp)
        const hasTelegram = !!meData.telegram_handle
        const hasPrimaryPhoto = (meData.has_primary_photo ?? 0) > 0
        const tourComplete = hasWhatsapp && hasTelegram && hasPrimaryPhoto

        const tourDismissed = (() => {
          try { return !!localStorage.getItem('bb_tour_v1') } catch { return false }
        })()

        if (isWelcome || (!tourDismissed && !tourComplete)) {
          setShowTour(true)
          if (isWelcome) window.history.replaceState({}, '', '/dashboard')
        }

        if (tourComplete) {
          try { localStorage.setItem('bb_tour_v1', 'done') } catch { /* ignore */ }
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router, isWelcome])

  function closeTour() {
    try { localStorage.setItem('bb_tour_v1', 'seen') } catch { /* ignore */ }
    setShowTour(false)
  }

  const displayName = me?.name?.split(' ')[0] || 'there'

  const hasWhatsapp = !!(me?.companion_whatsapp || me?.profile_whatsapp)
  const hasTelegram = !!me?.telegram_handle
  const hasPrimaryPhoto = (me?.has_primary_photo ?? 0) > 0
  const tourComplete = hasWhatsapp && hasTelegram && hasPrimaryPhoto

  if (loading)
    return (
      <div style={S.page}>
        <div style={{ ...S.shimmer, height: 80, marginBottom: 24 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ ...S.shimmer, height: 90 }} />
          ))}
        </div>
        <div style={{ ...S.shimmer, height: 120 }} />
      </div>
    )

  return (
    <>
      {/* Tour modal — fullscreen overlay */}
      {showTour && me && (
        <TourModal onClose={closeTour} />
      )}

      <div style={S.page}>
        {/* Required action banner */}
        {me && (
          <RequiredActionBanner
            hasWhatsapp={hasWhatsapp}
            hasTelegram={hasTelegram}
            hasPrimaryPhoto={hasPrimaryPhoto}
          />
        )}

        {/* Greeting */}
        <div style={S.greeting}>
          <p style={S.eyebrow}>Companion dashboard</p>
          <h1 style={S.title}>
            Welcome back, <em style={{ fontStyle: 'italic', color: '#e8607a' }}>{displayName}.</em>
          </h1>
          <p style={S.sub}>
            {tourComplete && me?.is_live
              ? 'Your profile is live — dreamers can discover you.'
              : tourComplete
                ? "Your profile is ready. Toggle it live from the sidebar when you're ready."
                : 'Complete the 2 required steps above to become visible to dreamers.'}
          </p>
        </div>

        {/* Stats */}
        <div style={S.grid}>
          {[
            { label: 'Views today', val: stats?.views_today ?? 0 },
            { label: 'Views this week', val: stats?.views_week ?? 0 },
            { label: 'Views this month', val: stats?.views_month ?? 0 },
            { label: 'WhatsApp clicks', val: stats?.whatsapp_clicks ?? 0 },
            { label: 'Pending bookings', val: stats?.bookings_pending ?? 0 },
          ].map((s) => (
            <div key={s.label} style={S.statCard}>
              <div style={S.statNum}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Profile completeness */}
        {me && (
          <div style={S.completenessCard}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: '#eeeef0' }}>
                Profile completeness
              </span>
              <span style={{ fontSize: 14, color: '#e8607a', fontWeight: 500 }}>
                {me.profile_completeness}%
              </span>
            </div>
            <div style={S.progressBg}>
              <div
                style={{
                  width: `${me.profile_completeness}%`,
                  height: '100%',
                  background: '#e8607a',
                  borderRadius: 99,
                  transition: 'width 1s ease',
                }}
              />
            </div>
            {me.profile_completeness < 70 && (
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
                Complete your profile to attract more dreamers.{' '}
                <Link href="/dashboard/profile" style={{ color: '#e8607a', textDecoration: 'none' }}>
                  Continue →
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Quick links */}
        <p
          style={
            {
              fontSize: 12,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 14,
            } as React.CSSProperties
          }
        >
          Quick actions
        </p>
        <div style={S.quickLinks}>
          {QUICK_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={S.quickLink}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(232,96,122,.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1c2333')}
            >
              <span style={{ fontSize: 20, color: '#e8607a' }}>{l.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0' }}>{l.label}</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{l.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
