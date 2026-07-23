'use client'

import { useState, useEffect } from 'react'

// ── Shared styles ─────────────────────────────────────────────────────────────

const S = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' } as React.CSSProperties,
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
  } as React.CSSProperties,
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 0 } as React.CSSProperties,
  card: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 16,
    padding: '28px',
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
    display: 'block',
  } as React.CSSProperties,
  input: {
    width: '100%',
    background: '#111620',
    border: '1px solid #1c2333',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 15,
    color: '#eeeef0',
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box',
  } as React.CSSProperties,
  select: {
    width: '100%',
    background: '#111620',
    border: '1px solid #1c2333',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 15,
    color: '#eeeef0',
    outline: 'none',
    marginBottom: 16,
    cursor: 'pointer',
    appearance: 'none' as const,
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    background: '#111620',
    border: '1px solid #1c2333',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 15,
    color: '#eeeef0',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 120,
    marginBottom: 16,
    boxSizing: 'border-box' as const,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
  saveBtn: {
    background: '#e8607a',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '13px 28px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: 44,
  } as React.CSSProperties,
  successMsg: {
    background: 'rgba(34,197,94,.08)',
    border: '1px solid rgba(34,197,94,.25)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#22c55e',
    marginBottom: 16,
  } as React.CSSProperties,
  errMsg: {
    background: 'rgba(248,113,113,.08)',
    border: '1px solid rgba(248,113,113,.25)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#f87171',
    marginBottom: 16,
  } as React.CSSProperties,
  shimmer: {
    background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 16,
    animation: 'shimmer 1.5s infinite',
    height: 400,
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: 18,
    color: '#eeeef0',
    marginBottom: 16,
    marginTop: 8,
  } as React.CSSProperties,
  divider: { borderTop: '1px solid #1c2333', margin: '24px 0' } as React.CSSProperties,
  tabs: { display: 'flex', gap: 4, overflowX: 'auto' as const, marginBottom: 24, paddingBottom: 4 },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 12,
    cursor: 'pointer',
    border: `1px solid ${active ? '#e8607a' : '#1c2333'}`,
    background: active ? 'rgba(232,96,122,.1)' : 'transparent',
    color: active ? '#e8607a' : '#6b7280',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
  pillRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 },
}

// ── Pill helper ───────────────────────────────────────────────────────────────

function Pill({
  val,
  current,
  label,
  onClick,
}: {
  val: string
  current: string | string[]
  label: string
  onClick: () => void
}) {
  const active = Array.isArray(current) ? current.includes(val) : current === val
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 13,
        cursor: 'pointer',
        minHeight: 34,
        border: `1px solid ${active ? '#e8607a' : '#1c2333'}`,
        color: active ? '#e8607a' : '#6b7280',
        background: active ? 'rgba(232,96,122,.1)' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function fmt(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Country dial codes ────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: 'BE', dial: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: 'CH', dial: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: 'AT', dial: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'PL', dial: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: 'HU', dial: '+36',  flag: '🇭🇺', name: 'Hungary' },
  { code: 'RO', dial: '+40',  flag: '🇷🇴', name: 'Romania' },
  { code: 'GR', dial: '+30',  flag: '🇬🇷', name: 'Greece' },
  { code: 'SE', dial: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: 'NO', dial: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: 'DK', dial: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: 'RU', dial: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: 'AR', dial: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: 'CO', dial: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: 'CL', dial: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: 'PE', dial: '+51',  flag: '🇵🇪', name: 'Peru' },
  { code: 'VE', dial: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: 'EC', dial: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'PH', dial: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: 'TH', dial: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: 'ID', dial: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: 'MY', dial: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: 'VN', dial: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: 'JP', dial: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: 'KR', dial: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China' },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: 'ZA', dial: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'EG', dial: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand' },
]

function parseE164(e164: string): { dialCode: string; localNumber: string } {
  if (!e164 || !e164.startsWith('+')) return { dialCode: '+31', localNumber: e164.replace(/\D/g, '') }
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (e164.startsWith(c.dial)) return { dialCode: c.dial, localNumber: e164.slice(c.dial.length) }
  }
  return { dialCode: '+1', localNumber: e164.slice(1) }
}

function validateWhatsApp(dialCode: string, localNumber: string): string | null {
  const digits = localNumber.replace(/\D/g, '')
  if (!digits) return 'WhatsApp number is required — dreamers need this to contact you'
  if (!/^\+[1-9]\d{6,14}$/.test(dialCode + digits)) return 'Number seems incorrect — check the country code and digits'
  return null
}

function validateTelegram(handle: string): string | null {
  const h = handle.trim()
  if (!h) return null
  if (h.startsWith('+')) {
    if (!/^\+[1-9]\d{6,14}$/.test(h)) return 'Phone must include country code, e.g. +31612345678'
    return null
  }
  const u = h.startsWith('@') ? h.slice(1) : h
  if (u.length < 5) return 'Username must be at least 5 characters'
  if (u.length > 32) return 'Username must be 32 characters or less'
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Only letters, numbers and underscores allowed'
  if (u.startsWith('_') || u.endsWith('_')) return 'Username cannot start or end with an underscore'
  return null
}

function normalizeTelegram(handle: string): string {
  const h = handle.trim()
  if (!h || h.startsWith('+') || h.startsWith('@')) return h
  return '@' + h
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastItem { id: number; type: 'success' | 'error'; msg: string }

function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      <style>{`@keyframes bbToastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: '#0d1117',
          border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,.3)' : 'rgba(248,113,113,.3)'}`,
          borderLeft: `3px solid ${t.type === 'success' ? '#22c55e' : '#f87171'}`,
          borderRadius: 10, padding: '12px 14px', fontSize: 13,
          color: t.type === 'success' ? '#22c55e' : '#f87171',
          display: 'flex', alignItems: 'center', gap: 10,
          minWidth: 240, maxWidth: 360,
          boxShadow: '0 8px 28px rgba(0,0,0,.55)',
          animation: 'bbToastIn .18s ease',
          pointerEvents: 'all',
        }}>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.type === 'success' ? '✓ ' : '✕ '}{t.msg}</span>
          <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── VERIFICATION VIEW — shown until admin approves ────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface MeData {
  status: string
  full_name: string | null
  email: string
  date_of_birth: string | null
  country: string | null
  city: string | null
  companion_whatsapp: string | null
  profile_whatsapp: string | null
  telegram_handle: string | null
  alias: string | null
  gender: string | null
  gender_community: string | null
  tagline: string | null
  bio: string | null
  rejection_reason: string | null
}

interface AppForm {
  full_name: string
  display_name: string
  date_of_birth: string
  country: string
  city: string
  whatsapp_number: string
  tagline: string
  bio: string
}

function VerificationView({ me }: { me: MeData }) {
  const isPending = me.status !== 'rejected'
  const isRejected = me.status === 'rejected'

  const [form, setForm] = useState<AppForm>({
    full_name: me.full_name ?? '',
    display_name: me.alias ?? '',
    date_of_birth: me.date_of_birth ? me.date_of_birth.split('T')[0] : '',
    country: me.country ?? '',
    city: me.city ?? '',
    whatsapp_number: me.companion_whatsapp ?? me.profile_whatsapp ?? '',
    tagline: me.tagline ?? '',
    bio: me.bio ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function showToast(type: 'success' | 'error', msg: string) {
    const id = Date.now()
    setToasts((t) => [...t, { id, type, msg }])
    if (type === 'success') setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }
  function dismissToast(id: number) { setToasts((t) => t.filter((x) => x.id !== id)) }

  function set(key: keyof AppForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function save() {
    setSaving(true)
    try {
      const r = await fetch('/api/companions/application', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) {
        const d = await r.json()
        showToast('error', d.error ?? 'Save failed — please try again')
        return
      }
      showToast('success', 'Changes saved')
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } finally {
      setSaving(false)
    }
  }

  const bannerStyle: React.CSSProperties = isRejected
    ? {
        background: 'rgba(248,113,113,.07)',
        border: '1px solid rgba(248,113,113,.25)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 28,
      }
    : {
        background: 'rgba(251,191,36,.06)',
        border: '1px solid rgba(251,191,36,.2)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 28,
      }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={S.eyebrow}>Account verification</p>
        <h1 style={S.title}>
          {isRejected ? 'Application ' : 'Application '}
          <em style={{ fontStyle: 'italic', color: isRejected ? '#f87171' : '#c9a96e' }}>
            {isRejected ? 'not approved.' : 'under review.'}
          </em>
        </h1>
        <p style={S.sub}>
          {isRejected
            ? 'You can update your information below and our team will be in touch.'
            : "We're reviewing your application. You'll receive an email once approved — usually within 48 hours."}
        </p>
      </div>

      {/* Status banner */}
      <div style={bannerStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 18, marginTop: 1 }}>{isRejected ? '✕' : '◌'}</div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: isRejected ? '#f87171' : '#fbbf24',
                marginBottom: 4,
              }}
            >
              {isRejected ? 'Application not approved' : 'Review in progress'}
            </div>
            {isRejected && me.rejection_reason ? (
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                {me.rejection_reason}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                {isPending
                  ? "Our team reviews every application personally. We'll notify you by email at " +
                    me.email +
                    '.'
                  : 'Update your information below and resubmit.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Editable application form */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={
            {
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#6b7280',
              marginBottom: 4,
            } as React.CSSProperties
          }
        >
          Your submitted application
        </div>
        <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 20 }}>
          You can edit the information you submitted. Changes are saved immediately.
        </p>
      </div>

      <div style={S.card}>
        {/* Email — readonly */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Email address</label>
          <input
            style={{ ...S.input, opacity: 0.5, cursor: 'not-allowed', marginBottom: 0 }}
            value={me.email}
            readOnly
            tabIndex={-1}
          />
          <p style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
            Email cannot be changed after verification.
          </p>
        </div>

        <hr style={S.divider} />
        <div style={S.sectionTitle}>Personal details</div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Full name</label>
            <input
              style={S.input}
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              placeholder="Your legal name"
            />
          </div>
          <div>
            <label style={S.label}>Display name</label>
            <input
              style={S.input}
              value={form.display_name}
              onChange={(e) => set('display_name', e.target.value)}
              placeholder="Name dreamers know you by"
              maxLength={60}
            />
          </div>
        </div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Date of birth</label>
            <input
              style={S.input}
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split('T')[0]
              }
            />
          </div>
          <div>
            <label style={S.label}>Gender</label>
            <input
              style={{ ...S.input, opacity: 0.5, cursor: 'not-allowed', marginBottom: 0 }}
              value={{ female: 'Female', male: 'Male', shemale: 'Shemale / TS' }[me.gender_community ?? ''] ?? (me.gender_community ?? '')}
              readOnly
              tabIndex={-1}
            />
            <p style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
              Your community is set at registration and cannot be changed.
            </p>
          </div>
        </div>

        <hr style={S.divider} />
        <div style={S.sectionTitle}>Location & contact</div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Country</label>
            <input
              style={S.input}
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              placeholder="Netherlands"
              autoCapitalize="words"
            />
          </div>
          <div>
            <label style={S.label}>City</label>
            <input
              style={S.input}
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="Amsterdam"
              autoCapitalize="words"
            />
          </div>
        </div>

        <label style={S.label}>WhatsApp number</label>
        <input
          style={S.input}
          value={form.whatsapp_number}
          onChange={(e) => set('whatsapp_number', e.target.value)}
          placeholder="+31612345678"
          inputMode="tel"
        />

        <hr style={S.divider} />
        <div style={S.sectionTitle}>Your profile</div>

        <label style={S.label}>Tagline</label>
        <input
          style={S.input}
          value={form.tagline}
          onChange={(e) => set('tagline', e.target.value)}
          placeholder="A short line about your energy…"
          maxLength={300}
        />

        <label style={S.label}>Bio</label>
        <textarea
          style={S.textarea}
          value={form.bio}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="Tell us about yourself — what a session with you feels like, what you love, how you connect…"
          maxLength={2000}
        />

        {/* Save */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: 8,
            borderTop: '1px solid #1c2333',
            marginTop: 8,
          }}
        >
          <button
            style={{
              ...S.saveBtn,
              opacity: saving ? 0.6 : 1,
              background: saveState === 'saved' ? '#22c55e' : '#e8607a',
            }}
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── PROFILE BUILDER — shown once approved ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface ExtendedProfile {
  // editable
  display_name: string
  height_cm: number | null
  body_type: string
  hair_color: string
  eye_color: string
  ethnicity: string
  languages: string[]
  vibe_tags: string[]
  session_modality: string
  instagram_handle: string
  website_url: string
}

const BODY_TYPES = ['slim', 'athletic', 'curvy', 'plus_size', 'average', 'prefer_not_to_say']
const HAIR_COLORS = ['blonde', 'brunette', 'black', 'red', 'auburn', 'grey', 'white', 'other']
const EYE_COLORS = ['black', 'brown', 'hazel', 'blue', 'green', 'grey', 'other']
const MODALITIES = [
  { v: 'in_person', l: 'In Person' },
  { v: 'online', l: 'Online' },
  { v: 'both', l: 'Both' },
]
const CURRENCIES = ['EUR', 'GBP', 'USD', 'INR', 'CHF', 'SEK', 'DKK', 'NOK', 'CAD', 'AUD']
const LANGUAGES = [
  'Hindi',
  'English',
  'Bengali',
  'Telugu',
  'Marathi',
  'Tamil',
  'Urdu',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Odia',
  'Punjabi',
  'Assamese',
  'Maithili',
  'Santali',
  'Kashmiri',
  'Nepali',
  'Sindhi',
  'Konkani',
  'Dogri',
  'Bodo',
  'Manipuri',
  'Sanskrit',
]
const VIBE_TAGS = [
  'intellectual',
  'playful',
  'mysterious',
  'nurturing',
  'adventurous',
  'dominant',
  'submissive',
  'sensual',
  'artistic',
  'spiritual',
  'witty',
  'empathetic',
  'confident',
  'shy',
  'elegant',
  'rebellious',
]
const SECTIONS = ['Look', 'Vibe', 'Languages', 'Sessions', 'Connect', 'Rates']

const DEFAULT_EXT: ExtendedProfile = {
  display_name: '',
  height_cm: null,
  body_type: '',
  hair_color: '',
  eye_color: '',
  ethnicity: '',
  languages: [],
  vibe_tags: [],
  session_modality: '',
  instagram_handle: '',
  website_url: '',
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

interface SessionCard {
  id: string
  title: string
  description: string | null
  duration_minutes: number | null
  price: string | null
  currency: string
  session_type: string | null
  is_active: boolean
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  in_person: 'In Person',
  audio_call: 'Audio Call',
  video_call: 'Video Call',
  chat: 'Chat',
  custom: 'Custom',
}
const SESSION_TYPES = Object.keys(SESSION_TYPE_LABELS)

function ProfileBuilder({ meData }: { meData: MeData }) {
  const [active, setActive] = useState(0)
  const [ext, setExt] = useState<ExtendedProfile>(DEFAULT_EXT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [extSaveState, setExtSaveState] = useState<'idle' | 'saved'>('idle')

  // Toast state
  const [toasts, setToasts] = useState<ToastItem[]>([])
  function showToast(type: 'success' | 'error', msg: string) {
    const id = Date.now()
    setToasts((t) => [...t, { id, type, msg }])
    if (type === 'success') setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }
  function dismissToast(id: number) { setToasts((t) => t.filter((x) => x.id !== id)) }

  // Session cards state
  const [cards, setCards] = useState<SessionCard[]>([])
  const [cardForm, setCardForm] = useState<{
    title: string; description: string; duration: string; price: string
    currency: string; session_type: string
  }>({ title: '', description: '', duration: '', price: '', currency: 'EUR', session_type: '' })
  const [cardAdding, setCardAdding] = useState(false)
  const [cardSaving, setCardSaving] = useState(false)
  const [cardErr, setCardErr] = useState('')

  // Identity state — editable fields collected post-registration
  const [identity, setIdentity] = useState({
    full_name: meData.full_name ?? '',
    date_of_birth: meData.date_of_birth ? meData.date_of_birth.split('T')[0] : '',
    country: meData.country ?? '',
    city: meData.city ?? '',
    telegram_handle: meData.telegram_handle ?? '',
    tagline: meData.tagline ?? '',
    bio: meData.bio ?? '',
  })
  // WhatsApp split into dial code + local number
  const initWa = parseE164(meData.companion_whatsapp ?? meData.profile_whatsapp ?? '')
  const [waDialCode, setWaDialCode] = useState(initWa.dialCode)
  const [waLocalNumber, setWaLocalNumber] = useState(initWa.localNumber)
  const [fieldErrors, setFieldErrors] = useState<{ whatsapp?: string; telegram?: string }>({})
  const [savingIdentity, setSavingIdentity] = useState(false)
  const [identitySaveState, setIdentitySaveState] = useState<'idle' | 'saved'>('idle')
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'success' | 'denied' | 'error'>('idle')
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null)

  async function shareLocation() {
    if (!navigator.geolocation) { setLocStatus('error'); return }
    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const res = await fetch('/api/companions/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude }),
        })
        if (res.ok) {
          setLocStatus('success')
          // Reverse geocode to show the companion what city was detected
          try {
            const geo = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'Accept-Language': 'en' } }
            ).then((r) => r.json())
            const city = geo?.address?.city ?? geo?.address?.town ?? geo?.address?.village ?? null
            const country = geo?.address?.country ?? null
            if (city || country) {
              setDetectedLocation([city, country].filter(Boolean).join(', '))
            }
          } catch {
            // reverse geocode is best-effort; no error shown
          }
        } else {
          setLocStatus('error')
        }
      },
      () => setLocStatus('denied')
    )
  }

  const showComplianceNotice = !identity.full_name.trim() || !identity.date_of_birth

  async function saveIdentity() {
    // Validate contact fields before hitting the API
    const waErr = validateWhatsApp(waDialCode, waLocalNumber)
    const tgErr = validateTelegram(identity.telegram_handle)
    const errors: { whatsapp?: string; telegram?: string } = {}
    if (waErr) errors.whatsapp = waErr
    if (tgErr) errors.telegram = tgErr
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      showToast('error', 'Fix the highlighted errors before saving')
      return
    }
    setSavingIdentity(true)
    try {
      const fullWa = waLocalNumber.trim() ? waDialCode + waLocalNumber.replace(/\D/g, '') : null
      const normTg = normalizeTelegram(identity.telegram_handle) || null
      const r = await fetch('/api/companions/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: identity.full_name,
          date_of_birth: identity.date_of_birth || null,
          country: identity.country,
          city: identity.city,
          whatsapp_number: fullWa,
          telegram_handle: normTg,
          tagline: identity.tagline,
          bio: identity.bio,
        }),
      })
      const d = await r.json()
      if (!r.ok) {
        showToast('error', d.error ?? 'Save failed — please try again')
        return
      }
      showToast('success', 'Identity & details saved')
      setIdentitySaveState('saved')
      setTimeout(() => setIdentitySaveState('idle'), 2000)
    } finally {
      setSavingIdentity(false)
    }
  }

  const age = calcAge(identity.date_of_birth || meData.date_of_birth)

  useEffect(() => {
    Promise.all([
      fetch('/api/companions/profile').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/companions/session-cards').then((r) => (r.ok ? r.json() : null)),
    ]).then(([d, sc]) => {
      if (d)
        setExt((prev) => ({
          ...prev,
          display_name: meData.alias ?? '',
          height_cm: d.height_cm != null ? parseInt(d.height_cm) : null,
          body_type: d.body_type ?? '',
          hair_color: d.hair_color ?? '',
          eye_color: d.eye_color ?? '',
          ethnicity: d.ethnicity ?? '',
          languages: Array.isArray(d.languages) ? d.languages : [],
          vibe_tags: Array.isArray(d.vibe_tags) ? d.vibe_tags : [],
          session_modality: d.session_modality ?? '',
          instagram_handle: d.instagram_handle ?? '',
          website_url: d.website_url ?? '',
        }))
      if (sc?.cards) setCards(sc.cards)
    }).finally(() => setLoading(false))
  }, [meData.alias])

  async function addCard() {
    setCardErr('')
    if (!cardForm.title.trim()) { setCardErr('Title is required.'); return }
    setCardSaving(true)
    try {
      const r = await fetch('/api/companions/session-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cardForm.title.trim(),
          description: cardForm.description.trim() || null,
          duration_minutes: cardForm.duration ? parseInt(cardForm.duration) : null,
          price: cardForm.price ? parseFloat(cardForm.price) : null,
          currency: cardForm.currency,
          session_type: cardForm.session_type || null,
        }),
      })
      const data = await r.json()
      if (!r.ok) { setCardErr(data.error ?? 'Failed to add.'); return }
      // Refresh list
      const sc = await fetch('/api/companions/session-cards').then((r) => r.json())
      setCards(sc.cards ?? [])
      setCardForm({ title: '', description: '', duration: '', price: '', currency: 'EUR', session_type: '' })
      setCardAdding(false)
    } finally {
      setCardSaving(false)
    }
  }

  async function deleteCard(id: string) {
    await fetch(`/api/companions/session-cards/${id}`, { method: 'DELETE' })
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  function set<K extends keyof ExtendedProfile>(key: K, val: ExtendedProfile[K]) {
    setExt((p) => ({ ...p, [key]: val }))
  }

  function toggleArr(key: 'languages' | 'vibe_tags', val: string) {
    setExt((p) => {
      const arr = p[key] as string[]
      return { ...p, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] }
    })
  }

  async function save() {
    setSaving(true)
    try {
      const r = await fetch('/api/companions/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ext),
      })
      const d = await r.json()
      if (!r.ok) {
        showToast('error', d.error ?? 'Save failed — please try again')
        return
      }
      showToast('success', 'Profile saved')
      setExtSaveState('saved')
      setTimeout(() => setExtSaveState('idle'), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div style={S.page}>
        <div style={S.shimmer} />
      </div>
    )

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 28 }}>
        <p style={S.eyebrow}>Profile builder</p>
        <h1 style={S.title}>Your profile</h1>
        <p style={S.sub}>
          Your application details are shown below. Add the remaining information to complete your
          profile.
        </p>
      </div>

      {/* ── Compliance notice ── */}
      {showComplianceNotice && (
        <div
          style={{
            background: 'rgba(251,191,36,.07)',
            border: '1px solid rgba(251,191,36,.25)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
            fontSize: 13,
            color: '#fbbf24',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: '#fbbf24' }}>Account security:</strong> Add your legal name and date of birth to secure your account and comply with platform requirements.
        </div>
      )}

      {/* ── Identity card — editable ── */}
      <div style={{ ...S.card, marginBottom: 24 }}>
        <div style={S.sectionTitle as React.CSSProperties}>Identity &amp; details</div>
        <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 20, lineHeight: 1.5 }}>
          Add your details to complete your profile. Your legal name is never shown to dreamers.
        </p>

        {/* Display name — part of ext, saved with extended profile */}
        <label style={{ ...S.label, color: '#e8607a' }}>
          Display name
        </label>
        <input
          style={{
            ...S.input,
            borderColor: ext.display_name ? 'rgba(232,96,122,0.35)' : '#1c2333',
          }}
          value={ext.display_name}
          onChange={(e) => set('display_name', e.target.value)}
          placeholder="The name dreamers know you by"
          maxLength={60}
        />

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Legal name <span style={{ fontSize: 10, color: '#4b5563' }}>(private)</span></label>
            <input
              style={S.input}
              value={identity.full_name}
              onChange={(e) => setIdentity((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Your legal name"
              autoComplete="name"
            />
          </div>
          <div>
            <label style={S.label}>Date of birth {age != null ? `(age ${age})` : ''}</label>
            <input
              style={S.input}
              type="date"
              value={identity.date_of_birth}
              onChange={(e) => setIdentity((p) => ({ ...p, date_of_birth: e.target.value }))}
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split('T')[0]
              }
            />
          </div>
        </div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Gender</label>
            <input
              style={{ ...S.input, opacity: 0.5, cursor: 'not-allowed', marginBottom: 0 }}
              value={{ female: 'Female', male: 'Male', shemale: 'Shemale / TS' }[meData.gender_community ?? ''] ?? (meData.gender_community ?? '')}
              readOnly
              tabIndex={-1}
            />
            <p style={{ fontSize: 11, color: '#4b5563', marginTop: 4, marginBottom: 16 }}>
              Your community is set at registration and cannot be changed.
            </p>
          </div>
          <div>
            <label style={S.label}>Country</label>
            <input
              style={S.input}
              value={identity.country}
              onChange={(e) => setIdentity((p) => ({ ...p, country: e.target.value }))}
              placeholder="Netherlands"
              autoCapitalize="words"
            />
          </div>
        </div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>City</label>
            <input
              style={S.input}
              value={identity.city}
              onChange={(e) => setIdentity((p) => ({ ...p, city: e.target.value }))}
              placeholder="Amsterdam"
              autoCapitalize="words"
            />
          </div>
        </div>

        {/* Contact — WhatsApp + Telegram */}
        <div style={{ borderTop: '1px solid #1c2333', margin: '8px 0 20px', paddingTop: 20 }}>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4, fontWeight: 500 }}>
            Contact details
          </div>
          <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 16 }}>
            These become the WhatsApp &amp; Telegram buttons dreamers tap to reach you. Required to appear in search.
          </p>
        </div>

        {/* Contact info banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          background: 'rgba(201,169,110,0.06)',
          border: '1px solid rgba(201,169,110,0.2)',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 16,
          fontSize: 11,
          color: '#9ca3af',
          lineHeight: 1.5,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ</span>
          <span>
            Fill these correctly — dreamers tap these buttons to contact and book you.
            Without them your profile stays hidden from search.
          </span>
        </div>

        {/* WhatsApp — country code picker + number */}
        <div style={{ marginBottom: 4 }}>
          <label style={{ ...S.label, color: waLocalNumber && !fieldErrors.whatsapp ? '#22c55e' : '#e8607a' }}>
            WhatsApp number <span style={{ fontSize: 10, opacity: 0.8 }}>required</span>
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <select
              value={waDialCode}
              onChange={(e) => setWaDialCode(e.target.value)}
              onBlur={() => {
                const err = validateWhatsApp(waDialCode, waLocalNumber)
                setFieldErrors((p) => ({ ...p, whatsapp: err ?? undefined }))
              }}
              style={{
                ...S.select,
                flex: '0 0 auto',
                width: 'auto',
                minWidth: 160,
                marginBottom: 0,
                borderColor: waLocalNumber && !fieldErrors.whatsapp
                  ? 'rgba(34,197,94,0.4)'
                  : fieldErrors.whatsapp
                    ? 'rgba(248,113,113,0.5)'
                    : 'rgba(232,96,122,0.4)',
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code + c.dial} value={c.dial}>
                  {c.flag} {c.dial} {c.name}
                </option>
              ))}
            </select>
            <input
              style={{
                ...S.input,
                flex: 1,
                marginBottom: 0,
                borderColor: waLocalNumber && !fieldErrors.whatsapp
                  ? 'rgba(34,197,94,0.4)'
                  : fieldErrors.whatsapp
                    ? 'rgba(248,113,113,0.5)'
                    : 'rgba(232,96,122,0.4)',
              }}
              value={waLocalNumber}
              inputMode="tel"
              placeholder="612345678"
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setWaLocalNumber(digits)
                if (fieldErrors.whatsapp) {
                  const err = validateWhatsApp(waDialCode, digits)
                  setFieldErrors((p) => ({ ...p, whatsapp: err ?? undefined }))
                }
              }}
              onBlur={() => {
                const err = validateWhatsApp(waDialCode, waLocalNumber)
                setFieldErrors((p) => ({ ...p, whatsapp: err ?? undefined }))
              }}
            />
          </div>
          {fieldErrors.whatsapp
            ? <p style={{ fontSize: 11, color: '#f87171', margin: '0 0 16px' }}>{fieldErrors.whatsapp}</p>
            : <p style={{ fontSize: 11, color: '#4b5563', margin: '0 0 16px' }}>Dreamers tap this to message you directly</p>
          }
        </div>

        {/* Telegram */}
        <div style={{ marginBottom: 4 }}>
          <label style={{ ...S.label, color: identity.telegram_handle && !fieldErrors.telegram ? '#22c55e' : '#e8607a' }}>
            Telegram <span style={{ fontSize: 10, opacity: 0.8 }}>required</span>
          </label>
          <input
            style={{
              ...S.input,
              marginBottom: 4,
              borderColor: identity.telegram_handle && !fieldErrors.telegram
                ? 'rgba(34,197,94,0.4)'
                : fieldErrors.telegram
                  ? 'rgba(248,113,113,0.5)'
                  : 'rgba(232,96,122,0.4)',
            }}
            value={identity.telegram_handle}
            placeholder="@username or +31612345678"
            onChange={(e) => {
              setIdentity((p) => ({ ...p, telegram_handle: e.target.value }))
              if (fieldErrors.telegram) {
                const err = validateTelegram(e.target.value)
                setFieldErrors((p) => ({ ...p, telegram: err ?? undefined }))
              }
            }}
            onBlur={(e) => {
              const normalized = normalizeTelegram(e.target.value)
              setIdentity((p) => ({ ...p, telegram_handle: normalized }))
              const err = validateTelegram(normalized)
              setFieldErrors((p) => ({ ...p, telegram: err ?? undefined }))
            }}
          />
          {fieldErrors.telegram
            ? <p style={{ fontSize: 11, color: '#f87171', margin: '0 0 16px' }}>{fieldErrors.telegram}</p>
            : <p style={{ fontSize: 11, color: '#4b5563', margin: '0 0 16px' }}>@username or phone — dreamers tap this to open a Telegram chat</p>
          }
        </div>

        {/* Location sharing */}
        <div
          style={{
            background: '#111620',
            border: '1px solid #1c2333',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 2 }}>
              Share approximate location
            </p>
            <p style={{ fontSize: 11, color: '#6b7280' }}>
              {locStatus === 'success'
                ? detectedLocation
                  ? `Detected: ${detectedLocation}. Dreamers can see your distance.`
                  : 'Location shared — dreamers can see your distance.'
                : locStatus === 'denied'
                  ? 'Location blocked. Enable it in browser settings.'
                  : locStatus === 'error'
                    ? 'Could not get location. Try again.'
                    : 'Lets dreamers see your distance. Never exact — city-level only.'}
            </p>
          </div>
          <button
            onClick={shareLocation}
            disabled={locStatus === 'loading' || locStatus === 'success'}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 12,
              cursor: locStatus === 'loading' || locStatus === 'success' ? 'default' : 'pointer',
              border: `1px solid ${locStatus === 'success' ? 'rgba(34,197,94,.3)' : locStatus === 'denied' || locStatus === 'error' ? 'rgba(248,113,113,.3)' : 'rgba(232,96,122,.3)'}`,
              background:
                locStatus === 'success'
                  ? 'rgba(34,197,94,.08)'
                  : locStatus === 'denied' || locStatus === 'error'
                    ? 'rgba(248,113,113,.08)'
                    : 'rgba(232,96,122,.08)',
              color:
                locStatus === 'success'
                  ? '#22c55e'
                  : locStatus === 'denied' || locStatus === 'error'
                    ? '#f87171'
                    : '#e8607a',
              minHeight: 34,
              whiteSpace: 'nowrap',
            }}
          >
            {locStatus === 'loading'
              ? 'Getting location…'
              : locStatus === 'success'
                ? '✓ Location shared'
                : 'Share location'}
          </button>
        </div>

        <label style={S.label}>Tagline</label>
        <input
          style={S.input}
          value={identity.tagline}
          onChange={(e) => setIdentity((p) => ({ ...p, tagline: e.target.value }))}
          placeholder="A short line about your energy…"
          maxLength={300}
        />

        <label style={S.label}>Bio</label>
        <textarea
          style={S.textarea}
          value={identity.bio}
          onChange={(e) => setIdentity((p) => ({ ...p, bio: e.target.value }))}
          placeholder="Tell dreamers about yourself — how you move, what you love, what a session with you feels like…"
          maxLength={2000}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #1c2333', marginTop: 8, gap: 12 }}>
          <button
            style={{
              ...S.saveBtn,
              fontSize: 13,
              padding: '10px 22px',
              opacity: savingIdentity ? 0.6 : 1,
              background: identitySaveState === 'saved' ? '#22c55e' : '#e8607a',
            }}
            onClick={saveIdentity}
            disabled={savingIdentity}
          >
            {savingIdentity ? 'Saving…' : identitySaveState === 'saved' ? '✓ Saved' : 'Save details'}
          </button>
          <button
            style={{ ...S.saveBtn, fontSize: 13, padding: '10px 22px', opacity: saving ? 0.6 : 1, background: 'transparent', border: '1px solid rgba(232,96,122,.4)', color: '#e8607a' }}
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save display name'}
          </button>
        </div>
      </div>

      {/* ── Extended profile tabs ── */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={
            {
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#6b7280',
              marginBottom: 4,
            } as React.CSSProperties
          }
        >
          Complete your profile
        </div>
        <p style={{ fontSize: 13, color: '#4b5563' }}>
          These details help dreamers find and connect with you.
        </p>
      </div>

      <div style={S.tabs}>
        {SECTIONS.map((sec, i) => (
          <button key={sec} style={S.tab(active === i)} onClick={() => setActive(i)}>
            {sec}
          </button>
        ))}
      </div>

      <div style={S.card}>
        {/* Look */}
        {active === 0 && (
          <>
            <div style={S.sectionTitle}>Look</div>
            <div style={{ ...S.grid2, marginBottom: 0 }}>
              <div>
                <label style={S.label}>Height (cm)</label>
                <input
                  style={S.input}
                  type="number"
                  min={140}
                  max={220}
                  value={ext.height_cm ?? ''}
                  onChange={(e) =>
                    set('height_cm', e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="170"
                />
              </div>
              <div>
                <label style={S.label}>Ethnicity (optional)</label>
                <input
                  style={S.input}
                  value={ext.ethnicity}
                  onChange={(e) => set('ethnicity', e.target.value)}
                  placeholder="How you identify"
                />
              </div>
            </div>
            <label style={S.label}>Body type</label>
            <div style={S.pillRow}>
              {BODY_TYPES.map((v) => (
                <Pill
                  key={v}
                  val={v}
                  current={ext.body_type}
                  label={fmt(v)}
                  onClick={() => set('body_type', v === ext.body_type ? '' : v)}
                />
              ))}
            </div>
            <label style={S.label}>Hair colour</label>
            <div style={S.pillRow}>
              {HAIR_COLORS.map((v) => (
                <Pill
                  key={v}
                  val={v}
                  current={ext.hair_color}
                  label={fmt(v)}
                  onClick={() => set('hair_color', v === ext.hair_color ? '' : v)}
                />
              ))}
            </div>
            <label style={S.label}>Eye colour</label>
            <div style={S.pillRow}>
              {EYE_COLORS.map((v) => (
                <Pill
                  key={v}
                  val={v}
                  current={ext.eye_color}
                  label={fmt(v)}
                  onClick={() => set('eye_color', v === ext.eye_color ? '' : v)}
                />
              ))}
            </div>
          </>
        )}

        {/* Vibe */}
        {active === 1 && (
          <>
            <div style={S.sectionTitle}>Vibe</div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
              Pick tags that describe your energy and personality.
            </p>
            <div style={S.pillRow}>
              {VIBE_TAGS.map((t) => (
                <Pill
                  key={t}
                  val={t}
                  current={ext.vibe_tags}
                  label={fmt(t)}
                  onClick={() => toggleArr('vibe_tags', t)}
                />
              ))}
            </div>
          </>
        )}

        {/* Languages */}
        {active === 2 && (
          <>
            <div style={S.sectionTitle}>Languages</div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
              Select all languages you can conduct sessions in.
            </p>
            <div style={S.pillRow}>
              {LANGUAGES.map((l) => (
                <Pill
                  key={l}
                  val={l}
                  current={ext.languages}
                  label={l}
                  onClick={() => toggleArr('languages', l)}
                />
              ))}
            </div>
          </>
        )}

        {/* Sessions */}
        {active === 3 && (
          <>
            <div style={S.sectionTitle}>Sessions</div>
            <label style={S.label}>Session type</label>
            <div style={S.pillRow}>
              {MODALITIES.map((m) => (
                <Pill
                  key={m.v}
                  val={m.v}
                  current={ext.session_modality}
                  label={m.l}
                  onClick={() => set('session_modality', m.v === ext.session_modality ? '' : m.v)}
                />
              ))}
            </div>
          </>
        )}

        {/* Connect */}
        {active === 4 && (
          <>
            <div style={S.sectionTitle}>Connect</div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 20 }}>
              Your WhatsApp is locked to your verified number. Add optional social links below.
            </p>
            <label style={S.label}>Instagram handle (optional)</label>
            <input
              style={S.input}
              value={ext.instagram_handle}
              onChange={(e) => set('instagram_handle', e.target.value)}
              placeholder="@yourhandle"
            />
            <label style={S.label}>Website URL (optional)</label>
            <input
              style={S.input}
              value={ext.website_url}
              onChange={(e) => set('website_url', e.target.value)}
              placeholder="https://yoursite.com"
              inputMode="url"
            />
          </>
        )}

        {/* Rates */}
        {active === 5 && (
          <>
            <div style={S.sectionTitle}>Rates</div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
              Add the services you offer. Dreamers will see these on your profile.
            </p>

            {/* Services list */}
            {cards.length > 0 && (
              <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cards.map((card) => (
                  <div
                    key={card.id}
                    style={{
                      background: '#111620',
                      border: '1px solid #1c2333',
                      borderRadius: 12,
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: '#eeeef0', fontWeight: 500, marginBottom: 4 }}>
                        {card.title}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {card.session_type && (
                          <span style={{ fontSize: 11, color: '#9ca3af', background: '#0d1117', borderRadius: 6, padding: '2px 8px', border: '1px solid #1c2333' }}>
                            {SESSION_TYPE_LABELS[card.session_type] ?? card.session_type}
                          </span>
                        )}
                        {card.duration_minutes && (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{card.duration_minutes} min</span>
                        )}
                        {card.price && (
                          <span style={{ fontSize: 12, color: '#e8607a', fontWeight: 500 }}>
                            {card.currency} {parseFloat(card.price).toFixed(0)}
                          </span>
                        )}
                        {card.description && (
                          <span style={{ fontSize: 12, color: '#6b7280', width: '100%' }}>{card.description}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCard(card.id)}
                      style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0 }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add service form */}
            {cardAdding ? (
              <div style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 14 }}>New service</div>
                {cardErr && (
                  <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12, padding: '8px 12px', background: 'rgba(248,113,113,.08)', borderRadius: 8, border: '1px solid rgba(248,113,113,.2)' }}>
                    {cardErr}
                  </div>
                )}
                <label style={S.label}>Title *</label>
                <input
                  style={S.input}
                  value={cardForm.title}
                  onChange={(e) => setCardForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 60-min video call"
                />
                <label style={S.label}>Description</label>
                <input
                  style={S.input}
                  value={cardForm.description}
                  onChange={(e) => setCardForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What's included…"
                />
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Session type</label>
                    <select
                      style={S.select}
                      value={cardForm.session_type}
                      onChange={(e) => setCardForm((f) => ({ ...f, session_type: e.target.value }))}
                    >
                      <option value="">— Select —</option>
                      {SESSION_TYPES.map((t) => (
                        <option key={t} value={t}>{SESSION_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Duration (minutes)</label>
                    <input
                      style={S.input}
                      type="number"
                      min={1}
                      value={cardForm.duration}
                      onChange={(e) => setCardForm((f) => ({ ...f, duration: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <label style={S.label}>Price</label>
                    <input
                      style={S.input}
                      type="number"
                      min={0}
                      value={cardForm.price}
                      onChange={(e) => setCardForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label style={S.label}>Currency</label>
                    <select
                      style={S.select}
                      value={cardForm.currency}
                      onChange={(e) => setCardForm((f) => ({ ...f, currency: e.target.value }))}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={addCard}
                    disabled={cardSaving}
                    style={{ background: '#e8607a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer', opacity: cardSaving ? 0.6 : 1 }}
                  >
                    {cardSaving ? 'Adding…' : 'Add service'}
                  </button>
                  <button
                    onClick={() => { setCardAdding(false); setCardErr('') }}
                    style={{ background: 'transparent', border: '1px solid #1c2333', color: '#6b7280', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCardAdding(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px dashed #1c2333', color: '#9ca3af', borderRadius: 12, padding: '12px 18px', fontSize: 14, cursor: 'pointer', width: '100%' }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add service
              </button>
            )}
          </>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            paddingTop: 24,
            borderTop: '1px solid #1c2333',
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            {active > 0 && (
              <button
                style={{
                  background: 'transparent',
                  border: '1px solid #1c2333',
                  color: '#6b7280',
                  borderRadius: 12,
                  padding: '11px 20px',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                onClick={() => setActive((a) => a - 1)}
              >
                ← Previous
              </button>
            )}
            {active < SECTIONS.length - 1 && (
              <button
                style={{
                  background: 'transparent',
                  border: '1px solid #1c2333',
                  color: '#9ca3af',
                  borderRadius: 12,
                  padding: '11px 20px',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                onClick={() => setActive((a) => a + 1)}
              >
                Next →
              </button>
            )}
          </div>
          <button
            style={{
              ...S.saveBtn,
              opacity: saving ? 0.6 : 1,
              background: extSaveState === 'saved' ? '#22c55e' : '#e8607a',
            }}
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : extSaveState === 'saved' ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── PAGE — branches on approval status ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const [me, setMe] = useState<MeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/companions/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div style={S.page}>
        <div style={S.shimmer} />
      </div>
    )
  if (!me) return null

  if (me.status !== 'rejected') return <ProfileBuilder meData={me} />
  return <VerificationView me={me} />
}
