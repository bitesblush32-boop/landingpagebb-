'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BOOST_TYPES,
  BOOST_LABELS,
  BOOST_DESCRIPTIONS,
  DEFAULT_PRICES,
  type BoostType,
  type WeekSlot,
} from '@/lib/boosts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MyBoost {
  id: string
  boost_type: string
  community: string
  week_start: string
  week_end: string
  price_eur: string
  status: string
  is_enabled: boolean
  payment_status: string
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
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMMUNITY_LABELS: Record<string, string> = {
  female:  'Female',
  male:    'Male',
  shemale: 'TS & Shemale',
}

const TYPE_ICONS: Record<string, string> = {
  featured_1:    '★',
  featured_2:    '★',
  featured_3:    '★',
  header_banner: '▬',
  right_rail:    '▐',
  mid_grid:      '◈',
}

// ── Slot Picker ───────────────────────────────────────────────────────────────

// Image specs for each banner type
const BANNER_SPECS: Partial<Record<BoostType, { label: string; w: number; h: number }>> = {
  header_banner: { label: 'Header Banner', w: 1200, h: 200 },
  right_rail:    { label: 'Right Rail',    w: 280,  h: 400 },
}

function SlotPicker({
  boostType,
  community,
  onBooked,
  price,
}: {
  boostType: BoostType
  community: string
  onBooked: () => void
  price: number
}) {
  const [slots, setSlots] = useState<WeekSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [headline, setHeadline] = useState('')
  const [tagline, setTagline] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const spec = BANNER_SPECS[boostType] ?? null

  const loadSlots = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/companions/boosts/slots?type=${boostType}&community=${community}`)
      const d = await r.json()
      setSlots(d.slots ?? [])
    } finally {
      setLoading(false)
    }
  }, [boostType, community])

  useEffect(() => { loadSlots() }, [loadSlots])

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/companions/boosts/upload-banner', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setUploadError(d.error ?? 'Upload failed'); return }
      setBannerImageUrl(d.url)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function book() {
    if (!selected) return
    setError('')
    setBooking(true)
    try {
      const r = await fetch('/api/companions/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boost_type: boostType,
          community,
          week_start: selected,
          banner_headline: headline.trim() || undefined,
          banner_tagline: tagline.trim() || undefined,
          banner_image_url: bannerImageUrl || undefined,
        }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Something went wrong.'); return }
      setSuccess(`Booked! Your ${BOOST_LABELS[boostType]} is live for the selected week.`)
      setSelected(null)
      setHeadline('')
      setTagline('')
      setBannerImageUrl(null)
      await loadSlots()
      onBooked()
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 64, borderRadius: 10,
            background: '#111620', animation: 'bb-pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Week slots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
        {slots.map(slot => {
          const taken   = !!slot.takenBy && !slot.isYours
          const isYours = slot.isYours
          const isSel   = selected === slot.weekStart

          let bg = '#111620'
          let border = '#1c2333'
          let textColor = '#6b7280'
          let cursor = 'pointer'

          if (isYours) {
            bg = 'rgba(201,169,110,.1)'
            border = 'rgba(201,169,110,.35)'
            textColor = '#c9a96e'
            cursor = 'default'
          } else if (taken) {
            bg = 'rgba(248,113,113,.06)'
            border = 'rgba(248,113,113,.2)'
            textColor = '#4b5563'
            cursor = 'not-allowed'
          } else if (isSel) {
            bg = 'rgba(232,96,122,.12)'
            border = '#e8607a'
            textColor = '#eeeef0'
          }

          return (
            <button
              key={slot.weekStart}
              onClick={() => { if (!taken && !isYours) setSelected(slot.weekStart === selected ? null : slot.weekStart) }}
              disabled={taken || isYours}
              style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: '12px 10px',
                cursor,
                textAlign: 'center',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: textColor, marginBottom: 4 }}>
                {slot.isCurrent ? 'This week' : `Week ${slots.indexOf(slot) + 1}`}
              </div>
              <div style={{ fontSize: 11, color: textColor, lineHeight: 1.4 }}>{slot.label}</div>
              <div style={{ fontSize: 10, marginTop: 6, color: isYours ? '#c9a96e' : taken ? '#4b5563' : '#6b7280' }}>
                {isYours ? 'Yours' : taken ? `Taken` : 'Available'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Banner image upload (header_banner + right_rail only) */}
      {selected && spec && (
        <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Custom banner image
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 12 }}>
            Recommended size: <span style={{ color: '#c9a96e' }}>{spec.w} × {spec.h} px</span> · JPG or PNG · max 5 MB
          </div>

          {/* Preview or drop area */}
          {bannerImageUrl ? (
            <div style={{ position: 'relative', marginBottom: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImageUrl}
                alt="Banner preview"
                style={{
                  width: '100%',
                  height: boostType === 'header_banner' ? 72 : 140,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid rgba(201,169,110,.3)',
                  display: 'block',
                }}
              />
              <button
                onClick={() => setBannerImageUrl(null)}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(7,9,15,.8)', border: '1px solid #1c2333',
                  borderRadius: 6, padding: '2px 8px', fontSize: 11,
                  color: '#f87171', cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <label
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 6, height: 80, borderRadius: 8,
                border: '1px dashed #1c2333', background: '#111620',
                cursor: uploading ? 'wait' : 'pointer', marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>▬</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {uploading ? 'Uploading…' : 'Click to upload your banner image'}
              </span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleImagePick}
                style={{ display: 'none' }}
              />
            </label>
          )}

          {uploadError && (
            <div style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{uploadError}</div>
          )}
        </div>
      )}

      {/* Custom text (optional) */}
      {selected && (
        <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Optional — custom text for your promotion
          </div>
          <input
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="Headline (e.g. Ava — Amsterdam's finest)"
            maxLength={80}
            style={{
              width: '100%', background: '#111620', border: '1px solid #1c2333',
              borderRadius: 8, padding: '10px 12px', color: '#eeeef0', fontSize: 13,
              marginBottom: 8, boxSizing: 'border-box', outline: 'none',
            }}
          />
          <input
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            placeholder="Tagline (e.g. Your most intimate evening awaits)"
            maxLength={120}
            style={{
              width: '100%', background: '#111620', border: '1px solid #1c2333',
              borderRadius: 8, padding: '10px 12px', color: '#eeeef0', fontSize: 13,
              boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>
      )}

      {error && (
        <div style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ fontSize: 13, color: '#22c55e', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
          {success}
        </div>
      )}

      <button
        onClick={book}
        disabled={!selected || booking}
        style={{
          background: selected && !booking ? '#e8607a' : '#1c2333',
          color: selected && !booking ? '#fff' : '#4b5563',
          border: 'none', borderRadius: 10, padding: '12px 24px',
          fontSize: 13, fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed',
          transition: 'background .15s, color .15s',
          transform: 'translateZ(0)', // GPU layer
        }}
      >
        {booking ? 'Booking…' : selected ? `Book selected week — €${price}` : 'Select a week to book'}
      </button>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────

function BoostCard({
  boostType,
  community,
  price,
  onBooked,
}: {
  boostType: BoostType
  community: string
  price: number
  onBooked: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #1c2333',
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color .15s',
    }}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '18px 20px', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, color: '#e8607a', flexShrink: 0 }}>{TYPE_ICONS[boostType]}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', marginBottom: 2 }}>
              {BOOST_LABELS[boostType]}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {BOOST_DESCRIPTIONS[boostType]}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#c9a96e' }}>€{price}</div>
          <div style={{ fontSize: 10, color: '#4b5563' }}>per week</div>
        </div>
      </button>

      {/* Slot picker (expanded) */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #1c2333' }}>
          <div style={{ paddingTop: 16 }}>
            <SlotPicker
              boostType={boostType}
              community={community}
              price={price}
              onBooked={onBooked}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BoostPage() {
  const [community, setCommunity] = useState<string>('')
  const [myBoosts, setMyBoosts] = useState<MyBoost[]>([])
  const [settings, setSettings] = useState<BoostSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [meRes, boostsRes, settingsRes] = await Promise.all([
      fetch('/api/companions/me').then(r => r.ok ? r.json() : null),
      fetch('/api/companions/boosts').then(r => r.ok ? r.json() : { boosts: [] }),
      fetch('/api/admin/boost-settings').then(r => r.ok ? r.json() : { settings: null }),
    ])
    if (meRes?.gender_community) setCommunity(meRes.gender_community)
    setMyBoosts(boostsRes.boosts ?? [])
    setSettings(settingsRes.settings)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function getPriceForType(type: BoostType): number {
    if (!settings) return DEFAULT_PRICES[type]
    const map: Record<string, string> = {
      featured_1: settings.price_featured_eur,
      featured_2: settings.price_featured_eur,
      featured_3: settings.price_featured_eur,
      header_banner: settings.price_header_banner_eur,
      right_rail: settings.price_right_rail_eur,
      mid_grid: settings.price_mid_grid_eur,
    }
    return parseFloat(map[type] ?? '15')
  }

  const isTypeEnabled = (type: BoostType): boolean => {
    if (!settings) return true
    if (type.startsWith('featured')) return settings.featured_enabled
    if (type === 'header_banner') return settings.header_banner_enabled
    if (type === 'right_rail')    return settings.right_rail_enabled
    if (type === 'mid_grid')      return settings.mid_grid_enabled
    return true
  }

  const activeBoosts  = myBoosts.filter(b => b.status === 'active')
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07090f', padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, background: '#0d1117', borderRadius: 14, marginBottom: 12, animation: 'bb-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', padding: '40px 16px 80px' }}>
      <style>{`
        @keyframes bb-pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: .4 }
        }
      `}</style>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8607a', marginBottom: 8 }}>
            Visibility
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px,4vw,32px)', fontWeight: 400, color: '#eeeef0', lineHeight: 1.2, margin: '0 0 10px' }}>
            Boost your{' '}
            <em style={{ fontStyle: 'italic', color: '#e8607a' }}>presence.</em>
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 520 }}>
            Secure a premium placement on the{' '}
            {community ? COMMUNITY_LABELS[community] : 'your'} community page.
            First-come, first-served — each slot is exclusive to one companion per week.
          </p>
        </div>

        {/* Active boosts summary */}
        {activeBoosts.length > 0 && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(201,169,110,.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: '#c9a96e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Your active placements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeBoosts.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, color: '#e8607a' }}>{TYPE_ICONS[b.boost_type] ?? '◈'}</span>
                    <div>
                      <div style={{ fontSize: 13, color: '#eeeef0' }}>{BOOST_LABELS[b.boost_type as BoostType] ?? b.boost_type}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{b.week_start} – {b.week_end}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!b.is_enabled && (
                      <span style={{ fontSize: 10, color: '#fbbf24', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 6, padding: '2px 8px' }}>
                        Paused by admin
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: '#22c55e', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 6, padding: '3px 8px' }}>
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 14, padding: '16px 20px', marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            How it works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {[
              ['1', 'Pick a placement type below and tap to expand'],
              ['2', 'Choose an available week — green = free, red = taken'],
              ['3', 'Confirm your booking — the slot is locked to you'],
              ['4', 'Your profile appears in that placement all week'],
            ].map(([n, text]) => (
              <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, color: '#e8607a', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{n}.</span>
                <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Boost products */}
        {!community ? (
          <div style={{ textAlign: 'center', color: '#4b5563', fontSize: 13, padding: '40px 0' }}>
            Loading your community…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Available placements — {COMMUNITY_LABELS[community] ?? community} community
            </div>
            {BOOST_TYPES.filter(t => isTypeEnabled(t)).map(type => (
              <BoostCard
                key={type}
                boostType={type}
                community={community}
                price={getPriceForType(type)}
                onBooked={loadData}
              />
            ))}
            {BOOST_TYPES.every(t => !isTypeEnabled(t)) && (
              <div style={{ textAlign: 'center', color: '#4b5563', fontSize: 13, padding: '40px 0' }}>
                No boost placements available right now.
              </div>
            )}
          </div>
        )}

        {/* Pricing note */}
        <div style={{ marginTop: 32, padding: '16px 20px', background: '#0d1117', border: '1px solid #1c2333', borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: '#4b5563', margin: 0, lineHeight: 1.7 }}>
            Payments for boost placements are handled manually for now — our team will reach out to confirm and collect payment.
            Placements are confirmed immediately upon booking. Questions? <a href="mailto:support@blushbite.live" style={{ color: '#e8607a', textDecoration: 'none' }}>support@blushbite.live</a>
          </p>
        </div>
      </div>
    </div>
  )
}
