'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BOOST_LABELS, type BoostType } from '@/lib/boosts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Boost {
  id: string
  companion_name: string
  companion_email: string
  boost_type: string
  community: string
  week_start: string
  week_end: string
  price_eur: string
  status: string
  is_enabled: boolean
  payment_status: string
  banner_image_url: string | null
  created_at: string
}

interface Summary { active: number; disabled: number; cancelled: number }

interface Settings {
  header_banner_enabled: boolean
  right_rail_enabled: boolean
  mid_grid_enabled: boolean
  featured_enabled: boolean
  price_featured_eur: string
  price_header_banner_eur: string
  price_right_rail_eur: string
  price_mid_grid_eur: string
  max_weeks_advance: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COMMUNITY_LABELS: Record<string, string> = {
  female: 'Female', male: 'Male', shemale: 'TS & Shemale',
}

const COMMUNITY_COLORS: Record<string, string> = {
  female: '#e8607a', male: '#60a5fa', shemale: '#c084fc',
}

function StatusBadge({ status, isEnabled }: { status: string; isEnabled: boolean }) {
  if (status === 'cancelled') return <Badge color="#6b7280" bg="rgba(107,114,128,.08)">Cancelled</Badge>
  if (!isEnabled) return <Badge color="#fbbf24" bg="rgba(251,191,36,.08)">Paused</Badge>
  if (status === 'active') return <Badge color="#22c55e" bg="rgba(34,197,94,.08)">Active</Badge>
  return <Badge color="#6b7280" bg="rgba(107,114,128,.08)">{status}</Badge>
}

function Badge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color, background: bg,
      border: `1px solid ${color}33`, borderRadius: 6,
      padding: '3px 8px', whiteSpace: 'nowrap' as const,
      textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    }}>
      {children}
    </span>
  )
}

function Toggle({
  value, onChange, disabled = false,
}: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: value ? '#e8607a' : '#1c2333',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
        transform: 'translateZ(0)',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', display: 'block',
      }} />
    </button>
  )
}

// ── Price editor ──────────────────────────────────────────────────────────────

function PriceField({
  label, field, value, onSave,
}: { label: string; field: string; value: string; onSave: (field: string, val: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1c2333' }}>
      <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {editing ? (
          <>
            <span style={{ fontSize: 13, color: '#6b7280' }}>€</span>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              style={{
                width: 70, background: '#111620', border: '1px solid #e8607a',
                borderRadius: 6, padding: '4px 8px', color: '#eeeef0', fontSize: 13, outline: 'none',
              }}
            />
            <button onClick={() => { onSave(field, draft); setEditing(false) }}
              style={{ fontSize: 12, color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer' }}>
              Save
            </button>
            <button onClick={() => { setDraft(value); setEditing(false) }}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#c9a96e' }}>€{value}/wk</span>
            <button onClick={() => setEditing(true)}
              style={{ fontSize: 11, color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAdsPage() {
  const router = useRouter()
  const [boosts, setBoosts] = useState<Boost[]>([])
  const [summary, setSummary] = useState<Summary>({ active: 0, disabled: 0, cancelled: 0 })
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setAuthed] = useState(false)
  const [filterCommunity, setFilterCommunity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterCommunity) params.set('community', filterCommunity)
    if (filterStatus)    params.set('status',    filterStatus)

    const [boostsRes, settingsRes] = await Promise.all([
      fetch(`/api/admin/boosts?${params}`),
      fetch('/api/admin/boost-settings'),
    ])

    if (boostsRes.status === 401 || settingsRes.status === 401) {
      router.push('/admin/login')
      return
    }

    const bd = boostsRes.ok ? await boostsRes.json() : { boosts: [], summary: {} }
    const sd = settingsRes.ok ? await settingsRes.json() : { settings: null }

    setBoosts(bd.boosts ?? [])
    setSummary(bd.summary ?? { active: 0, disabled: 0, cancelled: 0 })
    setSettings(sd.settings)
    setAuthed(true)
    setLoading(false)
  }, [filterCommunity, filterStatus, router])

  useEffect(() => { loadAll() }, [loadAll])

  async function toggleBoost(id: string, currentEnabled: boolean) {
    setActionLoading(id)
    try {
      const r = await fetch(`/api/admin/boosts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !currentEnabled }),
      })
      if (r.ok) {
        setBoosts(prev => prev.map(b => b.id === id ? { ...b, is_enabled: !currentEnabled } : b))
        setSummary(prev => ({
          ...prev,
          active:   currentEnabled ? prev.active - 1 : prev.active + 1,
          disabled: currentEnabled ? prev.disabled + 1 : prev.disabled - 1,
        }))
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function cancelBoost(id: string) {
    if (!confirm('Cancel this boost? The companion will lose their placement.')) return
    setActionLoading(id)
    try {
      const r = await fetch(`/api/admin/boosts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (r.ok) {
        setBoosts(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function updateSetting(field: string, value: unknown) {
    const r = await fetch('/api/admin/boost-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (r.ok) {
      const d = await r.json()
      setSettings(d.settings)
    }
  }

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07090f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #1c2333', borderTopColor: '#e8607a', animation: 'bb-spin 0.8s linear infinite' }} />
        <style>{`@keyframes bb-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#eeeef0' }}>
      <style>{`
        @keyframes bb-spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .ads-table-row { grid-template-columns: 1fr !important; }
          .ads-actions { flex-wrap: wrap; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(7,9,15,.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1c2333',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/logo.png" alt="BlushBite" width={120} height={42} style={{ height: 42, width: 'auto' }} />
          <span style={{ fontSize: 12, color: '#4b5563' }}>Admin · Ads & Boosts</span>
        </div>
        <button
          onClick={logout}
          style={{ fontSize: 12, color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px 80px' }}>

        {/* KPI bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Active boosts', value: summary.active, color: '#22c55e' },
            { label: 'Paused by admin', value: summary.disabled, color: '#fbbf24' },
            { label: 'Cancelled', value: summary.cancelled, color: '#6b7280' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* LEFT — boosts table */}
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <select
                value={filterCommunity}
                onChange={e => setFilterCommunity(e.target.value)}
                style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 8, padding: '8px 12px', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}
              >
                <option value="">All communities</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="shemale">TS & Shemale</option>
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 8, padding: '8px 12px', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={loadAll}
                style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 8, padding: '8px 14px', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}
              >
                Refresh
              </button>
            </div>

            {/* Boosts list */}
            <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 14, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 110px 90px 100px',
                padding: '10px 16px', borderBottom: '1px solid #1c2333',
                fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                <span>Companion / Type</span>
                <span>Community</span>
                <span>Week</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {boosts.length === 0 && (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
                  No boosts found for the current filters.
                </div>
              )}

              {boosts.map((b, i) => (
                <div
                  key={b.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 110px 90px 100px',
                    padding: '14px 16px',
                    borderBottom: i < boosts.length - 1 ? '1px solid #111620' : 'none',
                    alignItems: 'center',
                    opacity: b.status === 'cancelled' ? 0.5 : 1,
                    transition: 'opacity .2s',
                  }}
                >
                  {/* Companion + type */}
                  <div>
                    <div style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>{b.companion_name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{b.companion_email}</div>
                    <div style={{ fontSize: 11, color: '#e8607a', marginTop: 3 }}>
                      {BOOST_LABELS[b.boost_type as BoostType] ?? b.boost_type}
                    </div>
                  </div>

                  {/* Community */}
                  <span style={{
                    fontSize: 11, color: COMMUNITY_COLORS[b.community] ?? '#6b7280',
                    background: `${COMMUNITY_COLORS[b.community]}15`,
                    border: `1px solid ${COMMUNITY_COLORS[b.community]}30`,
                    borderRadius: 6, padding: '3px 8px', width: 'fit-content',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {COMMUNITY_LABELS[b.community] ?? b.community}
                  </span>

                  {/* Week */}
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{b.week_start}</div>
                    <div style={{ fontSize: 10, color: '#4b5563' }}>to {b.week_end}</div>
                  </div>

                  {/* Status */}
                  <StatusBadge status={b.status} isEnabled={b.is_enabled} />

                  {/* Actions */}
                  <div className="ads-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {b.status === 'active' && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Toggle
                            value={b.is_enabled}
                            onChange={() => toggleBoost(b.id, b.is_enabled)}
                            disabled={actionLoading === b.id}
                          />
                          <span style={{ fontSize: 10, color: '#6b7280' }}>{b.is_enabled ? 'Live' : 'Paused'}</span>
                        </div>
                        <button
                          onClick={() => cancelBoost(b.id)}
                          disabled={actionLoading === b.id}
                          style={{ fontSize: 10, color: '#f87171', background: 'none', border: '1px solid rgba(248,113,113,.2)', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {b.status === 'cancelled' && (
                      <span style={{ fontSize: 10, color: '#4b5563' }}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — settings panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Global slot toggles */}
            <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Slot availability
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 16, lineHeight: 1.6 }}>
                Disable a slot type globally — companions cannot see or book it, and active placements are hidden from community pages.
              </p>

              {settings && [
                { label: 'Header banner', field: 'header_banner_enabled', value: settings.header_banner_enabled },
                { label: 'Right rail', field: 'right_rail_enabled', value: settings.right_rail_enabled },
                { label: 'Featured row', field: 'featured_enabled', value: settings.featured_enabled },
                { label: 'Mid-grid native', field: 'mid_grid_enabled', value: settings.mid_grid_enabled },
              ].map(({ label, field, value }) => (
                <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #111620' }}>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: value ? '#22c55e' : '#4b5563' }}>
                      {value ? 'On' : 'Off'}
                    </span>
                    <Toggle value={value} onChange={v => updateSetting(field, v)} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Weekly pricing
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 16, lineHeight: 1.6 }}>
                Prices apply to new bookings only — existing boosts keep their locked-in price.
              </p>
              {settings && (
                <>
                  <PriceField label="Featured (all 3 slots)" field="price_featured_eur" value={settings.price_featured_eur} onSave={(f, v) => updateSetting(f, parseFloat(v))} />
                  <PriceField label="Header banner" field="price_header_banner_eur" value={settings.price_header_banner_eur} onSave={(f, v) => updateSetting(f, parseFloat(v))} />
                  <PriceField label="Right rail" field="price_right_rail_eur" value={settings.price_right_rail_eur} onSave={(f, v) => updateSetting(f, parseFloat(v))} />
                  <PriceField label="Mid-grid" field="price_mid_grid_eur" value={settings.price_mid_grid_eur} onSave={(f, v) => updateSetting(f, parseFloat(v))} />
                </>
              )}
            </div>

            {/* Pre-booking window */}
            {settings && (
              <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Pre-booking window
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>Weeks in advance</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {[2, 3, 4, 6, 8].map(n => (
                      <button
                        key={n}
                        onClick={() => updateSetting('max_weeks_advance', n)}
                        style={{
                          width: 32, height: 32, borderRadius: 6, border: 'none',
                          background: settings.max_weeks_advance === n ? '#e8607a' : '#111620',
                          color: settings.max_weeks_advance === n ? '#fff' : '#6b7280',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: 'background .15s',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
