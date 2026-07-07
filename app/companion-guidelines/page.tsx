import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Companion Guidelines — BlushBite',
  description:
    'Content and conduct guidelines for companions on BlushBite. EU-hosted, GDPR compliant.',
  robots: { index: true, follow: true },
}

export default function CompanionGuidelinesPage() {
  return (
    <div style={{ background: '#07090f', color: '#eeeef0', minHeight: '100vh' }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: '1px solid #1c2333',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Image src="/logo.png" alt="BlushBite" width={130} height={46} style={{ height: 46, width: 'auto' }} />
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4b5563', marginBottom: 12 }}>
          Platform rules
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(28px,4vw,40px)',
            color: '#eeeef0',
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          Companion{' '}
          <em style={{ fontStyle: 'italic', color: '#e8607a' }}>guidelines.</em>
        </h1>
        <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 48 }}>
          Last updated: July 2026
        </p>

        {[
          {
            title: 'Who can join BlushBite',
            items: [
              'Adults 18 years of age or older — no exceptions.',
              'Anyone wishing to advertise their companionship and time.',
              'All genders and identities are welcome.',
              'Companions must be the person depicted in their photos and videos.',
            ],
          },
          {
            title: 'What content is allowed',
            items: [
              'Professional photos — tasteful, non-explicit. Semi-nude is permitted.',
              'Short personality videos — face, speaking to camera, max 60 seconds, non-nude.',
              'Literary stories — emotionally written, psychologically rich. Not pornographically explicit.',
              'Session offerings that describe your time, companionship, and presence.',
            ],
          },
          {
            title: 'What is NOT allowed',
            items: [
              'Explicit sexual content — genitalia or sexual acts — on any publicly accessible page.',
              'Photos or videos depicting anyone under 18 years of age.',
              'Misleading content — fake photos, catfishing, fabricated identity.',
              'Advertising services that are illegal in your jurisdiction or in the Netherlands.',
              'Multiple accounts for the same person.',
              'Content that violates another person\'s privacy or is published without their consent.',
              'Spam, harassment, or communications intended to manipulate or defraud dreamers.',
            ],
          },
          {
            title: 'Consequences of violations',
            items: [
              'First violation: content removed, written warning issued.',
              'Second violation: profile suspended pending review.',
              'Third violation: permanent ban and data deletion per GDPR.',
              'Severe violations (CSAM, illegal services): immediate permanent ban and report to authorities.',
            ],
          },
          {
            title: 'How to appeal',
            items: [
              'If you believe an action was taken in error, contact us at support@blushbite.live.',
              'Appeals are reviewed within 5 business days.',
              'Include your account alias and a brief explanation.',
            ],
          },
          {
            title: 'Your rights on this platform',
            items: [
              'You retain full ownership of all content you upload.',
              'You may delete your account and all associated data at any time via Settings.',
              'Your real name and private contact details are never shown to dreamers.',
              'Your data is processed under Netherlands law and GDPR — see our Privacy Policy.',
            ],
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 40 }}>
            <div
              style={{
                width: 28,
                height: 2,
                background: '#e8607a',
                borderRadius: 2,
                marginBottom: 12,
              }}
            />
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 600,
                color: '#eeeef0',
                marginBottom: 14,
              }}
            >
              {section.title}
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {section.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: '#9ca3af',
                    paddingBottom: 8,
                  }}
                >
                  <span style={{ color: '#c9a96e', flexShrink: 0, marginTop: 3 }}>✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Footer nav */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid #1c2333' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            {[
              ['Terms & Conditions', '/terms'],
              ['Privacy Policy', '/privacy'],
              ['Contact', 'mailto:hello@blushbite.live'],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: 12, color: '#4b5563', textDecoration: 'none' }}>
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#1f2937', marginTop: 16 }}>
            &copy; BlushBite · EU-hosted · GDPR compliant · Netherlands
          </p>
        </div>
      </div>
    </div>
  )
}
