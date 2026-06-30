'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GENDERS = [
  'woman',
  'man',
  'non_binary',
  'trans_woman',
  'trans_man',
  'genderqueer',
  'genderfluid',
  'agender',
  'other',
  'prefer_not_to_say',
]
const MODALITIES = [
  { v: 'in_person', label: 'In Person' },
  { v: 'online', label: 'Online' },
  { v: 'both', label: 'Both' },
]

export default function ReapplyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [city, setCity] = useState('')
  const [gender, setGender] = useState('')
  const [tagline, setTagline] = useState('')
  const [bio, setBio] = useState('')
  const [modality, setModality] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  useEffect(() => {
    fetch('/api/companions/reapply')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          router.replace('/status')
          return
        }
        setCity(data.city ?? '')
        setGender(data.gender ?? '')
        setTagline(data.tagline ?? '')
        setBio(data.bio ?? '')
        setModality(data.session_modality ?? '')
        setWhatsapp(data.whatsapp_number ?? '')
      })
      .catch(() => router.replace('/status'))
      .finally(() => setLoading(false))
  }, [router])

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      const r = await fetch('/api/companions/reapply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          gender,
          tagline,
          bio,
          session_modality: modality,
          whatsapp_number: whatsapp || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'Failed to submit.')
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/status'), 1500)
    } finally {
      setSaving(false)
    }
  }

  const S: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: '#07090f',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '32px 16px',
    },
    wrap: { width: '100%', maxWidth: 520 },
    logo: {
      fontFamily: 'var(--font-serif)',
      fontSize: 20,
      color: '#eeeef0',
      display: 'block',
      marginBottom: 32,
    },
    card: {
      background: '#0d1117',
      border: '1px solid #1c2333',
      borderRadius: 20,
      overflow: 'hidden',
      padding: '32px',
    },
    label: {
      fontSize: 11,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      color: '#6b7280',
      marginBottom: 6,
    },
    heading: {
      fontFamily: 'var(--font-serif)',
      fontSize: 26,
      color: '#eeeef0',
      lineHeight: 1.3,
      marginBottom: 8,
    },
    sub: { fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 28 },
    fieldLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' },
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
      minHeight: 80,
      marginBottom: 16,
    },
    pillRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 },
    btn: {
      width: '100%',
      background: '#e8607a',
      color: '#fff',
      border: 'none',
      borderRadius: 12,
      padding: '14px',
      fontSize: 15,
      fontWeight: 500,
      cursor: 'pointer',
      minHeight: 48,
      marginTop: 8,
    },
    err: {
      background: 'rgba(248,113,113,.08)',
      border: '1px solid rgba(248,113,113,.25)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      color: '#f87171',
      marginBottom: 16,
    },
  }

  function pill(val: string, current: string, onClick: () => void, label?: string) {
    const active = current === val
    return (
      <button
        key={val}
        onClick={onClick}
        style={{
          padding: '6px 14px',
          borderRadius: 999,
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all .15s',
          minHeight: 34,
          border: `1px solid ${active ? '#e8607a' : '#1c2333'}`,
          color: active ? '#e8607a' : '#6b7280',
          background: active ? 'rgba(232,96,122,.1)' : 'transparent',
        }}
      >
        {label ?? val.replace(/_/g, ' ')}
      </button>
    )
  }

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <span style={S.logo}>BlushBite</span>
          <div
            style={{
              height: 200,
              background: '#111620',
              borderRadius: 16,
              animation: 'shimmer 1.5s infinite',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <span style={S.logo}>BlushBite</span>
        <div style={S.card}>
          <div
            style={{
              height: 2,
              background: 'linear-gradient(90deg,transparent,#e8607a,transparent)',
              margin: '-32px -32px 32px',
            }}
          />
          <p style={S.label}>Update your application</p>
          <h1 style={S.heading}>
            Let&rsquo;s try <em style={{ color: '#e8607a' }}>again.</em>
          </h1>
          <p style={S.sub}>
            Update the details below and re-submit. We&rsquo;ll review your application again
            shortly.
          </p>

          {error && <div style={S.err}>{error}</div>}
          {success && (
            <div
              style={{
                ...S.err,
                color: '#22c55e',
                borderColor: 'rgba(34,197,94,.25)',
                background: 'rgba(34,197,94,.08)',
              }}
            >
              Submitted — redirecting…
            </div>
          )}

          <label style={S.fieldLabel}>City</label>
          <input
            style={S.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Amsterdam"
          />

          <label style={S.fieldLabel}>WhatsApp number (E.164 format)</label>
          <input
            style={S.input}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+31612345678"
            inputMode="tel"
          />

          <label style={S.fieldLabel}>Gender</label>
          <div style={S.pillRow}>
            {GENDERS.map((g) => pill(g, gender, () => setGender(g === gender ? '' : g)))}
          </div>

          <label style={S.fieldLabel}>Vibe headline</label>
          <input
            style={S.input}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="A short line about your vibe"
            maxLength={300}
          />

          <label style={S.fieldLabel}>About you</label>
          <textarea
            style={S.textarea}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell dreamers about yourself…"
            maxLength={2000}
          />

          <label style={S.fieldLabel}>Session type</label>
          <div style={S.pillRow}>
            {MODALITIES.map((m) =>
              pill(m.v, modality, () => setModality(m.v === modality ? '' : m.v), m.label)
            )}
          </div>

          <button
            style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Submitting…' : 'Re-submit application →'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="/status" style={{ fontSize: 13, color: '#4b5563', textDecoration: 'none' }}>
              ← Back to status
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
