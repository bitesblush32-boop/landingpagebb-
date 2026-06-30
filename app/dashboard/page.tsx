'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
}

const S: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  greeting: { marginBottom: 32 },
  eyebrow: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 6 } as React.CSSProperties,
  title: { fontFamily: 'var(--font-serif)', fontSize: 28, color: '#eeeef0', lineHeight: 1.2, marginBottom: 6 },
  sub: { fontSize: 14, color: '#6b7280' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, padding: '20px 22px' },
  statNum: { fontFamily: 'var(--font-serif)', fontSize: 30, color: '#e8607a', lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' } as React.CSSProperties,
  completenessCard: { background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, padding: '24px', marginBottom: 24 },
  progressBg: { background: '#1c2333', borderRadius: 99, height: 8, overflow: 'hidden', marginTop: 8 },
  quickLinks: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  quickLink: { background: '#111620', border: '1px solid #1c2333', borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none', transition: 'border-color .15s' } as React.CSSProperties,
  shimmer: { background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)', backgroundSize: '200% 100%', borderRadius: 16, animation: 'shimmer 1.5s infinite' },
}

const QUICK_LINKS = [
  { href: '/dashboard/profile', label: 'Edit profile', icon: '◉', desc: 'Update your bio & details' },
  { href: '/dashboard/photos', label: 'Manage photos', icon: '◻', desc: 'Upload & set your primary photo' },
  { href: '/dashboard/videos', label: 'Add videos', icon: '▷', desc: 'Share short video clips' },
  { href: '/dashboard/stories', label: 'Write a story', icon: '✦', desc: 'Publish companion stories' },
  { href: '/dashboard/bookings', label: 'Bookings', icon: '◷', desc: 'View & respond to requests' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '▥', desc: 'See your profile stats' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [me, setMe] = useState<CompanionMe | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/companions/me').then(r => r.ok ? r.json() : null),
      fetch('/api/companions/analytics').then(r => r.ok ? r.json() : null),
    ]).then(([meData, statsData]) => {
      if (!meData) { router.replace('/login'); return }
      setMe(meData)
      setStats(statsData)
    }).catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const displayName = me?.alias || me?.name?.split(' ')[0] || 'there'

  if (loading) return (
    <div style={S.page}>
      <div style={{ ...S.shimmer, height: 80, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ ...S.shimmer, height: 90 }} />)}
      </div>
      <div style={{ ...S.shimmer, height: 120 }} />
    </div>
  )

  return (
    <div style={S.page}>
      {/* Greeting */}
      <div style={S.greeting}>
        <p style={S.eyebrow}>Companion dashboard</p>
        <h1 style={S.title}>Welcome back, <em style={{ fontStyle: 'italic', color: '#e8607a' }}>{displayName}.</em></h1>
        <p style={S.sub}>
          {me?.is_live
            ? 'Your profile is live — dreamers can discover you.'
            : 'Your profile is hidden. Toggle it live from the sidebar when you\'re ready.'}
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
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={S.statNum}>{s.val}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Profile completeness */}
      {me && (
        <div style={S.completenessCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#eeeef0' }}>Profile completeness</span>
            <span style={{ fontSize: 14, color: '#e8607a', fontWeight: 500 }}>{me.profile_completeness}%</span>
          </div>
          <div style={S.progressBg}>
            <div style={{ width: `${me.profile_completeness}%`, height: '100%', background: '#e8607a', borderRadius: 99, transition: 'width 1s ease' }} />
          </div>
          {me.profile_completeness < 70 && (
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
              Complete your profile to 70% before going live.{' '}
              <a href="/dashboard/profile" style={{ color: '#e8607a', textDecoration: 'none' }}>Continue →</a>
            </p>
          )}
        </div>
      )}

      {/* Quick links */}
      <p style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 } as React.CSSProperties}>
        Quick actions
      </p>
      <div style={S.quickLinks}>
        {QUICK_LINKS.map(l => (
          <a
            key={l.href}
            href={l.href}
            style={S.quickLink}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,96,122,.35)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1c2333')}
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
