'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'

interface CompanionMe {
  id: string
  name: string
  alias: string | null
  is_live: boolean
  profile_completeness: number
  status: string // 'approved' | 'rejected' | 'taken_down'
}

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '◈' },
  { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
  { href: '/dashboard/photos', label: 'Photos', icon: '◻' },
  { href: '/dashboard/videos', label: 'Videos', icon: '▷' },
  { href: '/dashboard/stories', label: 'Stories', icon: '✦' },
  { href: '/dashboard/bookings', label: 'Bookings', icon: '◷' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '◈' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⊙' },
  { href: '/dashboard/upgrade', label: 'Your Plan', icon: '✦' },
]

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Home', icon: '◈' },
  { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
  { href: '/dashboard/photos', label: 'Photos', icon: '◻' },
  { href: '/dashboard/analytics', label: 'Stats', icon: '▥' },
  { href: '/dashboard/settings', label: 'More', icon: '⊙' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [me, setMe] = useState<CompanionMe | null>(null)
  const [toggling, setToggling] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetch('/api/companions/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          router.replace('/login')
          return
        }
        setMe(data)
        setAuthChecked(true)
      })
      .catch(() => router.replace('/login'))
  }, [router])

  async function toggleLive() {
    if (!me) return
    setToggling(true)
    try {
      const r = await fetch('/api/companions/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_live: !me.is_live }),
      })
      if (r.ok) setMe((prev) => (prev ? { ...prev, is_live: !prev.is_live } : prev))
    } finally {
      setToggling(false)
    }
  }

  const displayName = me?.alias || me?.name || '…'

  if (!authChecked) {
    return <div style={{ minHeight: '100vh', background: '#07090f' }} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f' }}>
      {/* Sidebar — desktop only */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: '#0d1117',
          borderRight: '1px solid #1c2333',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
        }}
        className="bb-sidebar"
      >
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #1c2333' }}>
          <Image src="/logo.png" alt="BlushBite" width={200} height={70} style={{ height: 70, width: 'auto', marginBottom: 16, display: 'block' }} />
          {me && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0', marginBottom: 2 }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>Companion portal</div>

              {me.status === 'rejected' ? (
                <div
                  style={{
                    background: 'rgba(248,113,113,.08)',
                    border: '1px solid rgba(248,113,113,.3)',
                    borderRadius: 10,
                    padding: '9px 12px',
                    fontSize: 12,
                  }}
                >
                  <div style={{ color: '#f87171', fontWeight: 500, marginBottom: 2 }}>
                    <span style={{ marginRight: 6 }}>●</span>
                    Application rejected
                  </div>
                  <div style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.4 }}>
                    See your profile for details.
                  </div>
                </div>
              ) : me.status === 'taken_down' ? (
                <div
                  style={{
                    background: 'rgba(251,191,36,.06)',
                    border: '1px solid rgba(251,191,36,.25)',
                    borderRadius: 10,
                    padding: '9px 12px',
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ color: '#fbbf24', fontWeight: 500, marginBottom: 4 }}>
                    <span style={{ marginRight: 6 }}>⊘</span>
                    Profile paused
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.5, marginBottom: 6 }}>
                    Your profile has been temporarily paused by our team.
                  </div>
                  <a
                    href="mailto:support@blushbite.live"
                    style={{ fontSize: 10, color: '#fbbf24', textDecoration: 'none' }}
                  >
                    Contact support →
                  </a>
                </div>
              ) : (
                <>
                  {/* Completeness bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: '#4b5563',
                      marginBottom: 4,
                    }}
                  >
                    <span>Profile</span>
                    <span>{me.profile_completeness}%</span>
                  </div>
                  <div
                    style={{
                      background: '#1c2333',
                      borderRadius: 99,
                      height: 3,
                      overflow: 'hidden',
                      marginBottom: 16,
                    }}
                  >
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

                  {/* Live toggle */}
                  <button
                    onClick={toggleLive}
                    disabled={toggling}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: me.is_live ? 'rgba(34,197,94,.08)' : 'rgba(255,255,255,.04)',
                      border: `1px solid ${me.is_live ? 'rgba(34,197,94,.3)' : '#1c2333'}`,
                      borderRadius: 10,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: me.is_live ? '#22c55e' : '#6b7280',
                    }}
                  >
                    <span>{me.is_live ? '● Live' : '○ Hidden'}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{toggling ? '…' : 'toggle'}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px',
                  fontSize: 13,
                  textDecoration: 'none',
                  transition: 'all .15s',
                  color: active ? '#e8607a' : '#6b7280',
                  background: active ? 'rgba(232,96,122,.08)' : 'transparent',
                  borderRight: active ? '2px solid #e8607a' : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: 12 }}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1c2333' }}>
          <button
            onClick={async () => {
              await fetch('/api/companions/logout', { method: 'POST' })
              router.push('/login')
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              color: '#4b5563',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 0, paddingBottom: 80 }} className="bb-main">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: '#0d1117',
          borderTop: '1px solid #1c2333',
          display: 'flex',
        }}
        className="bb-bottom-nav"
      >
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 4px',
                textDecoration: 'none',
                gap: 3,
                minHeight: 56,
                color: active ? '#e8607a' : '#6b7280',
                fontSize: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .bb-sidebar { display: flex !important; }
          .bb-main { margin-left: 240px; }
          .bb-bottom-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          .bb-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
