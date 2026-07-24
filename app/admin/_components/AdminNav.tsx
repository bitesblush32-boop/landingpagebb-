'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminNav() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: 56,
      background: '#0d1117',
      borderBottom: '1px solid #1c2333',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ fontWeight: 700, color: '#e8607a', fontSize: 16 }}>
          BlushBite Admin
        </span>
        <Link
          href="/admin/ads"
          style={{ color: '#eeeef0', fontSize: 14, textDecoration: 'none' }}
        >
          Ads &amp; Boosts
        </Link>
      </div>
      <button
        onClick={handleLogout}
        style={{
          background: 'transparent',
          border: '1px solid #1c2333',
          borderRadius: 6,
          color: '#9ca3af',
          fontSize: 13,
          padding: '4px 12px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </nav>
  )
}
