'use strict'

const express = require('express')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const path = require('path')

// ── Database ───────────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// ── Alias generation (ported from apps/web/lib/alias.ts) ──────────────────────

const ADJECTIVES = [
  'amber','ancient','ashen','bare','bitter','black','blush','bold',
  'broken','calm','cardinal','carved','close','cold','copper','crimson',
  'dark','dusk','electric','ember','faded','faint','gilded','glass',
  'golden','grey','hollow','honest','hushed','idle','ivory','jade',
  'knowing','late','lavender','lean','light','liminal','lone','lucid',
  'lunar','marbled','midnight','mild','misty','muted','narrow','night',
  'northern','oblique','onyx','open','pale','phantom','private','quiet',
  'raven','raw','restless','rose','rouge','sable','scarlet','secret',
  'sheer','silent','silver','slow','smoke','soft','solstice','stark',
  'still','strange','tender','thin','twilight','unnamed','unspoken',
  'velvet','violet','warm','wandering','winter','worn','woven',
]

const NOUNS = [
  'afternoon','anchor','archive','aria','atlas','autumn','avenue',
  'bloom','breath','bridge','candle','chapel','chord','coast',
  'compass','confession','corridor','dawn','desire','door','dusk',
  'echo','ember','evening','fable','figure','flame','flare',
  'fog','folio','garden','ghost','glade','glass','grace',
  'harbour','haven','hour','hush','ink','interval','island',
  'journal','key','lamp','lantern','library','light','linen',
  'longing','lullaby','map','meadow','mirror','mist','moon',
  'muse','myth','night','north','note','notion','novella',
  'ocean','passage','pause','petal','phrase','pilgrim','place',
  'plume','portal','prism','quarter','rain','reverie','rhyme',
  'ridge','ritual','river','room','rose','secret','shade',
  'shadow','shore','signal','silence','silhouette','smoke','solace',
  'sonnet','spark','spell','star','station','storm','strand',
  'study','summer','swan','syntax','thought','thread','tide',
  'tower','trace','trail','truth','tunnel','twilight','vessel',
  'vigil','vista','voice','wave','window','wing','winter','wish',
]

function generateAlias() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `@${adj}-${noun}`
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isAtLeast18(dob) {
  const date = new Date(dob)
  if (isNaN(date.getTime())) return false
  const today  = new Date()
  const cutoff = new Date(date.getFullYear() + 18, date.getMonth(), date.getDate())
  return today >= cutoff
}

function validate(body) {
  const { fullName, email, password, dateOfBirth, country,
          city, whatsappNumber, displayName, gender, tagline, bio, sessionModality } = body

  if (!fullName || fullName.trim().length < 2)
    return 'We need your full legal name.'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Enter a valid email address.'
  if (!password || password.length < 8)
    return 'Password must be at least 8 characters.'
  if (password.length > 72)
    return 'Password is too long.'
  if (!dateOfBirth || isNaN(new Date(dateOfBirth).getTime()))
    return 'Enter a valid date of birth.'
  if (!isAtLeast18(dateOfBirth))
    return 'You must be 18 or older to apply.'
  if (!country || country.trim().length < 1)
    return 'Please select your country.'
  if (whatsappNumber && whatsappNumber !== '' && !/^\+[1-9]\d{6,14}$/.test(whatsappNumber))
    return 'Use E.164 format, e.g. +31612345678.'

  const validGenders = ['woman','man','non_binary','trans_woman','trans_man','other','prefer_not_to_say']
  if (gender && !validGenders.includes(gender))
    return 'Invalid gender selection.'

  const validModalities = ['in_person','online','both']
  const modality = sessionModality || 'in_person'
  if (!validModalities.includes(modality))
    return 'Invalid session modality.'

  return null // no error
}

// ── CORS headers ───────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ── Express app ────────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname)))

// Preflight
app.options('/api/companions/apply', (req, res) => {
  res.set(CORS).status(204).end()
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
    fullName, email, password, dateOfBirth,
    country, city, whatsappNumber,
    displayName, gender, tagline, bio,
  } = body
  const sessionModality = body.sessionModality || 'in_person'
  const cleanEmail = email.toLowerCase().trim()
  const cleanName  = fullName.trim()
  const now        = new Date()
  const id         = crypto.randomUUID()

  let client
  try {
    client = await pool.connect()
  } catch (err) {
    console.error('[apply] db connect failed:', err.message)
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  try {
    // Check duplicate email
    const existing = await client.query(
      'SELECT id FROM companions WHERE email = $1 LIMIT 1',
      [cleanEmail]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'An application with this email already exists. Check your inbox or contact support.',
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique alias
    let alias = generateAlias()
    for (let i = 0; i < 10; i++) {
      const conflict = await client.query(
        'SELECT id FROM companions WHERE alias = $1 LIMIT 1',
        [alias]
      )
      if (conflict.rows.length === 0) break
      alias = generateAlias()
    }

    const displayOrFirst = (displayName && displayName.trim()) || cleanName.split(' ')[0]

    // Insert companion
    await client.query(
      `INSERT INTO companions
        (id, email, hashed_password, name, alias, full_name,
         date_of_birth, country, whatsapp_number, companion_stage,
         onboarding_complete, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        id, cleanEmail, hashedPassword, displayOrFirst, alias, cleanName,
        dateOfBirth, country, whatsappNumber || null, 3,
        false, now, now,
      ]
    )

    // Insert companion_profile
    await client.query(
      `INSERT INTO companion_profiles
        (companion_id, bio, tagline, city, gender,
         session_modality, availability_status, whatsapp_number,
         is_verified, is_live, profile_completeness, is_visible_to_users,
         created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id,
        bio || null, tagline || null, city || null, gender || null,
        sessionModality, 'offline', whatsappNumber || null,
        false, false, 0, false,
        now, now,
      ]
    )

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
    console.error('[apply]', err)
    return res.status(500).json({
      error: 'Something went wrong creating your account. Please try again.',
    })
  } finally {
    if (client) client.release()
  }
})

// ── Start ──────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`BlushBite landing running on http://localhost:${PORT}`)
})
