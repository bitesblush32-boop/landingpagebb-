'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

interface CompanionMe {
  id: string
  name: string
  alias: string | null
  email: string
  is_live: boolean
  is_verified: boolean
  profile_completeness: number
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
}

function StatusContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === '1'

  const [me, setMe] = useState<CompanionMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [confettiFired, setConfettiFired] = useState(false)

  const fireConfetti = useCallback(async () => {
    if (confettiFired) return
    setConfettiFired(true)
    const { default: confetti } = await import('canvas-confetti')
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#e8607a', '#c9a96e', '#eeeef0', '#0d1117'],
    })
    setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.5, x: 0.2 } }), 400)
    setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.5, x: 0.8 } }), 600)
  }, [confettiFired])

  useEffect(() => {
    fetch('/api/companions/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          router.replace('/login')
          return
        }
        setMe(data)
        if (isNew && (data.status === 'pending' || data.status === 'approved')) {
          // Remove ?new=1 from URL without a reload
          window.history.replaceState({}, '', '/status')
          fireConfetti()
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router, isNew, fireConfetti])

  const S = {
    page: {
      minHeight: '100vh',
      background: '#07090f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    },
    wrap: { width: '100%', maxWidth: 480 },
    card: {
      background: '#0d1117',
      border: '1px solid #1c2333',
      borderRadius: 20,
      overflow: 'hidden',
    },
    inner: { padding: '32px' },
    icon: { fontSize: 36, marginBottom: 16 },
    label: {
      fontSize: 11,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      color: '#6b7280',
      marginBottom: 6,
    },
    title: {
      fontFamily: 'var(--font-serif)',
      fontSize: 26,
      color: '#eeeef0',
      lineHeight: 1.3,
      marginBottom: 10,
    },
    sub: { fontSize: 14, color: '#6b7280', lineHeight: 1.7 },
    row: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '14px 0',
      borderBottom: '1px solid #1c2333',
    },
    rowIcon: { fontSize: 16, flexShrink: 0, marginTop: 1 },
    rowText: { fontSize: 13, color: '#9ca3af', lineHeight: 1.6 },
    btnPrimary: {
      display: 'block',
      width: '100%',
      background: '#e8607a',
      color: '#fff',
      border: 'none',
      borderRadius: 12,
      padding: '14px',
      fontSize: 15,
      fontWeight: 500,
      cursor: 'pointer',
      textAlign: 'center' as const,
      textDecoration: 'none',
      minHeight: 48,
      marginTop: 24,
    },
    btnGhost: {
      display: 'block',
      width: '100%',
      background: 'transparent',
      border: '1px solid #1c2333',
      color: '#9ca3af',
      borderRadius: 12,
      padding: '14px',
      fontSize: 14,
      cursor: 'pointer',
      textAlign: 'center' as const,
      textDecoration: 'none',
      minHeight: 44,
      marginTop: 12,
    },
    progress: {
      background: '#1c2333',
      borderRadius: 99,
      height: 6,
      overflow: 'hidden',
      marginTop: 16,
    },
    progressFill: (pct: number): React.CSSProperties => ({
      height: '100%',
      width: `${pct}%`,
      background: '#e8607a',
      borderRadius: 99,
      transition: 'width 1s ease',
    }),
    shimmer: {
      height: 120,
      background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)',
      backgroundSize: '200% 100%',
      borderRadius: 16,
      animation: 'shimmer 1.5s infinite',
    },
  }

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <img src="/logo.png" alt="BlushBite" style={{ height: 36, marginBottom: 32, display: 'block' }} />
          <div style={S.shimmer} />
        </div>
      </div>
    )
  }

  if (!me) return null

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <img src="/logo.png" alt="BlushBite" style={{ height: 36, marginBottom: 32, display: 'block' }} />
        <div style={S.card}>
          {me.status === 'pending' && (
            <>
              <div
                style={{
                  height: 3,
                  background: 'linear-gradient(90deg,transparent,#f59e0b,transparent)',
                }}
              />
              <div style={S.inner}>
                <div style={S.icon}>⏳</div>
                <p style={S.label}>Application received</p>
                <h1 style={{ ...S.title, color: '#f59e0b' }}>
                  Under <em>review</em>
                </h1>
                <p style={S.sub}>
                  We review every companion personally. Expect a message within 24–48 hours.
                </p>
                <div style={{ marginTop: 24 }}>
                  {[
                    [
                      '✦',
                      'Watch your inbox — your approval arrives by email with a link to your dashboard.',
                    ],
                    [
                      '🔒',
                      'Your real name and details stay completely private. Dreamers only ever see your alias.',
                    ],
                    [
                      '◾',
                      'Once approved, you build your full profile — photos, stories, sessions — at your own pace.',
                    ],
                  ].map(([icon, text], i) => (
                    <div
                      key={i}
                      style={{ ...S.row, borderBottom: i < 2 ? '1px solid #1c2333' : 'none' }}
                    >
                      <span style={S.rowIcon}>{icon}</span>
                      <span style={S.rowText}>{text}</span>
                    </div>
                  ))}
                </div>
                <a href="/login" style={S.btnGhost}>
                  Already approved? Sign in
                </a>
              </div>
            </>
          )}

          {me.status === 'approved' && (
            <>
              <div
                style={{
                  height: 3,
                  background: 'linear-gradient(90deg,transparent,#22c55e,transparent)',
                }}
              />
              <div style={S.inner}>
                <div style={S.icon}>✦</div>
                <p style={S.label}>Application approved</p>
                <h1 style={{ ...S.title, color: '#22c55e' }}>
                  You&rsquo;re <em>in.</em>
                </h1>
                <p style={S.sub}>Your profile is live. Complete it to attract more dreamers.</p>
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#6b7280',
                      marginBottom: 6,
                    }}
                  >
                    <span>Profile completeness</span>
                    <span>{me.profile_completeness}%</span>
                  </div>
                  <div style={S.progress}>
                    <div style={S.progressFill(me.profile_completeness)} />
                  </div>
                </div>
                <a href="/dashboard" style={S.btnPrimary}>
                  Go to your dashboard →
                </a>
              </div>
            </>
          )}

          {me.status === 'rejected' && (
            <>
              <div
                style={{
                  height: 3,
                  background: 'linear-gradient(90deg,transparent,#f87171,transparent)',
                }}
              />
              <div style={S.inner}>
                <div style={S.icon}>✦</div>
                <p style={S.label}>Application update</p>
                <h1 style={{ ...S.title, color: '#f87171' }}>
                  Not approved <em>this time</em>
                </h1>
                <p style={S.sub}>
                  We reviewed your application carefully and aren&rsquo;t able to move forward right
                  now.
                </p>
                {me.rejection_reason && (
                  <div
                    style={{
                      marginTop: 16,
                      background: '#111620',
                      border: '1px solid #1c2333',
                      borderRadius: 12,
                      padding: '14px 16px',
                      fontSize: 13,
                      color: '#9ca3af',
                      lineHeight: 1.7,
                    }}
                  >
                    {me.rejection_reason}
                  </div>
                )}
                <a href="/reapply" style={S.btnPrimary}>
                  Edit your application →
                </a>
                <p style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 12 }}>
                  Questions? Reply to the email we sent you.
                </p>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 24 }}>
          <Link href="/" style={{ fontSize: 12, color: '#4b5563', textDecoration: 'none' }}>
            Back to BlushBite
          </Link>
          <span style={{ color: '#1c2333' }}>·</span>
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
      </div>
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense>
      <StatusContent />
    </Suspense>
  )
}
