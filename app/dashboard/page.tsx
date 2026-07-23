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
  alias: string | null
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

const TOUR_STEPS = [
  {
    eyebrow: 'Welcome',
    title: 'Your stage awaits.',
    body: 'This is your companion dashboard — where you manage your profile, photos, stories, and see how dreamers find you. It takes about 5 minutes to go live.',
    sections: [
      { icon: '◉', label: 'Profile', desc: 'Your bio, contact details & rates' },
      { icon: '◻', label: 'Photos', desc: 'Your primary photo appears on every card' },
      { icon: '✦', label: 'Stories', desc: 'Written content that draws dreamers in' },
      { icon: '▥', label: 'Analytics', desc: 'Views, clicks, and booking stats' },
    ],
    cta: null,
    ctaHref: null,
  },
  {
    eyebrow: 'Step 1 of 2 — Required',
    title: 'Add your contact details.',
    body: 'WhatsApp and Telegram are the two buttons dreamers use to reach you. Without them your profile stays hidden — you will not appear in any search or discovery feed.',
    sections: [
      { icon: '📱', label: 'WhatsApp', desc: 'Primary CTA — dreamers message you directly' },
      { icon: '✈️', label: 'Telegram', desc: 'Secondary CTA — username or phone number' },
    ],
    cta: 'Fill my contact details →',
    ctaHref: '/dashboard/profile',
  },
  {
    eyebrow: 'Step 2 of 2 — Required',
    title: 'Upload your primary photo.',
    body: 'Your primary photo is the first thing dreamers see when browsing. Without it your profile card shows a placeholder. Upload at least one photo and set it as primary to complete your profile.',
    sections: [
      { icon: '◻', label: 'Primary photo', desc: 'Shown on your card in discover & search' },
      { icon: '◻', label: 'Gallery photos', desc: 'Shown when a dreamer opens your profile' },
    ],
    cta: 'Upload a photo →',
    ctaHref: '/dashboard/photos',
  },
]

function TourModal({
  onClose,
  tourComplete,
}: {
  onClose: () => void
  tourComplete: boolean
}) {
  const [step, setStep] = useState(0)
  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  function advance() {
    if (isLast) {
      onClose()
    } else {
      setStep((s) => s + 1)
    }
  }

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
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 99,
                background: i === step ? '#e8607a' : '#1c2333',
                transition: 'width .2s ease, background .2s',
              }}
            />
          ))}
        </div>

        <p
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#6b7280',
            marginBottom: 8,
          }}
        >
          {current.eyebrow}
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            color: '#eeeef0',
            lineHeight: 1.3,
            marginBottom: 12,
          }}
        >
          {current.title}
        </h2>
        <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65, marginBottom: 24 }}>
          {current.body}
        </p>

        {/* Feature rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {current.sections.map((sec) => (
            <div
              key={sec.label}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                background: '#111620',
                borderRadius: 12,
                border: '1px solid #1c2333',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{sec.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0', marginBottom: 2 }}>
                  {sec.label}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{sec.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {current.cta && current.ctaHref ? (
            <a
              href={current.ctaHref}
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
              {current.cta}
            </a>
          ) : null}

          <button
            onClick={advance}
            style={{
              background: current.cta ? 'transparent' : '#e8607a',
              border: current.cta ? '1px solid #1c2333' : 'none',
              color: current.cta ? '#6b7280' : '#fff',
              padding: '12px 20px',
              borderRadius: 12,
              fontSize: 13,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {isLast ? (tourComplete ? 'Done — go to dashboard' : 'Got it, I\'ll do this later') : 'Next →'}
          </button>
        </div>

        {/* Skip */}
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

  const displayName = me?.alias || me?.name?.split(' ')[0] || 'there'

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
        <TourModal onClose={closeTour} tourComplete={tourComplete} />
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
