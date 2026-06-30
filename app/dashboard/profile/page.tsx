'use client'

import { useState, useEffect } from 'react'

interface Profile {
  display_name: string | null
  tagline: string | null
  bio: string | null
  city: string | null
  country: string | null
  age: number | null
  height_cm: number | null
  body_type: string | null
  hair_color: string | null
  eye_color: string | null
  ethnicity: string | null
  languages: string[]
  session_modality: string | null
  whatsapp_number: string | null
  instagram_handle: string | null
  website_url: string | null
  hourly_rate: number | null
  currency: string | null
  is_live: boolean
  vibe_tags: string[]
}

// Pill option helpers
const BODY_TYPES = ['slim', 'athletic', 'curvy', 'plus_size', 'average', 'prefer_not_to_say']
const HAIR_COLORS = ['blonde', 'brunette', 'black', 'red', 'auburn', 'grey', 'white', 'other']
const EYE_COLORS = ['blue', 'green', 'brown', 'hazel', 'grey', 'other']
const MODALITIES = [{ v: 'in_person', l: 'In Person' }, { v: 'online', l: 'Online' }, { v: 'both', l: 'Both' }]
const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'SEK', 'DKK', 'NOK', 'CAD', 'AUD']
const LANGUAGES = ['English', 'Dutch', 'German', 'French', 'Spanish', 'Italian', 'Portuguese', 'Polish', 'Russian', 'Arabic', 'Japanese', 'Korean', 'Mandarin', 'Swedish', 'Danish', 'Norwegian', 'Finnish', 'Greek', 'Turkish', 'Hindi']
const VIBE_TAGS = ['intellectual', 'playful', 'mysterious', 'nurturing', 'adventurous', 'dominant', 'submissive', 'sensual', 'artistic', 'spiritual', 'witty', 'empathetic', 'confident', 'shy', 'elegant', 'rebellious']

const SECTIONS = ['Identity', 'Vibe', 'Look', 'Languages', 'Sessions', 'Location', 'Connect', 'Rates']

const S = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  eyebrow: { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6b7280', marginBottom: 6 },
  title: { fontFamily: 'var(--font-serif)', fontSize: 28, color: '#eeeef0', lineHeight: 1.2, marginBottom: 6 },
  sub: { fontSize: 14, color: '#6b7280' },
  tabs: { display: 'flex', gap: 4, overflowX: 'auto' as const, marginBottom: 24, paddingBottom: 4 },
  tab: (active: boolean): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: `1px solid ${active ? '#e8607a' : '#1c2333'}`, background: active ? 'rgba(232,96,122,.1)' : 'transparent', color: active ? '#e8607a' : '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }),
  card: { background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, padding: '28px' },
  sectionTitle: { fontFamily: 'var(--font-serif)', fontSize: 20, color: '#eeeef0', marginBottom: 20 },
  label: { fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#eeeef0', outline: 'none', marginBottom: 16 },
  select: { width: '100%', background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#eeeef0', outline: 'none', marginBottom: 16, cursor: 'pointer', appearance: 'none' as const },
  textarea: { width: '100%', background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#eeeef0', outline: 'none', resize: 'vertical' as const, minHeight: 100, marginBottom: 16 },
  pillRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  saveBtn: { background: '#e8607a', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer', minHeight: 44 },
  success: { background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#22c55e', marginBottom: 16 },
  err: { background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 },
  shimmer: { background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)', backgroundSize: '200% 100%', borderRadius: 16, animation: 'shimmer 1.5s infinite', height: 400 },
}

function Pill({ val, current, label, onClick }: { val: string; current: string | string[]; label: string; onClick: () => void }) {
  const active = Array.isArray(current) ? current.includes(val) : current === val
  return (
    <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', minHeight: 34, border: `1px solid ${active ? '#e8607a' : '#1c2333'}`, color: active ? '#e8607a' : '#6b7280', background: active ? 'rgba(232,96,122,.1)' : 'transparent' }}>
      {label}
    </button>
  )
}

function fmt(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }

const DEFAULT: Profile = {
  display_name: '', tagline: '', bio: '', city: '', country: '', age: null,
  height_cm: null, body_type: '', hair_color: '', eye_color: '', ethnicity: '',
  languages: [], session_modality: '', whatsapp_number: '', instagram_handle: '',
  website_url: '', hourly_rate: null, currency: 'EUR', is_live: false, vibe_tags: [],
}

export default function ProfilePage() {
  const [active, setActive] = useState(0)
  const [profile, setProfile] = useState<Profile>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/companions/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProfile({ ...DEFAULT, ...d }) })
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof Profile>(key: K, val: Profile[K]) {
    setProfile(p => ({ ...p, [key]: val }))
  }

  function toggleArr(key: 'languages' | 'vibe_tags', val: string) {
    setProfile(p => {
      const arr = p[key] as string[]
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  async function save() {
    setMsg(''); setErr(''); setSaving(true)
    try {
      const r = await fetch('/api/companions/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error ?? 'Save failed.'); return }
      setMsg('Profile saved.')
      setTimeout(() => setMsg(''), 3000)
    } finally { setSaving(false) }
  }

  if (loading) return <div style={{ ...S.page }}><div style={S.shimmer} /></div>

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 24 }}>
        <p style={S.eyebrow}>Profile builder</p>
        <h1 style={S.title}>Edit profile</h1>
        <p style={S.sub}>Complete all sections to maximise your profile completeness score.</p>
      </div>

      {/* Section tabs */}
      <div style={S.tabs}>
        {SECTIONS.map((s, i) => (
          <button key={s} style={S.tab(active === i)} onClick={() => setActive(i)}>{s}</button>
        ))}
      </div>

      {msg && <div style={S.success}>{msg}</div>}
      {err && <div style={S.err}>{err}</div>}

      <div style={S.card}>

        {/* 0 — Identity */}
        {active === 0 && (
          <>
            <div style={S.sectionTitle}>Identity</div>
            <label style={S.label}>Display name</label>
            <input style={S.input} value={profile.display_name ?? ''} onChange={e => set('display_name', e.target.value)} placeholder="The name dreamers know you by" maxLength={60} />

            <div style={S.grid2}>
              <div>
                <label style={S.label}>Age</label>
                <input style={S.input} type="number" min={18} max={99} value={profile.age ?? ''} onChange={e => set('age', e.target.value ? parseInt(e.target.value) : null)} placeholder="Age" />
              </div>
              <div>
                <label style={S.label}>Ethnicity (optional)</label>
                <input style={S.input} value={profile.ethnicity ?? ''} onChange={e => set('ethnicity', e.target.value)} placeholder="How you identify" />
              </div>
            </div>
          </>
        )}

        {/* 1 — Vibe */}
        {active === 1 && (
          <>
            <div style={S.sectionTitle}>Vibe</div>
            <label style={S.label}>Vibe headline</label>
            <input style={S.input} value={profile.tagline ?? ''} onChange={e => set('tagline', e.target.value)} placeholder="A short line about your energy…" maxLength={300} />

            <label style={S.label}>About you</label>
            <textarea style={{ ...S.textarea, minHeight: 160 }} value={profile.bio ?? ''} onChange={e => set('bio', e.target.value)} placeholder="Tell dreamers about yourself — how you move, what you love, what a session with you feels like…" maxLength={2000} />

            <label style={S.label}>Vibe tags</label>
            <div style={S.pillRow}>
              {VIBE_TAGS.map(t => <Pill key={t} val={t} current={profile.vibe_tags} label={fmt(t)} onClick={() => toggleArr('vibe_tags', t)} />)}
            </div>
          </>
        )}

        {/* 2 — Look */}
        {active === 2 && (
          <>
            <div style={S.sectionTitle}>Look</div>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Height (cm)</label>
                <input style={S.input} type="number" min={140} max={220} value={profile.height_cm ?? ''} onChange={e => set('height_cm', e.target.value ? parseInt(e.target.value) : null)} placeholder="170" />
              </div>
            </div>
            <label style={S.label}>Body type</label>
            <div style={S.pillRow}>
              {BODY_TYPES.map(v => <Pill key={v} val={v} current={profile.body_type ?? ''} label={fmt(v)} onClick={() => set('body_type', v === profile.body_type ? '' : v)} />)}
            </div>
            <label style={S.label}>Hair colour</label>
            <div style={S.pillRow}>
              {HAIR_COLORS.map(v => <Pill key={v} val={v} current={profile.hair_color ?? ''} label={fmt(v)} onClick={() => set('hair_color', v === profile.hair_color ? '' : v)} />)}
            </div>
            <label style={S.label}>Eye colour</label>
            <div style={S.pillRow}>
              {EYE_COLORS.map(v => <Pill key={v} val={v} current={profile.eye_color ?? ''} label={fmt(v)} onClick={() => set('eye_color', v === profile.eye_color ? '' : v)} />)}
            </div>
          </>
        )}

        {/* 3 — Languages */}
        {active === 3 && (
          <>
            <div style={S.sectionTitle}>Languages</div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>Select all languages you can conduct sessions in.</p>
            <div style={S.pillRow}>
              {LANGUAGES.map(l => <Pill key={l} val={l} current={profile.languages} label={l} onClick={() => toggleArr('languages', l)} />)}
            </div>
          </>
        )}

        {/* 4 — Sessions */}
        {active === 4 && (
          <>
            <div style={S.sectionTitle}>Sessions</div>
            <label style={S.label}>Session type</label>
            <div style={S.pillRow}>
              {MODALITIES.map(m => <Pill key={m.v} val={m.v} current={profile.session_modality ?? ''} label={m.l} onClick={() => set('session_modality', m.v === profile.session_modality ? '' : m.v)} />)}
            </div>
          </>
        )}

        {/* 5 — Location */}
        {active === 5 && (
          <>
            <div style={S.sectionTitle}>Location</div>
            <label style={S.label}>City</label>
            <input style={S.input} value={profile.city ?? ''} onChange={e => set('city', e.target.value)} placeholder="Amsterdam" inputMode="text" autoCapitalize="words" />
            <label style={S.label}>Country</label>
            <input style={S.input} value={profile.country ?? ''} onChange={e => set('country', e.target.value)} placeholder="Netherlands" inputMode="text" autoCapitalize="words" />
          </>
        )}

        {/* 6 — Connect */}
        {active === 6 && (
          <>
            <div style={S.sectionTitle}>Connect</div>
            <label style={S.label}>WhatsApp number (E.164 format)</label>
            <input style={S.input} value={profile.whatsapp_number ?? ''} onChange={e => set('whatsapp_number', e.target.value)} placeholder="+31612345678" inputMode="tel" />
            <label style={S.label}>Instagram handle (optional)</label>
            <input style={S.input} value={profile.instagram_handle ?? ''} onChange={e => set('instagram_handle', e.target.value)} placeholder="@yourhandle" />
            <label style={S.label}>Website URL (optional)</label>
            <input style={S.input} value={profile.website_url ?? ''} onChange={e => set('website_url', e.target.value)} placeholder="https://yoursite.com" inputMode="url" />
          </>
        )}

        {/* 7 — Rates */}
        {active === 7 && (
          <>
            <div style={S.sectionTitle}>Rates</div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>Set your base hourly rate. You can define individual session cards with custom pricing from your session card builder.</p>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Hourly rate</label>
                <input style={S.input} type="number" min={0} value={profile.hourly_rate ?? ''} onChange={e => set('hourly_rate', e.target.value ? parseInt(e.target.value) : null)} placeholder="150" />
              </div>
              <div>
                <label style={S.label}>Currency</label>
                <select style={S.select} value={profile.currency ?? 'EUR'} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 24, borderTop: '1px solid #1c2333' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {active > 0 && (
              <button style={{ background: 'transparent', border: '1px solid #1c2333', color: '#6b7280', borderRadius: 12, padding: '11px 20px', cursor: 'pointer', fontSize: 14 }} onClick={() => setActive(a => a - 1)}>
                ← Previous
              </button>
            )}
            {active < SECTIONS.length - 1 && (
              <button style={{ background: 'transparent', border: '1px solid #1c2333', color: '#9ca3af', borderRadius: 12, padding: '11px 20px', cursor: 'pointer', fontSize: 14 }} onClick={() => setActive(a => a + 1)}>
                Next →
              </button>
            )}
          </div>
          <button style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
