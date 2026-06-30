import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL ?? 'admin@blushbite.co'

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await resend.emails.send({
    from: `BlushBite <${FROM}>`,
    to,
    subject: `${otp} — your BlushBite verification code`,
    html: otpEmailHtml(otp),
  })
}

export async function sendApprovalEmail(to: string, firstName: string): Promise<void> {
  await resend.emails.send({
    from: `BlushBite <${FROM}>`,
    to,
    subject: "You're in — BlushBite",
    html: approvalEmailHtml(firstName),
  })
}

export async function sendRejectionEmail(
  to: string,
  firstName: string,
  reason?: string
): Promise<void> {
  await resend.emails.send({
    from: `BlushBite <${FROM}>`,
    to,
    subject: 'Your BlushBite application',
    html: rejectionEmailHtml(firstName, reason),
  })
}

export async function sendAdminReapplyNotification(
  companionId: string,
  email: string,
  name: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? FROM
  await resend.emails.send({
    from: `BlushBite System <${FROM}>`,
    to: adminEmail,
    subject: `Re-apply: ${name} (${email})`,
    html: `<p>Companion <strong>${name}</strong> (${email}) has updated their application and is awaiting re-review.</p><p>ID: ${companionId}</p>`,
  })
}

// ── HTML templates ────────────────────────────────────────────────────────────

function card(accent: string, content: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#07090f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#07090f;min-height:100vh;">
<tr><td align="center" style="padding:48px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td style="padding-bottom:32px;"><span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#eeeef0;letter-spacing:.03em;">BlushBite</span></td></tr>
<tr><td style="background:#0d1117;border:1px solid #1c2333;border-radius:16px;overflow:hidden;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="height:2px;background:linear-gradient(90deg,transparent,${accent},transparent);line-height:2px;font-size:2px;">&nbsp;</td></tr>
</table>
${content}
</td></tr>
<tr><td style="padding-top:28px;"><p style="margin:0;font-size:11px;color:#374151;">&copy; BlushBite &nbsp;&middot;&nbsp; EU-hosted &nbsp;&middot;&nbsp; Your identity stays private — always.</p></td></tr>
</table></td></tr></table></body></html>`
}

function otpEmailHtml(otp: string): string {
  return card(
    '#e8607a',
    `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:40px 40px 12px;">
  <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;">Companion application</p>
  <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#eeeef0;line-height:1.3;">Your verification <em style="color:#e8607a;">code</em></h1>
  <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">Enter this code to verify your email. It expires in <strong style="color:#eeeef0;">10 minutes</strong>.</p>
</td></tr>
<tr><td style="padding:0 40px 32px;">
  <div style="background:#111620;border:1px solid rgba(232,96,122,.25);border-radius:12px;text-align:center;padding:28px 24px;">
    <span style="font-family:'Courier New',monospace;font-size:40px;font-weight:700;letter-spacing:.3em;color:#eeeef0;">${otp}</span>
    <span style="display:block;margin-top:12px;font-size:11px;color:#6b7280;text-transform:uppercase;">One-time code · valid 10 min</span>
  </div>
</td></tr>
<tr><td style="padding:0 40px;"><table width="100%"><tr><td style="height:1px;background:#1c2333;font-size:1px;">&nbsp;</td></tr></table></td></tr>
<tr><td style="padding:24px 40px 36px;"><p style="margin:0;font-size:12px;color:#4b5563;line-height:1.7;">If you did not request this code, ignore this email — your address will not be used without it.</p></td></tr>
</table>`
  )
}

function approvalEmailHtml(name: string): string {
  return card(
    '#e8607a',
    `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:40px 40px 12px;">
  <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;">Application approved</p>
  <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#eeeef0;line-height:1.3;">Welcome to the room, <em style="color:#e8607a;">${name}.</em></h1>
  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">Your BlushBite companion application has been approved. Log in to complete your profile — add photos, set your rates, and go live to dreamers.</p>
</td></tr>
<tr><td style="padding:0 40px 32px;">
  <a href="https://blushbite.live/login" style="display:inline-block;background:#e8607a;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 28px;border-radius:10px;">Set up your profile →</a>
</td></tr>
<tr><td style="padding:0 40px;"><table width="100%"><tr><td style="height:1px;background:#1c2333;font-size:1px;">&nbsp;</td></tr></table></td></tr>
<tr><td style="padding:24px 40px 36px;"><p style="margin:0;font-size:12px;color:#4b5563;line-height:1.7;">Log in at blushbite.live/login using the email you applied with. Your identity stays private — always.</p></td></tr>
</table>`
  )
}

function rejectionEmailHtml(name: string, reason?: string): string {
  const reasonHtml = reason
    ? `<p style="margin:16px 0 0;font-size:13px;color:#6b7280;background:#111620;border:1px solid #1c2333;border-radius:10px;padding:14px 16px;">${reason}</p>`
    : ''
  return card(
    '#1c2333',
    `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:40px 40px 12px;">
  <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;">Application update</p>
  <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#eeeef0;line-height:1.3;">Thank you for applying, <em style="color:#c9a96e;">${name}.</em></h1>
  <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">After carefully reviewing your application, we're not able to move forward at this time.${reason ? '' : ' We wish you all the best.'}</p>
  ${reasonHtml}
</td></tr>
<tr><td style="padding:0 40px;height:32px;"></td></tr>
<tr><td style="padding:0 40px;"><table width="100%"><tr><td style="height:1px;background:#1c2333;font-size:1px;">&nbsp;</td></tr></table></td></tr>
<tr><td style="padding:24px 40px 36px;"><p style="margin:0;font-size:12px;color:#4b5563;line-height:1.7;">If you have questions, reply to this email. Your identity stays private — always.</p></td></tr>
</table>`
  )
}
