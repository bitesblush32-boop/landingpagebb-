'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminNav from '../_components/AdminNav'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Boost {
  id: string
  companion_id: string
  companion_name: string
  boost_type: string
  community: string
  week_start: string
  week_end: string
  price_eur: string
  status: string
  is_enabled: boolean
  banner_image_url: string | null
  banner_headline: string | null
  banner_tagline: string | null
  payment_status: string
  created_at: string
}

interface BoostSettings {
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

const BOOST_LABELS: Record<string, string> = {
  featured_1:    'Featured #1',
  featured_2:    'Featured #2',
  featured_3:    'Featured #3',
  header_banner: 'Header Banner',
  right_rail:    'Right Rail',
  mid_grid:      'Mid Grid',
}

const COMMUNITY_LABELS: Record<string, string> = {
  female:  'Female',
  male:    'Male',
  shemale: 'TS & Shemale',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminAdsPage() {
  const [boosts, setBoosts]     = useState<Boost[]>([])
  const [settings, setSettings] = useState<BoostSettings | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filterCommunity, setFilterCommunity] = useState('')
  const [filterStatus, setFilterStatus]       = useState('active')
  const [saving, setSaving]     = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<Partial<BoostSettings>>({})

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBoosts = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (filterCommunity) params.set('community', filterCommunity)
    if (filterStatus)    params.set('status',    filterStatus)

    try {
      const res = await fetch(`/api/admin/boosts?${params}`)
      if (res.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      const data = await res.json()
      setBoosts(data.boosts ?? [])
    } catch {
      setError('Failed to load boosts')
    } finally {
      setLoading(false)
    }
  }, [filterCommunity, filterStatus])

  const fetchSettings = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/boost-settings')
      const data = await res.json()
      setSettings(data.settings)
      setSettingsDraft({})
    } catch {
      // non-fatal
    }
  }, [])

  useEffect(() => {
    void fetchBoosts()
    void fetchSettings()
  }, [fetchBoosts, fetchSettings])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function toggleEnabled(id: string, currentValue: boolean) {
    await fetch(`/api/admin/boosts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: !currentValue }),
    })
    setBoosts(prev =>
      prev.map(b => b.id === id ? { ...b, is_enabled: !currentValue } : b)
    )
  }

  async function cancelBoost(id: string) {
    if (!confirm('Cancel this boost?')) return
    await fetch(`/api/admin/boosts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    setBoosts(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b)
    )
  }

  async function restoreBoost(id: string) {
    await fetch(`/api/admin/boosts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    setBoosts(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'active' } : b)
    )
  }

  async function saveSettings() {
    if (!Object.keys(settingsDraft).length) return
    setSaving(true)
    try {
      await fetch('/api/admin/boost-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsDraft),
      })
      await fetchSettings()
    } finally {
      setSaving(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const displaySettings = settings
    ? { ...settings, ...settingsDraft }
    : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#eeeef0' }}>
      <AdminNav />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Ads &amp; Boosts</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
          Manage companion boost slots and global pricing settings.
        </p>

        {/* ── Settings Panel ──────────────────────────────────────────────── */}
        {displaySettings && (
          <div style={{
            background: '#0d1117',
            border: '1px solid #1c2333',
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#eeeef0' }}>
              Global Settings
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              {(
                [
                  ['header_banner_enabled', 'Header Banner'],
                  ['right_rail_enabled',    'Right Rail'],
                  ['mid_grid_enabled',      'Mid Grid'],
                  ['featured_enabled',      'Featured Slots'],
                ] as [keyof BoostSettings, string][]
              ).map(([key, label]) => (
                <label
                  key={key}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={!!displaySettings[key]}
                    onChange={e => setSettingsDraft(d => ({ ...d, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#e8607a' }}
                  />
                  <span style={{ fontSize: 14, color: '#9ca3af' }}>{label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
              {(
                [
                  ['price_featured_eur',      'Featured price (€/week)'],
                  ['price_header_banner_eur', 'Header Banner (€/week)'],
                  ['price_right_rail_eur',    'Right Rail (€/week)'],
                  ['price_mid_grid_eur',      'Mid Grid (€/week)'],
                ] as [keyof BoostSettings, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: 12, marginBottom: 6 }}>
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={displaySettings[key] as string}
                    onChange={e => setSettingsDraft(d => ({ ...d, [key]: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#111620',
                      border: '1px solid #1c2333',
                      borderRadius: 6,
                      color: '#eeeef0',
                      fontSize: 14,
                      padding: '8px 10px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={saveSettings}
              disabled={saving || !Object.keys(settingsDraft).length}
              style={{
                background: saving || !Object.keys(settingsDraft).length ? '#1c2333' : '#e8607a',
                color: saving || !Object.keys(settingsDraft).length ? '#4b5563' : '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || !Object.keys(settingsDraft).length ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            value={filterCommunity}
            onChange={e => setFilterCommunity(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Communities</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="shemale">TS &amp; Shemale</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        {loading ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading…</p>
        ) : error ? (
          <p style={{ color: '#e8607a', fontSize: 14 }}>{error}</p>
        ) : boosts.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No boosts found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1c2333' }}>
                  {['Companion', 'Type', 'Community', 'Week', 'Price', 'Payment', 'Enabled', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boosts.map(b => (
                  <tr
                    key={b.id}
                    style={{ borderBottom: '1px solid #111620' }}
                  >
                    <td style={tdStyle}>
                      <span style={{ color: '#eeeef0', fontWeight: 500 }}>@{b.companion_name}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#9ca3af' }}>
                        {BOOST_LABELS[b.boost_type] ?? b.boost_type}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#9ca3af' }}>
                        {COMMUNITY_LABELS[b.community] ?? b.community}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {formatDate(b.week_start)} – {formatDate(b.week_end)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#c9a96e' }}>€{b.price_eur}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: b.payment_status === 'paid' ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                        color: b.payment_status === 'paid' ? '#22c55e' : '#fbbf24',
                      }}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => toggleEnabled(b.id, b.is_enabled)}
                        style={{
                          background: b.is_enabled ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                          color: b.is_enabled ? '#22c55e' : '#6b7280',
                          border: 'none',
                          borderRadius: 4,
                          padding: '2px 10px',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        {b.is_enabled ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: b.status === 'active' ? 'rgba(232,96,122,0.1)' : 'rgba(107,114,128,0.1)',
                        color: b.status === 'active' ? '#e8607a' : '#6b7280',
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {b.status === 'active' ? (
                          <button onClick={() => cancelBoost(b.id)} style={actionBtnStyle('#6b7280')}>
                            Cancel
                          </button>
                        ) : (
                          <button onClick={() => restoreBoost(b.id)} style={actionBtnStyle('#e8607a')}>
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Style Helpers ─────────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid #1c2333',
  borderRadius: 8,
  color: '#eeeef0',
  fontSize: 13,
  padding: '7px 12px',
  cursor: 'pointer',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    borderRadius: 6,
    color,
    fontSize: 12,
    padding: '3px 10px',
    cursor: 'pointer',
  }
}
