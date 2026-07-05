import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and Conditions of use for BlushBite — the private companion platform. Governed by the laws of the Netherlands.',
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
  highlight: {
    background: 'rgba(232,96,122,0.06)',
    border: '1px solid rgba(232,96,122,0.15)',
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

export default function TermsPage() {
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1c2333' }}>
        <div style={S.header}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Image src="/logo.png" alt="BlushBite" width={130} height={44} style={{ height: 44, width: 'auto' }} />
          </Link>
          <Link
            href="/"
            style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}
          >
            ← Back
          </Link>
        </div>
      </div>

      <div style={S.wrap}>
        {/* Title */}
        <p style={S.eyebrow}>Legal</p>
        <h1 style={S.title}>
          Terms &amp;{' '}
          <em style={{ fontStyle: 'italic', color: '#e8607a' }}>Conditions</em>
        </h1>
        <span style={S.updated}>Last updated: July 2026 &nbsp;·&nbsp; Governing law: Kingdom of the Netherlands</span>

        {/* Important notice */}
        <div style={S.highlight}>
          <p style={S.highlightText}>
            <strong style={{ color: '#eeeef0' }}>Important:</strong> This website contains adult content and is intended for mature audiences only. You must be at least 18 years of age to access or use this website. By continuing, you confirm this and accept these Terms in full.
          </p>
        </div>

        <div style={S.divider} />

        {/* Section 1 */}
        <h2 style={S.h2}>1. Acceptance of Terms</h2>
        <p style={S.p}>
          By accessing or using blushbite.live (the &ldquo;Website&rdquo;), you confirm that you are at least 18 years of age, that viewing adult content is legal in your jurisdiction, and that you accept these Terms and Conditions (&ldquo;Terms&rdquo;) in full. If you do not accept these Terms, you must leave this website immediately.
        </p>
        <p style={S.p}>
          These Terms form a binding legal agreement between you and BlushBite (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a platform operated under the laws of the Kingdom of the Netherlands.
        </p>

        {/* Section 2 */}
        <h2 style={S.h2}>2. Nature of the Service</h2>
        <p style={S.p}>
          BlushBite is a private advertising and publishing platform. This website only allows adult individuals to advertise their time and companionship to other adult individuals. BlushBite acts as an intermediary and publisher of user-generated content only.
        </p>
        <p style={S.p}>
          BlushBite does not provide, arrange, broker, or facilitate any physical or sexual services. All advertisements and profiles are created and managed by independent adult individuals acting entirely on their own behalf. BlushBite has no involvement in, and accepts no responsibility for, any transaction, agreement, or interaction between users.
        </p>
        <p style={S.p}>
          You are solely responsible for ensuring that your use of this website complies with all applicable laws in your country, state, or jurisdiction.
        </p>

        {/* Section 3 */}
        <h2 style={S.h2}>3. Age Verification</h2>
        <p style={S.p}>
          You must be 18 years of age or older to access this website, create a profile, or interact with any content. By entering this website, you confirm under penalty of immediate account termination that you meet this requirement.
        </p>
        <p style={S.p}>
          If we find or have reasonable cause to believe that you have misrepresented your age, your account and all associated content will be deleted without warning, without refund, and without the right of appeal.
        </p>
        <p style={S.p}>
          You may not post, upload, or otherwise make available any content that depicts, describes, or involves any individual under 18 years of age. Violation of this clause will result in immediate permanent termination and may be reported to the relevant authorities.
        </p>

        {/* Section 4 */}
        <h2 style={S.h2}>4. User Accounts and Registration</h2>
        <p style={S.p}>
          To create a companion profile, you must provide a valid email address and a display name. You are responsible for maintaining the security of your login credentials. You must not share your account with any other person.
        </p>
        <p style={S.p}>
          You agree that all information you provide during registration and in your profile is accurate, current, and not misleading. You agree not to impersonate any other person or misrepresent your identity.
        </p>
        <p style={S.p}>
          BlushBite reserves the right to verify your age and identity at any time. Failure to provide satisfactory verification may result in account suspension or termination.
        </p>

        {/* Section 5 */}
        <h2 style={S.h2}>5. Prohibited Content and Conduct</h2>
        <p style={S.p}>You may not post, upload, transmit, or make available any content that:</p>
        <ul style={S.ul}>
          <li style={S.li}>Displays full frontal nudity, genitalia, or sexually explicit acts on publicly accessible pages (i.e. pages accessible without login)</li>
          <li style={S.li}>Involves, depicts, or appears to involve any individual under 18 years of age</li>
          <li style={S.li}>Promotes, glorifies, or facilitates trafficking, coercion, or exploitation of any person</li>
          <li style={S.li}>Promotes racism, bigotry, hatred, or physical harm toward any group or individual</li>
          <li style={S.li}>Is false, misleading, or designed to deceive other users or draw traffic through misrepresentation</li>
          <li style={S.li}>Constitutes spam, unsolicited communications, or pyramid schemes</li>
          <li style={S.li}>Infringes the intellectual property, privacy, or other rights of any third party</li>
          <li style={S.li}>Violates any applicable law, regulation, or court order in the Netherlands or your local jurisdiction</li>
          <li style={S.li}>Contains malware, viruses, or any code designed to interfere with the Website&rsquo;s operation</li>
        </ul>
        <p style={S.p}>
          You may not use this Website to harass, threaten, stalk, or harm any other user. You may not create multiple accounts for the same individual. You may not scrape, copy, or reproduce the Website&rsquo;s content without our written permission.
        </p>

        {/* Section 6 */}
        <h2 style={S.h2}>6. Content Ownership and Licence</h2>
        <p style={S.p}>
          You retain full ownership of all content you upload to BlushBite (&ldquo;Your Content&rdquo;). By uploading Your Content, you grant BlushBite a non-exclusive, worldwide, royalty-free, sublicensable licence to store, display, reproduce, and distribute Your Content solely for the purposes of operating and promoting the platform.
        </p>
        <p style={S.p}>
          You warrant that you own all rights to Your Content, that Your Content does not infringe any third-party rights, and that any individuals depicted in Your Content have given their explicit informed consent to its publication on an adult platform.
        </p>
        <p style={S.p}>
          BlushBite reserves the right to review, moderate, reject, or remove any content at any time without notice if we determine, in our sole discretion, that it violates these Terms or is otherwise objectionable.
        </p>

        {/* Section 7 */}
        <h2 style={S.h2}>7. Account Suspension and Termination</h2>
        <p style={S.p}>
          BlushBite may suspend, restrict, or permanently terminate any account at any time, with or without notice, for any violation of these Terms or for any conduct that we determine to be harmful to the platform, its users, or third parties.
        </p>
        <p style={S.p}>
          Upon termination, your right to access the platform and your profile ceases immediately. Content associated with terminated accounts may be removed at our discretion. You acknowledge that BlushBite is not liable to you or any third party for any termination of your account.
        </p>

        {/* Section 8 */}
        <h2 style={S.h2}>8. Payments, Subscriptions, and Refunds</h2>
        <p style={S.p}>
          Certain features of BlushBite are available under paid subscription tiers. By subscribing, you authorise us to charge the applicable fee to your chosen payment method on a recurring basis until you cancel.
        </p>
        <p style={S.p}>
          All fees are stated in Euros (EUR) and are inclusive of any applicable taxes unless stated otherwise. You are responsible for any currency conversion fees charged by your payment provider.
        </p>
        <p style={S.p}>
          Refunds are available within 3 days (72 hours) of initial purchase for new subscriptions, provided the service has not been materially used. Refunds are processed in EUR. BlushBite is not responsible for any exchange rate losses. All fees outside the refund window are non-refundable in whole or in part unless required by applicable law.
        </p>
        <p style={S.p}>
          To request a refund, contact: <a href="mailto:billing@blushbite.live" style={{ color: '#e8607a', textDecoration: 'none' }}>billing@blushbite.live</a>
        </p>

        {/* Section 9 */}
        <h2 style={S.h2}>9. Privacy and Data Protection</h2>
        <p style={S.p}>
          BlushBite processes personal data in accordance with our{' '}
          <Link href="/privacy" style={{ color: '#e8607a', textDecoration: 'none' }}>Privacy Policy</Link>,
          which is incorporated into and forms part of these Terms. By using this Website, you consent to the processing of your personal data as described in our Privacy Policy.
        </p>
        <p style={S.p}>
          BlushBite complies with the General Data Protection Regulation (GDPR) (EU) 2016/679. You have the right to access, correct, delete, and port your personal data. To exercise these rights, contact:{' '}
          <a href="mailto:privacy@blushbite.live" style={{ color: '#e8607a', textDecoration: 'none' }}>privacy@blushbite.live</a>
        </p>

        {/* Section 10 */}
        <h2 style={S.h2}>10. Disclaimer of Warranties</h2>
        <p style={S.p}>
          BlushBite provides this Website and all content on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranty of any kind, express or implied. We do not warrant that the Website will be uninterrupted, error-free, or free from viruses or other harmful components.
        </p>
        <p style={S.p}>
          We do not endorse, verify, or guarantee the accuracy, completeness, or reliability of any user-generated content, profile, or advertisement. You rely on such content entirely at your own risk.
        </p>

        {/* Section 11 */}
        <h2 style={S.h2}>11. Limitation of Liability</h2>
        <p style={S.p}>
          To the maximum extent permitted by applicable law, BlushBite, its directors, employees, agents, and licensors shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use this Website or its content, including but not limited to loss of data, loss of profits, or any harm resulting from interactions between users.
        </p>
        <p style={S.p}>
          In any event, BlushBite&rsquo;s total liability to you for any claim arising from or related to these Terms or your use of the Website shall not exceed the amount you paid to BlushBite in the 12 months preceding the claim.
        </p>

        {/* Section 12 */}
        <h2 style={S.h2}>12. DMCA and Content Removal</h2>
        <p style={S.p}>
          If you believe that content on BlushBite infringes your copyright or violates your rights, please submit a written notice to:{' '}
          <a href="mailto:dmca@blushbite.live" style={{ color: '#e8607a', textDecoration: 'none' }}>dmca@blushbite.live</a>
        </p>
        <p style={S.p}>
          Your notice must include: (i) identification of the copyrighted work or right claimed to be infringed; (ii) identification of the infringing material and its location on the Website; (iii) your contact information; (iv) a statement that you have a good-faith belief the use is not authorised; (v) a statement that the information is accurate, under penalty of perjury; (vi) your signature.
        </p>

        {/* Section 13 */}
        <h2 style={S.h2}>13. Modifications to the Service and Terms</h2>
        <p style={S.p}>
          BlushBite reserves the right to modify, suspend, or discontinue any part of the Website at any time without notice. We may also update these Terms at any time. We will indicate the date of the most recent revision at the top of this page.
        </p>
        <p style={S.p}>
          Your continued use of the Website after any changes to these Terms constitutes your acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the Website.
        </p>

        {/* Section 14 */}
        <h2 style={S.h2}>14. Governing Law and Jurisdiction</h2>
        <p style={S.p}>
          These Terms and any dispute or claim arising out of or in connection with them (including non-contractual disputes) shall be governed by and construed exclusively in accordance with the laws of the Kingdom of the Netherlands.
        </p>
        <p style={S.p}>
          Any disputes arising from or relating to these Terms or your use of the Website shall be subject to the exclusive jurisdiction of the competent courts located in Amsterdam, the Netherlands.
        </p>

        {/* Section 15 */}
        <h2 style={S.h2}>15. Contact</h2>
        <p style={S.p}>
          For any questions regarding these Terms, please contact us at:{' '}
          <a href="mailto:legal@blushbite.live" style={{ color: '#e8607a', textDecoration: 'none' }}>legal@blushbite.live</a>
        </p>

        <div style={S.divider} />

        {/* Footer nav */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ fontSize: 12, color: '#4b5563', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/companion-guidelines" style={{ fontSize: 12, color: '#4b5563', textDecoration: 'none' }}>Companion Guidelines</Link>
          <Link href="/" style={{ fontSize: 12, color: '#4b5563', textDecoration: 'none' }}>Back to BlushBite</Link>
        </div>
      </div>
    </div>
  )
}
