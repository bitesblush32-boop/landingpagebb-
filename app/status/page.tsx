'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface CompanionMe {
  id: string
  name: string
  email: string
  is_live: boolean
  is_verified: boolean
  profile_completeness: number
  status: 'approved' | 'rejected' | 'taken_down'
  rejection_reason: string | null
}

function StatusContent() {
  const router = useRouter()

  const [me, setMe] = useState<CompanionMe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/companions/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          router.replace('/login')
          return
        }
        if (data.status === 'approved') {
          router.replace('/dashboard')
          return
        }
        setMe(data)
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

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
          <Image src="/logo.png" alt="BlushBite" width={200} height={70} style={{ height: 70, width: 'auto', marginBottom: 32, display: 'block' }} />
          <div style={S.shimmer} />
        </div>
      </div>
    )
  }

  if (!me) return null

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <Image src="/logo.png" alt="BlushBite" width={200} height={70} style={{ height: 70, width: 'auto', marginBottom: 32, display: 'block' }} />
        <div style={S.card}>
          {me.status === 'taken_down' && (
            <>
              <div
                style={{
                  height: 3,
                  background: 'linear-gradient(90deg,transparent,#f87171,transparent)',
                }}
              />
              <div style={S.inner}>
                <div style={S.icon}>⏸</div>
                <p style={S.label}>Profile status</p>
                <h1 style={{ ...S.title, color: '#f87171' }}>
                  Profile <em>paused</em>
                </h1>
                <p style={S.sub}>
                  Your profile has been temporarily paused by our team. You can still log in and
                  update your content, but dreamers cannot see your profile right now.
                </p>
                <div style={{ marginTop: 24 }}>
                  {[
                    [
                      '✦',
                      'If you believe this was a mistake, reach out and we will review it promptly.',
                    ],
                    [
                      '◾',
                      'Your content, photos, and stories are safe. Nothing has been deleted.',
                    ],
                  ].map(([icon, text], i) => (
                    <div
                      key={i}
                      style={{ ...S.row, borderBottom: i < 1 ? '1px solid #1c2333' : 'none' }}
                    >
                      <span style={S.rowIcon}>{icon}</span>
                      <span style={S.rowText}>{text}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="mailto:support@blushbite.live"
                  style={S.btnPrimary}
                >
                  Contact support
                </a>
                <Link href="/dashboard" style={S.btnGhost}>
                  Go to your dashboard
                </Link>
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
                <Link href="/dashboard" style={S.btnPrimary}>
                  Go to your dashboard →
                </Link>
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
                <Link href="/reapply" style={S.btnPrimary}>
                  Edit your application →
                </Link>
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
