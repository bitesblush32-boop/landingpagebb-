'use client'

export default function YourPlanPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07090f',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 560, width: '100%', marginBottom: 40 }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#e8607a',
            marginBottom: 8,
          } as React.CSSProperties}
        >
          Your plan
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 400,
            color: '#eeeef0',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Free for your first{' '}
          <em style={{ fontStyle: 'italic', color: '#e8607a' }}>three months.</em>
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 12, lineHeight: 1.6 }}>
          We&apos;re giving every companion full access to BlushBite at no charge while we grow together.
          No card required now. We&apos;ll remind you before anything changes.
        </p>
      </div>

      {/* Billing statement */}
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#0d1117',
          border: '1px solid #1c2333',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1c2333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: '#4b5563',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 4,
              } as React.CSSProperties}
            >
              Invoice preview
            </div>
            <div style={{ fontSize: 14, color: '#9ca3af' }}>Standard Plan · Monthly</div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#22c55e',
              background: 'rgba(34,197,94,.08)',
              border: '1px solid rgba(34,197,94,.2)',
              borderRadius: 8,
              padding: '4px 10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            } as React.CSSProperties}
          >
            Launch offer active
          </div>
        </div>

        {/* Line items */}
        <div style={{ padding: '8px 0' }}>
          {/* Standard plan row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '16px 24px',
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: '#eeeef0', marginBottom: 4 }}>Standard Plan</div>
              <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
                Full profile · Booking management · Analytics
                <br />
                Stories · Photos · Videos · Priority support
              </div>
            </div>
            <div
              style={{ fontSize: 14, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 24, paddingTop: 2 }}
            >
              €29 / mo
            </div>
          </div>

          <div style={{ height: 1, background: '#1c2333', margin: '0 24px' }} />

          {/* Discount row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, color: '#c9a96e' }}>BlushBite Launch Discount</div>
              <span
                style={{
                  fontSize: 10,
                  color: '#c9a96e',
                  background: 'rgba(201,169,110,.08)',
                  border: '1px solid rgba(201,169,110,.2)',
                  borderRadius: 6,
                  padding: '2px 8px',
                  whiteSpace: 'nowrap',
                }}
              >
                first 3 months
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#c9a96e', whiteSpace: 'nowrap' }}>−€29 / mo</div>
          </div>

          <div style={{ height: 1, background: '#1c2333', margin: '0 24px' }} />

          {/* Total row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#eeeef0' }}>Total due today</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>€0 / mo</div>
          </div>
        </div>

        {/* Footer note */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #1c2333',
            background: 'rgba(255,255,255,.015)',
          }}
        >
          <p style={{ fontSize: 12, color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
            Your first 3 months are completely free. Standard pricing (€29/month) applies from month 4 onwards.
            We&apos;ll send you a reminder email 7 days before any charge begins. No surprises.
          </p>
        </div>
      </div>

      {/* What's included */}
      <div style={{ maxWidth: 560, width: '100%', marginTop: 40 }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#4b5563',
            marginBottom: 20,
          } as React.CSSProperties}
        >
          Everything included during your free period
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {[
            ['◉', 'Full profile builder'],
            ['◻', 'Up to 8 photos'],
            ['▷', 'Video uploads'],
            ['✦', 'Unlimited stories'],
            ['◷', 'Booking management'],
            ['◈', 'Analytics dashboard'],
            ['⊙', 'Account settings'],
            ['⊕', 'Priority support'],
          ].map(([icon, label]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: '#0d1117',
                border: '1px solid #1c2333',
                borderRadius: 10,
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              <span style={{ color: '#e8607a', fontSize: 12 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          marginTop: 40,
          paddingTop: 24,
          borderTop: '1px solid #1c2333',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 28px',
        }}
      >
        {[
          'EU-hosted · GDPR compliant',
          'No card required for launch period',
          'Questions? support@blushbite.live',
        ].map((t) => (
          <span key={t} style={{ fontSize: 11, color: '#374151' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
