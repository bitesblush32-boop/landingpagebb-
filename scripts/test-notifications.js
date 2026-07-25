// Temp script — fires one test notification of every known type at a companion,
// so you can see them all in the dashboard bell UI.
// Run with: node scripts/test-notifications.js
//
// Change COMPANION_EMAIL below to the companion account you want to test with.

const COMPANION_EMAIL = 'judo1@yopmail.com'

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Pull DATABASE_URL out of .env.local if it isn't already in the environment
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env.local')
  const match = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.*)$/m)
  if (match) process.env.DATABASE_URL = match[1].trim()
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.DATABASE_URL || '').includes('rlwy.net') ? { rejectUnauthorized: false } : false,
})

// One sample per notification_type currently allowed by the shared DB's
// `notif_type_check` constraint (fetched live — do not add types without
// re-checking the constraint, the insert will fail otherwise).
const SAMPLES = [
  { type: 'profile_viewed', title: 'Someone noticed you', body: 'A dreamer just viewed your profile.' },
  { type: 'story_linked', title: 'Your story was linked', body: 'A dreamer linked to one of your stories.' },
  { type: 'booking_request', title: 'A new invitation awaits', body: 'Someone would love to book time with you.' },
  { type: 'admin_approved', title: 'Your application was approved', body: 'Welcome — your profile is now live.' },
  { type: 'verification_complete', title: "You're verified", body: 'Your verification badge is now live on your profile.' },
  { type: 'bridge_approved', title: 'Bridge request approved', body: 'Your bridge request has been approved.' },
  { type: 'story_like', title: 'Someone liked your story', body: 'A dreamer liked one of your stories.' },
  { type: 'story_save', title: 'Someone saved your story', body: 'A dreamer saved one of your stories.' },
  { type: 'story_comment', title: 'New comment on your story', body: 'A dreamer commented on one of your stories.' },
  { type: 'comment_reply', title: 'Someone replied to you', body: 'A dreamer replied to your comment.' },
  { type: 'comment_like', title: 'Someone liked your comment', body: 'A dreamer liked your comment.' },
  { type: 'booking_confirmed', title: 'Your invitation was accepted', body: 'A dreamer has accepted your booking request.' },
  { type: 'booking_declined', title: 'A change of plans', body: "Your booking request wasn't accepted this time." },
  { type: 'booking_reminder', title: 'Your session is coming up', body: 'A booked session begins soon — take a look.' },
  { type: 'badge_awarded', title: 'A new badge is yours', body: "You've earned a new badge." },
  { type: 'payment_received', title: 'Payment received', body: "You've received a payment." },
  { type: 'payout_processed', title: 'Payout sent', body: 'Your payout has been processed.' },
  { type: 'new_device_login', title: 'New sign-in detected', body: 'Your account was just signed into from a new device.' },
  { type: 'password_changed', title: 'Password changed', body: 'Your account password was just changed.' },
]

async function main() {
  const client = await pool.connect()
  try {
    const res = await client.query('SELECT id FROM companions WHERE email = $1', [COMPANION_EMAIL])
    if (res.rowCount === 0) {
      console.error(`No companion found with email ${COMPANION_EMAIL}`)
      process.exit(1)
    }
    const companionId = res.rows[0].id
    console.log(`Firing ${SAMPLES.length} test notifications at companion ${companionId} (${COMPANION_EMAIL})...`)

    for (const s of SAMPLES) {
      try {
        await client.query(
          `INSERT INTO notifications (recipient_type, recipient_id, notification_type, title, body)
           VALUES ('companion', $1, $2, $3, $4)`,
          [companionId, s.type, s.title, s.body]
        )
        console.log(`  ✓ ${s.type}`)
      } catch (err) {
        console.error(`  ✗ ${s.type}: ${err.message}`)
      }
    }

    console.log('Done. Open /dashboard and check the bell icon.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
