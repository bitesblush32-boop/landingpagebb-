import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'BlushBite Privacy Policy — how we collect, use, and protect your personal data. GDPR compliant. Netherlands.',
  robots: { index: true, follow: true },
}

const S = {
  page: {
    minHeight: '100vh',
    background: '#07090f',
    color: '#eeeef0',
    fontFamily: 'var(--font-sans)',
  } as React.CSSProperties,
  header: {
    borderBottom: '1px solid #1c2333',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 900,
    margin: '0 auto',
    width: '100%',
  } as React.CSSProperties,
  wrap: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '48px 24px 80px',
  } as React.CSSProperties,
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: '#6b7280',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 34,
    fontWeight: 600,
    color: '#eeeef0',
    lineHeight: 1.25,
    marginBottom: 6,
  } as React.CSSProperties,
  updated: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 40,
    display: 'block',
  } as React.CSSProperties,
  divider: {
    height: 1,
    background: '#1c2333',
    margin: '36px 0',
  } as React.CSSProperties,
  h2: {
    fontFamily: 'var(--font-serif)',
    fontSize: 18,
    fontWeight: 600,
    color: '#eeeef0',
    marginBottom: 12,
    marginTop: 36,
  } as React.CSSProperties,
  p: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 1.85,
    marginBottom: 16,
  } as React.CSSProperties,
  ul: {
    paddingLeft: 20,
    margin: '0 0 16px',
  } as React.CSSProperties,
  li: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 1.85,
    marginBottom: 6,
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: 24,
    fontSize: 13,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '10px 14px',
    background: '#0d1117',
    color: '#6b7280',
    fontWeight: 500,
    borderBottom: '1px solid #1c2333',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  } as React.CSSProperties,
  td: {
    padding: '10px 14px',
    color: '#9ca3af',
    borderBottom: '1px solid #111620',
    lineHeight: 1.6,
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  highlight: {
    background: 'rgba(201,169,110,0.05)',
    border: '1px solid rgba(201,169,110,0.15)',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 24,
  } as React.CSSProperties,
  highlightText: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 1.75,
    margin: 0,
  } as React.CSSProperties,
}

export default function PrivacyPage() {
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1c2333' }}>
        <div style={S.header}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Image src="/logo.png" alt="BlushBite" width={130} height={44} style={{ height: 44, width: 'auto' }} />
          </Link>
          <Link href="/" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>
            ← Back
          </Link>
        </div>
      </div>

      <div style={S.wrap}>
        <p style={S.eyebrow}>Legal</p>
        <h1 style={S.title}>
          Privacy{' '}
          <em style={{ fontStyle: 'italic', color: '#c9a96e' }}>Policy</em>
        </h1>
        <span style={S.updated}>Last updated: July 2026 &nbsp;·&nbsp; GDPR compliant &nbsp;·&nbsp; Data controller: BlushBite, Netherlands</span>

        <div style={S.highlight}>
          <p style={S.highlightText}>
            <strong style={{ color: '#eeeef0' }}>Summary:</strong> We collect only what we need to operate the platform. We do not sell your data. We do not use advertising trackers. We store your data in the EU. You can request deletion at any time.
          </p>
        </div>

        <div style={S.divider} />

        {/* Section 1 */}
        <h2 style={S.h2}>1. Who We Are (Data Controller)</h2>
        <p style={S.p}>
          BlushBite operates the companion platform at blushbite.live. For the purposes of the General Data Protection Regulation (GDPR) (EU) 2016/679, BlushBite is the data controller responsible for your personal data.
        </p>
        <p style={S.p}>
          Data protection contact:{' '}
          <a href="mailto:privacy@blushbite.live" style={{ color: '#c9a96e', textDecoration: 'none' }}>privacy@blushbite.live</a>
        </p>

        {/* Section 2 */}
        <h2 style={S.h2}>2. What Personal Data We Collect</h2>
        <p style={S.p}>We collect the following categories of personal data:</p>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Category</th>
              <th style={S.th}>Data points</th>
              <th style={S.th}>Required?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}><strong style={{ color: '#eeeef0' }}>Account</strong></td>
              <td style={S.td}>Display name, email address</td>
              <td style={S.td}>Required</td>
            </tr>
            <tr>
              <td style={S.td}><strong style={{ color: '#eeeef0' }}>Identity</strong></td>
              <td style={S.td}>Full legal name, date of birth, country</td>
              <td style={S.td}>Required for compliance</td>
            </tr>
            <tr>
              <td style={S.td}><strong style={{ color: '#eeeef0' }}>Profile</strong></td>
              <td style={S.td}>Bio, tagline, city, gender, physical attributes, session preferences, hourly rate</td>
              <td style={S.td}>Optional</td>
            </tr>
            <tr>
              <td style={S.td}><strong style={{ color: '#eeeef0' }}>Contact</strong></td>
              <td style={S.td}>WhatsApp number, Instagram handle, website</td>
              <td style={S.td}>Optional</td>
            </tr>
            <tr>
              <td style={S.td}><strong style={{ color: '#eeeef0' }}>Media</strong></td>
              <td style={S.td}>Profile photos, videos</td>
              <td style={S.td}>Optional</td>
            </tr>
            <tr>
              <td style={S.td}><strong style={{ color: '#eeeef0' }}>Financial</strong></td>
              <td style={S.td}>Subscription status, payment reference (not card details — stored by payment processor)</td>
              <td style={S.td}>If subscribed</td>
            </tr>
            <tr>
              <td style={S.td}><strong style={{ color: '#eeeef0' }}>Technical</strong></td>
              <td style={S.td}>IP address, browser type, session cookie</td>
              <td style={S.td}>Automatic</td>
            </tr>
          </tbody>
        </table>

        <p style={S.p}>
          We do not collect sensitive special-category data (as defined under GDPR Article 9) beyond what you voluntarily provide in your profile. Any gender or physical identity information you add to your profile is provided entirely at your discretion.
        </p>

        {/* Section 3 */}
        <h2 style={S.h2}>3. How We Use Your Data</h2>
        <p style={S.p}>We process your personal data on the following legal bases:</p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Contract (Article 6(1)(b)):</strong> To create and maintain your companion account, deliver platform features, and process subscription payments.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Legitimate interests (Article 6(1)(f)):</strong> To detect and prevent fraud, abuse, and policy violations; to operate and improve the platform.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Legal obligation (Article 6(1)(c)):</strong> To verify that users are at least 18 years of age; to comply with applicable Dutch and EU law.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Consent (Article 6(1)(a)):</strong> To send you optional marketing communications. You may withdraw consent at any time.</li>
        </ul>

        {/* Section 4 */}
        <h2 style={S.h2}>4. Cookies and Tracking</h2>
        <p style={S.p}>We use the following cookies:</p>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Cookie</th>
              <th style={S.th}>Purpose</th>
              <th style={S.th}>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}><code style={{ color: '#c9a96e', fontSize: 12 }}>bb_session</code> / <code style={{ color: '#c9a96e', fontSize: 12 }}>__Host-bb_session</code></td>
              <td style={S.td}>Authentication — keeps you logged in</td>
              <td style={S.td}>7 days</td>
            </tr>
            <tr>
              <td style={S.td}><code style={{ color: '#c9a96e', fontSize: 12 }}>bb_age</code></td>
              <td style={S.td}>Records that you have confirmed you are 18+</td>
              <td style={S.td}>1 year</td>
            </tr>
            <tr>
              <td style={S.td}><code style={{ color: '#c9a96e', fontSize: 12 }}>bb_cookie_ok</code></td>
              <td style={S.td}>Records that you have acknowledged our cookie notice</td>
              <td style={S.td}>Session / localStorage</td>
            </tr>
          </tbody>
        </table>

        <p style={S.p}>
          We do not use advertising cookies, cross-site tracking cookies, or any third-party analytics that identify you personally. We do not use Google Analytics or Meta Pixel.
        </p>

        {/* Section 5 */}
        <h2 style={S.h2}>5. Data Storage and Security</h2>
        <p style={S.p}>
          All personal data is stored on servers located within the European Union. We use the following sub-processors:
        </p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Railway</strong> (EU region) — application server and PostgreSQL database hosting</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Cloudinary</strong> (EU region) — photo and video storage</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Resend</strong> — transactional email delivery (OTP codes, notifications)</li>
        </ul>
        <p style={S.p}>
          We implement technical and organisational security measures appropriate to the risk, including encrypted connections (HTTPS/TLS), HTTP-only session cookies, hashed passwords, and access controls limiting who can view personal data.
        </p>
        <p style={S.p}>
          We cannot guarantee absolute security of data transmitted over the internet. You transmit data to us at your own risk.
        </p>

        {/* Section 6 */}
        <h2 style={S.h2}>6. Data Retention</h2>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Active accounts:</strong> Personal data retained while your account is active.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Deleted accounts:</strong> Personal data deleted within 30 days of a verified account deletion request, except where retention is required by law.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Financial records:</strong> Retained for 7 years in accordance with Dutch tax and accounting law (Burgerlijk Wetboek).</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Moderation records:</strong> Records of policy violations and account actions retained for up to 3 years for platform safety purposes.</li>
        </ul>

        {/* Section 7 */}
        <h2 style={S.h2}>7. Your Rights Under GDPR</h2>
        <p style={S.p}>As a data subject under the GDPR, you have the following rights:</p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Right of access (Article 15):</strong> You may request a copy of the personal data we hold about you.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Right to rectification (Article 16):</strong> You may correct inaccurate or incomplete data at any time via your account settings.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Right to erasure (Article 17):</strong> You may request deletion of your account and personal data, subject to legal retention requirements.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Right to restriction (Article 18):</strong> You may request that we restrict processing of your data in certain circumstances.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Right to portability (Article 20):</strong> You may request your data in a structured, machine-readable format.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Right to object (Article 21):</strong> You may object to processing based on legitimate interests at any time.</li>
          <li style={S.li}><strong style={{ color: '#eeeef0' }}>Right to withdraw consent:</strong> Where processing is based on consent, you may withdraw it at any time without affecting prior processing.</li>
        </ul>
        <p style={S.p}>
          To exercise any of these rights, email:{' '}
          <a href="mailto:privacy@blushbite.live" style={{ color: '#c9a96e', textDecoration: 'none' }}>privacy@blushbite.live</a>
          . We will respond within 30 days. You also have the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens) at{' '}
          <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#c9a96e', textDecoration: 'none' }}>autoriteitpersoonsgegevens.nl</a>.
        </p>

        {/* Section 8 */}
        <h2 style={S.h2}>8. International Transfers</h2>
        <p style={S.p}>
          We store and process your data within the European Economic Area (EEA). Some of our sub-processors (such as Resend for email delivery) may process data outside the EEA. Where this occurs, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission.
        </p>

        {/* Section 9 */}
        <h2 style={S.h2}>9. Children&rsquo;s Privacy</h2>
        <p style={S.p}>
          This website is strictly for adults aged 18 and over. We do not knowingly collect personal data from anyone under 18. If we become aware that a person under 18 has provided us with personal data, we will delete that data immediately and terminate the associated account.
        </p>
        <p style={S.p}>
          If you believe a person under 18 has created an account, please contact us immediately at:{' '}
          <a href="mailto:safety@blushbite.live" style={{ color: '#c9a96e', textDecoration: 'none' }}>safety@blushbite.live</a>
        </p>

        {/* Section 10 */}
        <h2 style={S.h2}>10. Changes to This Policy</h2>
        <p style={S.p}>
          We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will indicate the date of the most recent revision at the top of this page. If changes are material, we will notify you by email or by a notice within the platform.
        </p>
        <p style={S.p}>
          Your continued use of the platform after any updates constitutes your acceptance of the revised Privacy Policy.
        </p>

        {/* Section 11 */}
        <h2 style={S.h2}>11. Contact</h2>
        <p style={S.p}>
          For any privacy-related queries:{' '}
          <a href="mailto:privacy@blushbite.live" style={{ color: '#c9a96e', textDecoration: 'none' }}>privacy@blushbite.live</a>
        </p>
        <p style={S.p}>
          For general enquiries:{' '}
          <a href="mailto:hello@blushbite.live" style={{ color: '#c9a96e', textDecoration: 'none' }}>hello@blushbite.live</a>
        </p>

        <div style={S.divider} />

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ fontSize: 12, color: '#4b5563', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
          <Link href="/companion-guidelines" style={{ fontSize: 12, color: '#4b5563', textDecoration: 'none' }}>Companion Guidelines</Link>
          <Link href="/" style={{ fontSize: 12, color: '#4b5563', textDecoration: 'none' }}>Back to BlushBite</Link>
        </div>
      </div>
    </div>
  )
}
