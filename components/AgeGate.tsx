'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export function AgeGate() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('bb_age_confirmed')) {
        setShow(true)
      }
    } catch {
      // localStorage unavailable (private mode edge case) — show gate
      setShow(true)
    }
  }, [])

  if (!show) return null

  function confirm() {
    try {
      localStorage.setItem('bb_age_confirmed', '1')
      document.cookie = 'bb_age=1; max-age=31536000; path=/; SameSite=Lax'
    } catch {
      // ignore
    }
    setShow(false)
  }

  function exit() {
    window.location.href = 'https://www.google.com'
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7,9,15,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(232,96,122,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#0d1117',
          border: '1px solid #1c2333',
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Rose top accent line */}
        <div
          style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, #e8607a 40%, #c9a96e 60%, transparent)',
          }}
        />

        <div style={{ padding: '40px 36px 36px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <Image
              src="/logo.png"
              alt="BlushBite"
              width={160}
              height={56}
              style={{ height: 56, width: 'auto' }}
              priority
            />
          </div>

          {/* Lock icon */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(232,96,122,0.08)',
                border: '1px solid rgba(232,96,122,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              ✦
            </div>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 600,
              color: '#eeeef0',
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: 12,
            }}
          >
            You&rsquo;re entering a{' '}
            <em style={{ fontStyle: 'italic', color: '#e8607a' }}>private world.</em>
          </h1>

          {/* Body */}
          <p
            style={{
              fontSize: 13,
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: 1.75,
              marginBottom: 8,
            }}
          >
            This website contains adult content intended for mature audiences only.
          </p>
          <p
            style={{
              fontSize: 13,
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: 1.75,
              marginBottom: 28,
            }}
          >
            By entering, you confirm you are{' '}
            <span style={{ color: '#9ca3af', fontWeight: 500 }}>at least 18 years of age</span>{' '}
            and consent to viewing adult content in accordance with the laws of your jurisdiction.
          </p>

          {/* Divider */}
          <div
            style={{ height: 1, background: '#1c2333', marginBottom: 28 }}
          />

          {/* Enter button */}
          <button
            onClick={confirm}
            style={{
              display: 'block',
              width: '100%',
              background: '#e8607a',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '15px 24px',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: 10,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.01em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#c4485e')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#e8607a')}
          >
            I am 18 or older — Enter
          </button>

          {/* Exit button */}
          <button
            onClick={exit}
            style={{
              display: 'block',
              width: '100%',
              background: 'transparent',
              color: '#4b5563',
              border: '1px solid #1c2333',
              borderRadius: 12,
              padding: '13px 24px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#374151'
              e.currentTarget.style.color = '#6b7280'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1c2333'
              e.currentTarget.style.color = '#4b5563'
            }}
          >
            Exit
          </button>

          {/* Legal footnote */}
          <p
            style={{
              fontSize: 11,
              color: '#374151',
              textAlign: 'center',
              lineHeight: 1.6,
              marginTop: 20,
            }}
          >
            By entering you also agree to our{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4b5563', textDecoration: 'underline' }}
            >
              Terms &amp; Conditions
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4b5563', textDecoration: 'underline' }}
            >
              Privacy Policy
            </a>
            . BlushBite is operated under Netherlands law.
          </p>
        </div>
      </div>
    </div>
  )
}
