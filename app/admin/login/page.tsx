'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLoginPage() {
  const router = useRouter()
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Invalid key'); return }
      router.push('/admin/ads')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#07090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Image src="/logo.png" alt="BlushBite" width={160} height={56} style={{ height: 56, width: 'auto', display: 'inline-block' }} />
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 12 }}>Admin — Ads & Boosts</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, padding: 24 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
            Admin key
          </label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Enter CRON_SECRET"
            required
            style={{
              width: '100%', background: '#111620', border: '1px solid #1c2333',
              borderRadius: 8, padding: '12px 14px', color: '#eeeef0', fontSize: 14,
              marginBottom: 16, boxSizing: 'border-box', outline: 'none',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || !key}
            style={{
              width: '100%', background: '#e8607a', color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              transform: 'translateZ(0)',
            }}
          >
            {loading ? 'Checking…' : 'Enter admin panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
