'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '.env.local') })

const express = require('express')
const multer = require('multer')
const { Pool } = require('pg')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const { Resend } = require('resend')
const cloudinaryPkg = require('cloudinary')
const cloudinary = cloudinaryPkg.v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Multer (in-memory, 5 MB limit) ────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL || 'admin@blushbite.co'

// ── Database ───────────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// ── Alias generation (ported from apps/web/lib/alias.ts) ──────────────────────

const ADJECTIVES = [
  'amber',
  'ancient',
  'ashen',
  'bare',
  'bitter',
  'black',
  'blush',
  'bold',
  'broken',
  'calm',
  'cardinal',
  'carved',
  'close',
  'cold',
  'copper',
  'crimson',
  'dark',
  'dusk',
  'electric',
  'ember',
  'faded',
  'faint',
  'gilded',
  'glass',
  'golden',
  'grey',
  'hollow',
  'honest',
  'hushed',
  'idle',
  'ivory',
  'jade',
  'knowing',
  'late',
  'lavender',
  'lean',
  'light',
  'liminal',
  'lone',
  'lucid',
  'lunar',
  'marbled',
  'midnight',
  'mild',
  'misty',
  'muted',
  'narrow',
  'night',
  'northern',
  'oblique',
  'onyx',
  'open',
  'pale',
  'phantom',
  'private',
  'quiet',
  'raven',
  'raw',
  'restless',
  'rose',
  'rouge',
  'sable',
  'scarlet',
  'secret',
  'sheer',
  'silent',
  'silver',
  'slow',
  'smoke',
  'soft',
  'solstice',
  'stark',
  'still',
  'strange',
  'tender',
  'thin',
  'twilight',
  'unnamed',
  'unspoken',
  'velvet',
  'violet',
  'warm',
  'wandering',
  'winter',
  'worn',
  'woven',
]

const NOUNS = [
  'afternoon',
  'anchor',
  'archive',
  'aria',
  'atlas',
  'autumn',
  'avenue',
  'bloom',
  'breath',
  'bridge',
  'candle',
  'chapel',
  'chord',
  'coast',
  'compass',
  'confession',
  'corridor',
  'dawn',
  'desire',
  'door',
  'dusk',
  'echo',
  'ember',
  'evening',
  'fable',
  'figure',
  'flame',
  'flare',
  'fog',
  'folio',
  'garden',
  'ghost',
  'glade',
  'glass',
  'grace',
  'harbour',
  'haven',
  'hour',
  'hush',
  'ink',
  'interval',
  'island',
  'journal',
  'key',
  'lamp',
  'lantern',
  'library',
  'light',
  'linen',
  'longing',
  'lullaby',
  'map',
  'meadow',
  'mirror',
  'mist',
  'moon',
  'muse',
  'myth',
  'night',
  'north',
  'note',
  'notion',
  'novella',
  'ocean',
  'passage',
  'pause',
  'petal',
  'phrase',
  'pilgrim',
  'place',
  'plume',
  'portal',
  'prism',
  'quarter',
  'rain',
  'reverie',
  'rhyme',
  'ridge',
  'ritual',
  'river',
  'room',
  'rose',
  'secret',
  'shade',
  'shadow',
  'shore',
  'signal',
  'silence',
  'silhouette',
  'smoke',
  'solace',
  'sonnet',
  'spark',
  'spell',
  'star',
  'station',
  'storm',
  'strand',
  'study',
  'summer',
  'swan',
  'syntax',
  'thought',
  'thread',
  'tide',
  'tower',
  'trace',
  'trail',
  'truth',
  'tunnel',
  'twilight',
  'vessel',
  'vigil',
  'vista',
  'voice',
  'wave',
  'window',
  'wing',
  'winter',
  'wish',
]

function generateAlias() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `@${adj}-${noun}`
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isAtLeast18(dob) {
  const date = new Date(dob)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  const cutoff = new Date(date.getFullYear() + 18, date.getMonth(), date.getDate())
  return today >= cutoff
}

function validate(body) {
  const {
    fullName,
    email,
    dateOfBirth,
    country,
    city,
    whatsappNumber,
    gender,
    sessionModality,
  } = body

  if (!fullName || fullName.trim().length < 2) return 'We need your full legal name.'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  if (!dateOfBirth || isNaN(new Date(dateOfBirth).getTime())) return 'Enter a valid date of birth.'
  if (!isAtLeast18(dateOfBirth)) return 'You must be 18 or older to apply.'
  if (!country || country.trim().length < 1) return 'Please select your country.'
  if (!city || city.trim().length < 1) return 'Please enter your city.'
  if (!whatsappNumber || !/^\+[1-9]\d{6,14}$/.test(whatsappNumber))
    return 'Enter a valid WhatsApp number in E.164 format, e.g. +31612345678.'

  const validGenders = [
    'woman',
    'man',
    'non_binary',
    'genderqueer',
    'genderfluid',
    'agender',
    'bigender',
    'pangender',
    'two_spirit',
    'trans_woman',
    'trans_man',
    'demi_girl',
    'demi_boy',
    'neutrois',
    'androgyne',
    'intersex',
    'questioning',
    'other',
    'prefer_not_to_say',
  ]
  if (!gender || !validGenders.includes(gender)) return 'Please select your gender.'

  const validModalities = ['in_person', 'online', 'both']
  const modality = sessionModality || 'in_person'
  if (!validModalities.includes(modality)) return 'Invalid session modality.'

  return null // no error
}

// ── OTP store (in-memory, dev only — prod uses Next.js routes) ────────────────

const otpStore = new Map() // email → { otp, expiry, attempts }
const rateStore = new Map() // email → { count, windowStart }
const OTP_TTL = 10 * 60 * 1000
const RATE_WIN = 10 * 60 * 1000

function checkRate(email) {
  const now = Date.now(),
    e = rateStore.get(email)
  if (!e || now - e.windowStart > RATE_WIN) {
    rateStore.set(email, { count: 1, windowStart: now })
    return true
  }
  if (e.count >= 3) return false
  e.count++
  return true
}

// ── Email template ─────────────────────────────────────────────────────────────

function buildOtpEmail(otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your BlushBite code</title>
</head>
<body style="margin:0;padding:0;background-color:#07090f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#eeeef0;letter-spacing:0.03em;">BlushBite</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#0d1117;border:1px solid #1c2333;border-radius:16px;overflow:hidden;">

              <!-- Top accent line -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:2px;background:linear-gradient(90deg,transparent,#e8607a,transparent);line-height:2px;font-size:2px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card body -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 40px 12px;">
                    <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Companion application</p>
                    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#eeeef0;line-height:1.3;">
                      Your verification <em style="font-style:italic;color:#e8607a;">code</em>
                    </h1>
                    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">
                      Enter this code in the application form to verify your email address.
                      It expires in <strong style="color:#eeeef0;">10 minutes</strong>.
                    </p>
                  </td>
                </tr>

                <!-- OTP block -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#111620;border:1px solid rgba(232,96,122,0.25);border-radius:12px;text-align:center;padding:28px 24px;">
                          <span style="font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:700;letter-spacing:0.3em;color:#eeeef0;display:block;line-height:1;">${otp}</span>
                          <span style="display:block;margin-top:12px;font-size:11px;color:#6b7280;letter-spacing:0.05em;text-transform:uppercase;">One-time code · valid for 10 min</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="height:1px;background-color:#1c2333;font-size:1px;line-height:1px;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer note -->
                <tr>
                  <td style="padding:24px 40px 36px;">
                    <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.7;">
                      If you did not request this code, someone may have entered your email address.
                      You can safely ignore this message — your address will not be used without this code.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#374151;line-height:1.6;">
                &copy; BlushBite &nbsp;&middot;&nbsp; EU-hosted &nbsp;&middot;&nbsp; Your identity stays private — always.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── JWT session (HMAC-SHA256, no external library) ────────────────────────────

const JWT_SECRET = process.env.COMPANION_JWT_SECRET || process.env.JWT_SECRET || ''

function signJwt(payload) {
  const hdr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const bdy = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${hdr}.${bdy}`).digest('base64url')
  return `${hdr}.${bdy}.${sig}`
}

function verifyJwt(token) {
  try {
    const parts = (token || '').split('.')
    if (parts.length !== 3) return null
    const [hdr, bdy, sig] = parts
    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${hdr}.${bdy}`)
      .digest('base64url')
    const aBuf = Buffer.from(sig, 'base64url')
    const bBuf = Buffer.from(expected, 'base64url')
    if (aBuf.length !== bBuf.length || !crypto.timingSafeEqual(aBuf, bBuf)) return null
    const payload = JSON.parse(Buffer.from(bdy, 'base64url').toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function getCookie(req, name) {
  const raw = req.headers.cookie || ''
  const match = raw
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}

function issueSessionCookie(res, companionId, email, name) {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  const token = signJwt({ sub: companionId, email, name, exp })
  const isProd = process.env.NODE_ENV === 'production'
  const cookieName = isProd ? '__Host-bb_session' : 'bb_session'
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=${token}; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=604800`
  )
}

function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookieName = isProd ? '__Host-bb_session' : 'bb_session'
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=0`
  )
}

function requireSession(req, res, next) {
  const token = getCookie(req, '__Host-bb_session') || getCookie(req, 'bb_session')
  const payload = verifyJwt(token)
  if (!payload) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' })
    return res.redirect('/login')
  }
  req.companion = payload
  next()
}

// ── CORS headers ───────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ── Express app ────────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())

// Serve index.html with Google Maps key injected from env
const INDEX_HTML = path.join(__dirname, 'index.html')
app.get('/', (req, res) => {
  const key = process.env.GOOGLE_MAPS_KEY || ''
  const html = fs
    .readFileSync(INDEX_HTML, 'utf8')
    .replace("window.GOOGLE_MAPS_KEY = ''", `window.GOOGLE_MAPS_KEY = '${key}'`)
  res.type('html').send(html)
})

app.use(express.static(path.join(__dirname)))

// ── Page routes ────────────────────────────────────────────────────────────────

// GET /login — companion login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'))
})

// GET /dashboard — companion portal (session required)
app.get('/dashboard', requireSession, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'))
})

// ── Session routes ─────────────────────────────────────────────────────────────

// POST /api/companions/login/send-otp
app.post('/api/companions/login/send-otp', async (req, res) => {
  const email = ((req.body || {}).email || '').toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Enter a valid email address.' })

  let client
  try {
    client = await pool.connect()
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }
  try {
    const { rows } = await client.query('SELECT id FROM companions WHERE email = $1 LIMIT 1', [
      email,
    ])
    if (rows.length === 0)
      return res
        .status(404)
        .json({ error: 'No application found for this email. Please apply first.' })
  } finally {
    if (client) client.release()
  }

  if (!checkRate(email))
    return res.status(429).json({ error: 'Too many code requests. Please wait 10 minutes.' })

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  otpStore.set(email, { otp, expiry: Date.now() + OTP_TTL, attempts: 0 })

  try {
    await resend.emails.send({
      from: `BlushBite <${FROM}>`,
      to: email,
      subject: `${otp} — your BlushBite login code`,
      html: buildOtpEmail(otp),
    })
  } catch (err) {
    console.error('[login/send-otp] Resend error:', err.message)
    otpStore.delete(email)
    return res.status(500).json({ error: 'Could not send the code. Please try again.' })
  }
  return res.json({ sent: true })
})

// POST /api/companions/login/verify-otp
app.post('/api/companions/login/verify-otp', async (req, res) => {
  const email = ((req.body || {}).email || '').toLowerCase().trim()
  const otp = String((req.body || {}).otp || '').trim()
  const entry = otpStore.get(email)
  if (!entry)
    return res.status(400).json({ error: 'No code sent for this email. Request a new one.' })
  if (Date.now() > entry.expiry) {
    otpStore.delete(email)
    return res.status(400).json({ error: 'Code expired. Request a new one.' })
  }
  if (entry.attempts >= 5) {
    otpStore.delete(email)
    return res.status(400).json({ error: 'Too many attempts. Request a new code.' })
  }
  if (entry.otp !== otp) {
    entry.attempts++
    return res.status(400).json({ error: 'That code is incorrect.' })
  }
  otpStore.delete(email)

  let client
  try {
    client = await pool.connect()
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }
  try {
    const { rows } = await client.query(
      'SELECT id, email, name FROM companions WHERE email = $1 LIMIT 1',
      [email]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Companion not found.' })
    const c = rows[0]
    issueSessionCookie(res, c.id, c.email, c.name)
    return res.json({ ok: true })
  } finally {
    if (client) client.release()
  }
})

// POST /api/companions/logout
app.post('/api/companions/logout', (req, res) => {
  clearSessionCookie(res)
  return res.json({ ok: true })
})

// GET /api/companions/me (session required)
app.get('/api/companions/me', requireSession, async (req, res) => {
  let client
  try {
    client = await pool.connect()
  } catch {
    return res.status(503).json({ error: 'Database unavailable.' })
  }
  try {
    const { rows } = await client.query(
      `
      SELECT
        c.id, c.email, c.name, c.alias, c.companion_stage,
        cp.bio, cp.tagline, cp.city, cp.is_live, cp.is_verified,
        cp.availability_status, cp.whatsapp_number AS profile_whatsapp,
        cp.session_modality, cp.hourly_rate::text AS hourly_rate, cp.currency,
        cp.profile_completeness, cp.is_visible_to_users,
        cp.gender, cp.instagram_handle, cp.website_url,
        cop.status AS review_status, cop.notes AS rejection_reason
      FROM companions c
      LEFT JOIN companion_profiles cp ON cp.companion_id = c.id
      LEFT JOIN companion_onboarding_progress cop
             ON cop.companion_id = c.id AND cop.stage = 7
      WHERE c.id = $1
    `,
      [req.companion.sub]
    )

    if (rows.length === 0) return res.status(404).json({ error: 'Not found.' })
    const row = rows[0]

    // Derive human-readable status
    let status = 'pending'
    if (row.review_status === 'rejected') status = 'rejected'
    else if (row.review_status === 'completed' && row.is_live) status = 'approved'

    return res.json({ ...row, status })
  } finally {
    if (client) client.release()
  }
})

// GET /api/companions/photos (session required)
app.get('/api/companions/photos', requireSession, async (req, res) => {
  let client
  try {
    client = await pool.connect()
  } catch {
    return res.status(503).json({ error: 'Database unavailable.' })
  }
  try {
    const { rows } = await client.query(
      `
      SELECT cp.id, cp.url, cp.is_primary, cp.sort_order, cp.created_at
      FROM companion_photos cp
      JOIN companion_profiles prof ON prof.id = cp.companion_profile_id
      WHERE prof.companion_id = $1 AND cp.deleted_at IS NULL
      ORDER BY cp.sort_order ASC, cp.created_at ASC
    `,
      [req.companion.sub]
    )
    return res.json(rows)
  } finally {
    if (client) client.release()
  }
})

// PATCH /api/companions/profile (session required)
app.patch('/api/companions/profile', requireSession, async (req, res) => {
  const {
    bio,
    tagline,
    city,
    availability_status,
    session_modality,
    whatsapp_number,
    instagram_handle,
    website_url,
    hourly_rate,
  } = req.body || {}

  const AVAIL = ['available', 'busy', 'offline']
  const MODALITY = ['in_person', 'online', 'both']

  if (availability_status && !AVAIL.includes(availability_status))
    return res.status(400).json({ error: 'Invalid availability status.' })
  if (session_modality && !MODALITY.includes(session_modality))
    return res.status(400).json({ error: 'Invalid session modality.' })
  if (hourly_rate !== undefined && hourly_rate !== null && hourly_rate !== '') {
    if (isNaN(parseFloat(hourly_rate)) || parseFloat(hourly_rate) < 0)
      return res.status(400).json({ error: 'Hourly rate must be a positive number.' })
  }
  if (whatsapp_number && !/^\+[1-9]\d{6,14}$/.test(whatsapp_number))
    return res
      .status(400)
      .json({ error: 'Invalid WhatsApp number. Use E.164 format, e.g. +31612345678.' })

  let client
  try {
    client = await pool.connect()
  } catch {
    return res.status(503).json({ error: 'Database unavailable.' })
  }
  try {
    await client.query(
      `
      UPDATE companion_profiles SET
        bio                 = COALESCE($1, bio),
        tagline             = COALESCE($2, tagline),
        city                = COALESCE($3, city),
        availability_status = COALESCE($4, availability_status),
        session_modality    = COALESCE($5, session_modality),
        whatsapp_number     = COALESCE($6, whatsapp_number),
        instagram_handle    = COALESCE($7, instagram_handle),
        website_url         = COALESCE($8, website_url),
        hourly_rate         = COALESCE($9::numeric, hourly_rate),
        updated_at          = NOW()
      WHERE companion_id = $10
    `,
      [
        bio ?? null,
        tagline ?? null,
        city ?? null,
        availability_status ?? null,
        session_modality ?? null,
        whatsapp_number ?? null,
        instagram_handle ?? null,
        website_url ?? null,
        hourly_rate !== '' && hourly_rate !== null && hourly_rate !== undefined
          ? parseFloat(hourly_rate)
          : null,
        req.companion.sub,
      ]
    )

    if (whatsapp_number) {
      await client.query(
        'UPDATE companions SET whatsapp_number = $1, updated_at = NOW() WHERE id = $2',
        [whatsapp_number, req.companion.sub]
      )
    }
    return res.json({ ok: true })
  } finally {
    if (client) client.release()
  }
})

// POST /api/companions/photos/set-primary (session required)
app.post('/api/companions/photos/set-primary', requireSession, async (req, res) => {
  const { photoId } = req.body || {}
  if (!photoId) return res.status(400).json({ error: 'photoId required.' })

  let client
  try {
    client = await pool.connect()
  } catch {
    return res.status(503).json({ error: 'Database unavailable.' })
  }
  try {
    // Verify the photo belongs to this companion
    const check = await client.query(
      `
      SELECT cp.id FROM companion_photos cp
      JOIN companion_profiles prof ON prof.id = cp.companion_profile_id
      WHERE cp.id = $1 AND prof.companion_id = $2 AND cp.deleted_at IS NULL
    `,
      [photoId, req.companion.sub]
    )
    if (check.rows.length === 0) return res.status(404).json({ error: 'Photo not found.' })

    await client.query(
      `
      UPDATE companion_photos SET is_primary = false
      WHERE companion_profile_id = (
        SELECT id FROM companion_profiles WHERE companion_id = $1
      )
    `,
      [req.companion.sub]
    )
    await client.query('UPDATE companion_photos SET is_primary = true WHERE id = $1', [photoId])
    return res.json({ ok: true })
  } finally {
    if (client) client.release()
  }
})

// DELETE /api/companions/photos/:photoId (session required)
app.delete('/api/companions/photos/:photoId', requireSession, async (req, res) => {
  const { photoId } = req.params

  let client
  try {
    client = await pool.connect()
  } catch {
    return res.status(503).json({ error: 'Database unavailable.' })
  }
  try {
    const { rowCount } = await client.query(
      `
      UPDATE companion_photos SET deleted_at = NOW()
      WHERE id = $1
        AND companion_profile_id = (
          SELECT id FROM companion_profiles WHERE companion_id = $2
        )
        AND deleted_at IS NULL
    `,
      [photoId, req.companion.sub]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Photo not found.' })
    return res.json({ ok: true })
  } finally {
    if (client) client.release()
  }
})

// Preflight (all companion endpoints)
app.options('/api/companions/apply', (req, res) => res.set(CORS).status(204).end())
app.options('/api/companions/send-otp', (req, res) => res.set(CORS).status(204).end())
app.options('/api/companions/verify-otp', (req, res) => res.set(CORS).status(204).end())
app.options('/api/companions/upload-photo', (req, res) => res.set(CORS).status(204).end())
app.options('/api/companions/login/send-otp', (req, res) => res.set(CORS).status(204).end())
app.options('/api/companions/login/verify-otp', (req, res) => res.set(CORS).status(204).end())
app.options('/api/companions/photos/set-primary', (req, res) => res.set(CORS).status(204).end())

// POST /api/companions/upload-photo
// When called with a valid session cookie, saves the photo to companion_photos.
// When called without a session (application flow), just returns the URL.
app.post('/api/companions/upload-photo', upload.single('photo'), async (req, res) => {
  res.set(CORS)
  if (!req.file) return res.status(400).json({ error: 'No photo provided.' })
  if (!req.file.mimetype.startsWith('image/'))
    return res.status(400).json({ error: 'File must be a JPG or PNG image.' })

  // Detect session (optional — dashboard uploads save to DB; apply flow just returns URL)
  const token = getCookie(req, '__Host-bb_session') || getCookie(req, 'bb_session')
  const sessionPayload = verifyJwt(token)

  let uploadResult
  try {
    uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'companion-applications', resource_type: 'image' },
        (err, r) => (err ? reject(err) : resolve(r))
      )
      stream.write(req.file.buffer)
      stream.end()
    })
  } catch (err) {
    console.error('[upload-photo] Cloudinary error:', err.message, err.http_code)
    return res.status(500).json({ error: 'Photo upload failed. Please try again.' })
  }

  const url = uploadResult.secure_url
  const storageKey = uploadResult.public_id || ''

  // If logged-in companion is uploading, persist to companion_photos
  if (sessionPayload) {
    let client
    try {
      client = await pool.connect()
    } catch {
      return res.status(503).json({ error: 'Database unavailable.' })
    }
    try {
      // Count existing photos to enforce max 8
      const countRes = await client.query(
        `
        SELECT COUNT(*) AS cnt FROM companion_photos cp
        JOIN companion_profiles prof ON prof.id = cp.companion_profile_id
        WHERE prof.companion_id = $1 AND cp.deleted_at IS NULL
      `,
        [sessionPayload.sub]
      )
      if (parseInt(countRes.rows[0].cnt) >= 8)
        return res
          .status(400)
          .json({ error: 'Maximum 8 photos allowed. Delete one to upload more.' })

      const photoRes = await client.query(
        `
        INSERT INTO companion_photos
          (companion_profile_id, url, storage_key, sort_order, is_primary, is_approved, created_at)
        SELECT
          prof.id,
          $2, $3,
          COALESCE((
            SELECT MAX(sort_order) + 1 FROM companion_photos
            WHERE companion_profile_id = prof.id AND deleted_at IS NULL
          ), 0),
          false, false, NOW()
        FROM companion_profiles prof
        WHERE prof.companion_id = $1
        RETURNING id
      `,
        [sessionPayload.sub, url, storageKey]
      )

      const photoId = photoRes.rows[0]?.id
      return res.json({ url, photoId })
    } finally {
      if (client) client.release()
    }
  }

  // Application flow (no session): just return the URL
  return res.json({ url })
})

// POST /api/companions/send-otp
app.post('/api/companions/send-otp', async (req, res) => {
  res.set(CORS)
  const email = ((req.body || {}).email || '').toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Enter a valid email address.' })
  if (!checkRate(email))
    return res.status(429).json({ error: 'Too many code requests. Please wait 10 minutes.' })

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  otpStore.set(email, { otp, expiry: Date.now() + OTP_TTL, attempts: 0 })

  try {
    await resend.emails.send({
      from: `BlushBite <${FROM}>`,
      to: email,
      subject: `${otp} — your BlushBite verification code`,
      html: buildOtpEmail(otp),
    })
  } catch (err) {
    console.error('[send-otp] Resend error:', err.message)
    otpStore.delete(email)
    return res.status(500).json({ error: 'Could not send the code. Please try again.' })
  }
  return res.json({ sent: true })
})

// POST /api/companions/verify-otp
app.post('/api/companions/verify-otp', (req, res) => {
  res.set(CORS)
  const email = ((req.body || {}).email || '').toLowerCase().trim()
  const otp = String((req.body || {}).otp || '').trim()
  const entry = otpStore.get(email)
  if (!entry)
    return res
      .status(400)
      .json({ verified: false, error: 'No code sent for this email. Request a new one.' })
  if (Date.now() > entry.expiry) {
    otpStore.delete(email)
    return res.status(400).json({ verified: false, error: 'Code expired. Request a new one.' })
  }
  if (entry.attempts >= 5) {
    otpStore.delete(email)
    return res
      .status(400)
      .json({ verified: false, error: 'Too many attempts. Request a new code.' })
  }
  if (entry.otp !== otp) {
    entry.attempts++
    return res.status(400).json({ verified: false, error: 'That code is incorrect.' })
  }
  otpStore.delete(email)
  return res.json({ verified: true })
})

// POST /api/companions/apply
app.post('/api/companions/apply', async (req, res) => {
  res.set(CORS)

  const body = req.body || {}
  const validationError = validate(body)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  const {
    fullName,
    email,
    dateOfBirth,
    country,
    city,
    whatsappNumber,
    displayName,
    gender,
    tagline,
    bio,
  } = body
  const cleanEmail = email.toLowerCase().trim()
  const cleanName = fullName.trim()
  const now = new Date()
  const id = crypto.randomUUID()

  let client
  try {
    client = await pool.connect()
  } catch (err) {
    console.error('[apply] db connect failed:', err.message)
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  try {
    // Check duplicate email
    const existing = await client.query('SELECT id FROM companions WHERE email = $1 LIMIT 1', [
      cleanEmail,
    ])
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error:
          'An application with this email already exists. Check your inbox or contact support.',
      })
    }

    // Generate unique alias
    let alias = generateAlias()
    for (let i = 0; i < 10; i++) {
      const conflict = await client.query('SELECT id FROM companions WHERE alias = $1 LIMIT 1', [
        alias,
      ])
      if (conflict.rows.length === 0) break
      alias = generateAlias()
    }

    const displayOrFirst = (displayName && displayName.trim()) || cleanName.split(' ')[0]

    // Insert companion
    await client.query(
      `INSERT INTO companions
        (id, email, name, alias, full_name,
         date_of_birth, country, whatsapp_number, companion_stage,
         onboarding_complete, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        id,
        cleanEmail,
        displayOrFirst,
        alias,
        cleanName,
        dateOfBirth,
        country,
        whatsappNumber || null,
        3,
        false,
        now,
        now,
      ]
    )

    // Insert companion_profile (RETURNING id so we can attach photos)
    const profileResult = await client.query(
      `INSERT INTO companion_profiles
        (companion_id, bio, tagline, city, gender,
         availability_status, whatsapp_number,
         is_verified, is_live, profile_completeness, is_visible_to_users,
         created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        id,
        bio || null,
        tagline || null,
        city || null,
        gender || null,
        'offline',
        whatsappNumber || null,
        false,
        false,
        0,
        false,
        now,
        now,
      ]
    )
    const profileId = profileResult.rows[0].id

    // Insert profile photo if provided
    if (body.profilePhotoUrl) {
      await client.query(
        `INSERT INTO companion_photos
          (companion_profile_id, url, storage_key, alt_text, sort_order, is_primary, is_approved, created_at)
         VALUES ($1, $2, '', NULL, 0, true, false, $3)`,
        [profileId, body.profilePhotoUrl, now]
      )
    }

    // Insert onboarding progress stages 1 + 2
    await client.query(
      `INSERT INTO companion_onboarding_progress
        (companion_id, stage, status, completed_at, notes)
       VALUES ($1, 1, 'completed', $2, 'Applied via landing page')
       ON CONFLICT (companion_id, stage) DO NOTHING`,
      [id, now]
    )
    await client.query(
      `INSERT INTO companion_onboarding_progress
        (companion_id, stage, status, completed_at, notes)
       VALUES ($1, 2, 'completed', $2, NULL)
       ON CONFLICT (companion_id, stage) DO NOTHING`,
      [id, now]
    )

    return res.status(201).json({
      success: true,
      message: 'Application received. We will be in touch within 48 hours.',
    })
  } catch (err) {
    console.error('[apply] ERROR:', err.message)
    console.error('[apply] CODE:', err.code)
    console.error('[apply] DETAIL:', err.detail)
    return res.status(500).json({
      error: 'Something went wrong creating your account. Please try again.',
    })
  } finally {
    if (client) client.release()
  }
})

// ── Start ──────────────────────────────────────────────────────────────────────

const net = require('net')
function findAvailablePort(port) {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.listen(port, () => {
      const p = s.address().port
      s.close(() => resolve(p))
    })
    s.on('error', () => resolve(findAvailablePort(port + 1)))
  })
}
findAvailablePort(parseInt(process.env.PORT) || 3001).then((PORT) => {
  app.listen(PORT, () => {
    console.log(`BlushBite landing running on http://localhost:${PORT}`)
  })
})
