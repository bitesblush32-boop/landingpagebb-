'use client'

import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('bb_cookie_ok')) {
        setShow(true)
      }
    } catch {
      setShow(true)
    }
  }, [])

  if (!show) return null

  function dismiss() {
    try {
      localStorage.setItem('bb_cookie_ok', '1')
    } catch {
      // ignore
    }
    setShow(false)
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 8000,
        background: '#0d1117',
        borderTop: '1px solid #1c2333',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <p
        style={{
          fontSize: 12,
          color: '#6b7280',
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
          minWidth: 200,
        }}
      >
        We use essential cookies for login and age verification only — no tracking, no advertising.{' '}
        <a
          href="/privacy"
          style={{ color: '#9ca3af', textDecoration: 'underline' }}
        >
          Privacy Policy
        </a>
      </p>
      <button
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: '1px solid #1c2333',
          borderRadius: 8,
          padding: '7px 18px',
          fontSize: 12,
          color: '#9ca3af',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-sans)',
          flexShrink: 0,
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#374151'
          e.currentTarget.style.color = '#eeeef0'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1c2333'
          e.currentTarget.style.color = '#9ca3af'
        }}
      >
        Got it
      </button>
    </div>
  )
}
