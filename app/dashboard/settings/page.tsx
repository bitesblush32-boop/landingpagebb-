'use client'

import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

interface Settings {
  whatsapp_number: string | null
  instagram_handle: string | null
  website_url: string | null
  email: string
}

const S: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px', maxWidth: 720, margin: '0 auto' },
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
  section: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 15, fontWeight: 500, color: '#eeeef0', marginBottom: 18 },
  label: { fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' },
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
  saveBtn: {
    background: '#e8607a',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: 44,
  },
  success: {
    background: 'rgba(34,197,94,.08)',
    border: '1px solid rgba(34,197,94,.25)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#22c55e',
    marginBottom: 16,
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
  dangerSection: {
    background: '#0d1117',
    border: '1px solid rgba(248,113,113,.2)',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 20,
  },
  dangerBtn: {
    background: 'transparent',
    border: '1px solid rgba(248,113,113,.25)',
    color: '#f87171',
    borderRadius: 12,
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
    minHeight: 44,
  },
  shimmer: {
    background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 16,
    height: 180,
    animation: 'shimmer 1.5s infinite',
    marginBottom: 20,
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    whatsapp_number: '',
    instagram_handle: '',
    website_url: '',
    email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  // Push notifications
  const [pushState, setPushState] = useState<'unsupported' | 'off' | 'on' | 'busy'>('off')
  const [pushErr, setPushErr] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported')
      return
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushState(sub ? 'on' : 'off'))
      .catch(() => setPushState('off'))
  }, [])

  async function enablePush() {
    setPushErr('')
    setPushState('busy')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushErr('Notifications were blocked — enable them in your browser settings to turn this on.')
        setPushState('off')
        return
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        setPushErr('Push is not configured yet.')
        setPushState('off')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const json = sub.toJSON()
      const r = await fetch('/api/companions/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      if (!r.ok) throw new Error('Could not save subscription.')
      setPushState('on')
    } catch {
      setPushErr("That didn't work — try again in a moment.")
      setPushState('off')
    }
  }

  async function disablePush() {
    setPushErr('')
    setPushState('busy')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/companions/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setPushState('off')
    } catch {
      setPushErr("That didn't work — try again in a moment.")
      setPushState('on')
    }
  }

  // Password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')

  useEffect(() => {
    fetch('/api/companions/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setSettings(d)
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveContact() {
    setMsg('')
    setErr('')
    setSaving(true)
    try {
      const r = await fetch('/api/companions/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_number: settings.whatsapp_number || null,
          instagram_handle: settings.instagram_handle || null,
          website_url: settings.website_url || null,
        }),
      })
      const d = await r.json()
      if (!r.ok) {
        setErr(d.error ?? 'Save failed.')
        return
      }
      setMsg('Saved.')
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    setPwMsg('')
    setPwErr('')
    if (newPw.length < 8) {
      setPwErr('Password must be at least 8 characters.')
      return
    }
    if (newPw !== confirmPw) {
      setPwErr('Passwords do not match.')
      return
    }
    setPwSaving(true)
    try {
      const r = await fetch('/api/companions/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      })
      const d = await r.json()
      if (!r.ok) {
        setPwErr(d.error ?? 'Failed.')
        return
      }
      setPwMsg('Password updated.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setTimeout(() => setPwMsg(''), 3000)
    } finally {
      setPwSaving(false)
    }
  }

  if (loading)
    return (
      <div style={S.page}>
        <div style={S.shimmer} />
        <div style={S.shimmer} />
      </div>
    )

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 28 }}>
        <p style={S.eyebrow}>Account</p>
        <h1 style={S.title}>Settings</h1>
        <p style={S.sub}>Manage your contact details and account preferences</p>
      </div>

      {/* Account info (read-only) */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Account</div>
        <label style={S.label}>Email address</label>
        <div style={{ ...S.input, color: '#6b7280', marginBottom: 0 }}>{settings.email}</div>
        <p style={{ fontSize: 11, color: '#4b5563', marginTop: 6 }}>
          Your email cannot be changed. Contact support if needed.
        </p>
      </div>

      {/* Contact */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Contact & socials</div>
        {msg && <div style={S.success}>{msg}</div>}
        {err && <div style={S.err}>{err}</div>}
        <label style={S.label}>WhatsApp number (E.164 format)</label>
        <input
          style={S.input}
          value={settings.whatsapp_number ?? ''}
          onChange={(e) => setSettings((p) => ({ ...p, whatsapp_number: e.target.value }))}
          placeholder="+31612345678"
          inputMode="tel"
        />
        <label style={S.label}>Instagram handle</label>
        <input
          style={S.input}
          value={settings.instagram_handle ?? ''}
          onChange={(e) => setSettings((p) => ({ ...p, instagram_handle: e.target.value }))}
          placeholder="@yourhandle"
        />
        <label style={S.label}>Website URL</label>
        <input
          style={S.input}
          value={settings.website_url ?? ''}
          onChange={(e) => setSettings((p) => ({ ...p, website_url: e.target.value }))}
          placeholder="https://yoursite.com"
          inputMode="url"
        />
        <button
          style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1 }}
          onClick={saveContact}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Push notifications */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Notifications</div>
        {pushErr && <div style={S.err}>{pushErr}</div>}
        {pushState === 'unsupported' ? (
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Your browser doesn&apos;t support push notifications.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
              Get a quiet nudge on this device when something happens — a booking, a new badge, a
              sign-in. Never anything explicit on your lock screen.
            </p>
            <button
              style={{ ...S.saveBtn, opacity: pushState === 'busy' ? 0.6 : 1 }}
              onClick={pushState === 'on' ? disablePush : enablePush}
              disabled={pushState === 'busy'}
            >
              {pushState === 'busy' ? 'Working…' : pushState === 'on' ? 'Turn off notifications' : 'Turn on notifications'}
            </button>
          </>
        )}
      </div>

      {/* Password */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Password</div>
        {pwMsg && <div style={S.success}>{pwMsg}</div>}
        {pwErr && <div style={S.err}>{pwErr}</div>}
        <label style={S.label}>Current password</label>
        <input
          style={S.input}
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Enter current password"
          autoComplete="current-password"
        />
        <label style={S.label}>New password</label>
        <input
          style={S.input}
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <label style={S.label}>Confirm new password</label>
        <input
          style={S.input}
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Repeat new password"
          autoComplete="new-password"
        />
        <button
          style={{ ...S.saveBtn, opacity: pwSaving ? 0.6 : 1 }}
          onClick={changePassword}
          disabled={pwSaving}
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </button>
      </div>

      {/* Danger zone */}
      <div style={S.dangerSection}>
        <div style={{ ...S.sectionTitle, color: '#f87171' }}>Danger zone</div>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
          Deactivating your account hides your profile immediately. Your data is retained for 30
          days, after which it is permanently deleted. This cannot be undone.
        </p>
        <button
          style={S.dangerBtn}
          onClick={() => {
            if (
              confirm(
                'Are you sure you want to deactivate your account? Your profile will be hidden immediately.'
              )
            ) {
              fetch('/api/companions/settings', { method: 'DELETE' }).then(
                () => (window.location.href = '/login')
              )
            }
          }}
        >
          Deactivate account
        </button>
      </div>
    </div>
  )
}
