'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [key, setKey]       = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })

      if (!res.ok) {
        setError('Invalid key. Try again.')
        setLoading(false)
        return
      }

      router.push('/admin/ads')
    } catch {
      setError('Network error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07090f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#0d1117',
          border: '1px solid #1c2333',
          borderRadius: 12,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 380,
        }}
      >
        <h1 style={{ color: '#eeeef0', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
          Admin Access
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>
          BlushBite internal panel
        </p>

        <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>
          Admin Key
        </label>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="Enter your admin key"
          required
          style={{
            width: '100%',
            background: '#111620',
            border: '1px solid #1c2333',
            borderRadius: 8,
            color: '#eeeef0',
            fontSize: 15,
            padding: '10px 14px',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 16,
          }}
        />

        {error && (
          <p style={{ color: '#e8607a', fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !key}
          style={{
            width: '100%',
            background: loading || !key ? '#1c2333' : '#e8607a',
            color: loading || !key ? '#4b5563' : '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            padding: '12px',
            cursor: loading || !key ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Verifying…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
