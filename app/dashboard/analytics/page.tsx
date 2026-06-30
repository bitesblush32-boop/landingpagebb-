'use client'

import { useState, useEffect } from 'react'

interface AnalyticsData {
  views_today: number
  views_week: number
  views_month: number
  whatsapp_clicks: number
  bookings_pending: number
  daily: { date: string; views: number }[]
}

const S: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  eyebrow: { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 6 },
  title: { fontFamily: 'var(--font-serif)', fontSize: 28, color: '#eeeef0', lineHeight: 1.2, marginBottom: 6 },
  sub: { fontSize: 14, color: '#6b7280' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, padding: '20px 22px' },
  statNum: { fontFamily: 'var(--font-serif)', fontSize: 30, color: '#e8607a', lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.07em' },
  chartCard: { background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, padding: '24px', marginBottom: 24 },
  chartTitle: { fontSize: 14, fontWeight: 500, color: '#eeeef0', marginBottom: 20 },
  barRow: { display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 },
  barWrap: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 },
  barLabel: { fontSize: 9, color: '#4b5563', textAlign: 'center' as const, whiteSpace: 'nowrap' as const },
  shimmer: { background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)', backgroundSize: '200% 100%', borderRadius: 16, animation: 'shimmer 1.5s infinite' },
}

function BarChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(...data.map(d => d.views), 1)
  return (
    <div style={S.barRow}>
      {data.map(d => {
        const pct = Math.max((d.views / max) * 100, 2)
        const label = new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        return (
          <div key={d.date} style={S.barWrap} title={`${label}: ${d.views} views`}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 100, width: '100%', alignItems: 'center' }}>
              <div style={{
                width: '70%', height: `${pct}%`, background: `rgba(232,96,122,${0.3 + (d.views / max) * 0.7})`,
                borderRadius: '3px 3px 0 0', transition: 'height .5s ease', minHeight: 2,
              }} />
            </div>
            <div style={S.barLabel}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/companions/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 28 }}>
        <p style={S.eyebrow}>Insights</p>
        <h1 style={S.title}>Analytics</h1>
        <p style={S.sub}>Profile views and engagement over the last 30 days</p>
      </div>

      {loading ? (
        <>
          <div style={{ ...S.shimmer, height: 90, marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ ...S.shimmer, height: 90 }} />)}
          </div>
          <div style={{ ...S.shimmer, height: 200 }} />
        </>
      ) : (
        <>
          <div style={S.statsGrid}>
            {[
              { label: 'Views today', val: data?.views_today ?? 0 },
              { label: 'Views this week', val: data?.views_week ?? 0 },
              { label: 'Views this month', val: data?.views_month ?? 0 },
              { label: 'WhatsApp clicks', val: data?.whatsapp_clicks ?? 0 },
              { label: 'Pending bookings', val: data?.bookings_pending ?? 0 },
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={S.statNum}>{s.val}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {data?.daily && data.daily.length > 0 && (
            <div style={S.chartCard}>
              <div style={S.chartTitle}>Profile views — last 30 days</div>
              <BarChart data={data.daily} />
            </div>
          )}

          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>
            Analytics update hourly. Unique views are counted per dreamer per day.
          </p>
        </>
      )}
    </div>
  )
}
