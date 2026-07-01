'use client'

import { useState, useEffect } from 'react'

interface Booking {
  id: string
  user_alias: string | null
  session_title: string | null
  session_duration_mins: number | null
  session_price: number | null
  session_currency: string | null
  modality: string | null
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
  message: string | null
  requested_for: string | null
  created_at: string
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  pending: {
    color: '#fbbf24',
    background: 'rgba(251,191,36,.1)',
    border: '1px solid rgba(251,191,36,.25)',
  },
  accepted: {
    color: '#22c55e',
    background: 'rgba(34,197,94,.1)',
    border: '1px solid rgba(34,197,94,.25)',
  },
  declined: {
    color: '#f87171',
    background: 'rgba(248,113,113,.1)',
    border: '1px solid rgba(248,113,113,.25)',
  },
  completed: {
    color: '#c9a96e',
    background: 'rgba(201,169,110,.1)',
    border: '1px solid rgba(201,169,110,.25)',
  },
  cancelled: {
    color: '#6b7280',
    background: 'rgba(107,114,128,.1)',
    border: '1px solid rgba(107,114,128,.25)',
  },
}

const S = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: '#6b7280',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 28,
    color: '#eeeef0',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  sub: { fontSize: 14, color: '#6b7280' },
  card: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 14,
    padding: '20px 22px',
    marginBottom: 14,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  userAlias: { fontSize: 15, fontWeight: 500, color: '#eeeef0' },
  sessionName: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  badge: (status: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 10,
    padding: '3px 10px',
    borderRadius: 20,
    flexShrink: 0,
    ...STATUS_STYLES[status],
  }),
  meta: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 1.6,
    background: '#111620',
    border: '1px solid #1c2333',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 12,
  },
  actions: { display: 'flex', gap: 8 },
  acceptBtn: {
    padding: '8px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    border: '1px solid rgba(34,197,94,.3)',
    background: 'rgba(34,197,94,.08)',
    color: '#22c55e',
    fontSize: 13,
    minHeight: 36,
  },
  declineBtn: {
    padding: '8px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    border: '1px solid rgba(248,113,113,.25)',
    background: 'transparent',
    color: '#f87171',
    fontSize: 13,
    minHeight: 36,
  },
  empty: { textAlign: 'center' as const, padding: '60px 20px', color: '#4b5563', fontSize: 14 },
  shimmer: {
    background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 14,
    height: 130,
    marginBottom: 14,
    animation: 'shimmer 1.5s infinite',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 24,
    background: '#111620',
    padding: 4,
    borderRadius: 12,
    width: 'fit-content',
  },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 9,
    fontSize: 13,
    cursor: 'pointer',
    border: 'none',
    background: active ? '#0d1117' : 'transparent',
    color: active ? '#eeeef0' : '#6b7280',
    fontWeight: active ? 500 : 400,
  }),
}

type Filter = 'pending' | 'all'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/companions/bookings')
      .then((r) => (r.ok ? r.json() : []))
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [])

  async function respond(id: string, action: 'accepted' | 'declined') {
    setActing(id)
    setError('')
    try {
      const r = await fetch(`/api/companions/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Failed to update booking.')
        return
      }
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: action } : b)))
    } finally {
      setActing(null)
    }
  }

  const filtered = filter === 'pending' ? bookings.filter((b) => b.status === 'pending') : bookings

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 28 }}>
        <p style={S.eyebrow}>Requests</p>
        <h1 style={S.title}>Bookings</h1>
        <p style={S.sub}>
          {bookings.filter((b) => b.status === 'pending').length} pending requests
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(248,113,113,.08)',
            border: '1px solid rgba(248,113,113,.25)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: '#f87171',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div style={S.tabs}>
        <button style={S.tab(filter === 'pending')} onClick={() => setFilter('pending')}>
          Pending
        </button>
        <button style={S.tab(filter === 'all')} onClick={() => setFilter('all')}>
          All
        </button>
      </div>

      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} style={S.shimmer} />)
      ) : filtered.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◷</div>
          <p>{filter === 'pending' ? 'No pending booking requests.' : 'No bookings yet.'}</p>
        </div>
      ) : (
        filtered.map((b) => (
          <div key={b.id} style={S.card}>
            <div style={S.cardTop}>
              <div>
                <div style={S.userAlias}>{b.user_alias ?? 'Anonymous dreamer'}</div>
                {b.session_title && <div style={S.sessionName}>{b.session_title}</div>}
              </div>
              <span style={S.badge(b.status)}>{b.status}</span>
            </div>

            <div style={S.meta}>
              {b.session_duration_mins && <span>⏱ {b.session_duration_mins} min</span>}
              {b.session_price && (
                <span>
                  💰 {b.session_currency ?? '€'}
                  {b.session_price}
                </span>
              )}
              {b.modality && <span>📍 {b.modality.replace('_', ' ')}</span>}
              {b.requested_for && (
                <span>
                  📅{' '}
                  {new Date(b.requested_for).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>

            {b.message && <div style={S.message}>&ldquo;{b.message}&rdquo;</div>}

            <p
              style={{
                fontSize: 11,
                color: '#4b5563',
                marginBottom: b.status === 'pending' ? 10 : 0,
              }}
            >
              Received{' '}
              {new Date(b.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>

            {b.status === 'pending' && (
              <div style={S.actions}>
                <button
                  style={{ ...S.acceptBtn, opacity: acting === b.id ? 0.6 : 1 }}
                  onClick={() => respond(b.id, 'accepted')}
                  disabled={acting === b.id}
                >
                  {acting === b.id ? '…' : 'Accept'}
                </button>
                <button
                  style={{ ...S.declineBtn, opacity: acting === b.id ? 0.6 : 1 }}
                  onClick={() => respond(b.id, 'declined')}
                  disabled={acting === b.id}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
