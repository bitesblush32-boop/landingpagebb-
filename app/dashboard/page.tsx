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
  photo_count?: number
  story_count?: number
  hourly_rate?: number
}

interface CompanionMe {
  id: string
  name: string
  alias: string | null
  is_live: boolean
  profile_completeness: number
  status: string
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

function WelcomeBanner({
  me,
  stats,
  onDismiss,
}: {
  me: CompanionMe
  stats: Stats | null
  onDismiss: () => void
}) {
  const tasks = [
    {
      label: 'Complete your profile',
      done: me.profile_completeness >= 50,
      href: '/dashboard/profile',
    },
    {
      label: 'Upload at least 3 photos',
      done: (stats?.photo_count ?? 0) >= 3,
      href: '/dashboard/photos',
    },
    {
      label: 'Write your first story',
      done: (stats?.story_count ?? 0) >= 1,
      href: '/dashboard/stories',
    },
    {
      label: 'Set your session rate',
      done: !!stats?.hourly_rate,
      href: '/dashboard/profile',
    },
    {
      label: 'Toggle live — become visible',
      done: me.is_live,
      href: undefined,
    },
  ]
  const doneCount = tasks.filter((t) => t.done).length

  return (
    <div
      style={{
        background: 'rgba(232,96,122,.06)',
        border: '1px solid rgba(232,96,122,.2)',
        borderRadius: 16,
        padding: '24px',
        marginBottom: 32,
        position: 'relative',
      }}
    >
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'none',
          border: 'none',
          color: '#4b5563',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: 4,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
      <p
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#6b7280',
          marginBottom: 6,
        }}
      >
        Getting started
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          color: '#eeeef0',
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        Your stage is{' '}
        <em style={{ fontStyle: 'italic', color: '#e8607a' }}>waiting.</em>
      </h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        {doneCount} of {tasks.length} complete
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map((task) => (
          <div
            key={task.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: task.done ? 0.4 : 1,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `1px solid ${task.done ? '#22c55e' : 'rgba(232,96,122,.4)'}`,
                background: task.done ? 'rgba(34,197,94,.15)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: task.done ? '#22c55e' : 'transparent',
                flexShrink: 0,
              }}
            >
              ✓
            </span>
            {task.href && !task.done ? (
              <a
                href={task.href}
                style={{ fontSize: 13, color: '#e8607a', textDecoration: 'none' }}
              >
                {task.label} →
              </a>
            ) : (
              <span
                style={{
                  fontSize: 13,
                  color: task.done ? '#6b7280' : '#9ca3af',
                  textDecoration: task.done ? 'line-through' : 'none',
                }}
              >
                {task.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === '1'

  const [me, setMe] = useState<CompanionMe | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

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
        // Show banner if ?welcome=1 OR onboarding not yet dismissed
        const dismissed = (() => {
          try {
            return !!localStorage.getItem('bb_onboarding_done')
          } catch {
            return false
          }
        })()
        if (isWelcome || !dismissed) {
          setShowBanner(true)
          if (isWelcome) window.history.replaceState({}, '', '/dashboard')
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router, isWelcome])

  function dismissBanner() {
    try {
      localStorage.setItem('bb_onboarding_done', '1')
    } catch {
      // ignore
    }
    setShowBanner(false)
  }

  const displayName = me?.alias || me?.name?.split(' ')[0] || 'there'

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
    <div style={S.page}>
      {/* Welcome banner */}
      {showBanner && me && (
        <WelcomeBanner me={me} stats={stats} onDismiss={dismissBanner} />
      )}

      {/* Greeting */}
      <div style={S.greeting}>
        <p style={S.eyebrow}>Companion dashboard</p>
        <h1 style={S.title}>
          Welcome back, <em style={{ fontStyle: 'italic', color: '#e8607a' }}>{displayName}.</em>
        </h1>
        <p style={S.sub}>
          {me?.is_live
            ? 'Your profile is live — dreamers can discover you.'
            : "Your profile is hidden. Toggle it live from the sidebar when you're ready."}
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
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
