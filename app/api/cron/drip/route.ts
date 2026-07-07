import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import {
  sendProfileNudgeEmail,
  sendPhotoNudgeEmail,
  sendGoLiveNudgeEmail,
} from '@/lib/email'

// Secured with CRON_SECRET — set this env var in Railway and pass it as
// Authorization: Bearer <CRON_SECRET> when calling this route from cron.
//
// Railway cron config (railway.toml):
//   [[crons]]
//   schedule = "*/15 * * * *"
//   command  = "curl -s -X POST https://blushbite.live/api/cron/drip -H 'Authorization: Bearer $CRON_SECRET'"

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { profile_4h: 0, photos_24h: 0, live_72h: 0, errors: 0 }
  const client = await pool.connect()

  try {
    // ── Nudge 1: T+4h — profile_completeness < 30 ──────────────────────────
    const nudge1Rows = await client.query<{
      id: string
      email: string
      name: string
      profile_completeness: number
    }>(
      `SELECT c.id, c.email, c.name, cp.profile_completeness
       FROM companions c
       JOIN companion_profiles cp ON cp.companion_id = c.id
       WHERE c.created_at BETWEEN now() - INTERVAL '5 hours' AND now() - INTERVAL '3 hours'
         AND cp.profile_completeness < 30
         AND NOT EXISTS (
           SELECT 1 FROM companion_nudges n
           WHERE n.companion_id = c.id AND n.nudge_type = 'profile_4h'
         )`
    )
    for (const row of nudge1Rows.rows) {
      try {
        await sendProfileNudgeEmail(row.email, row.name, row.profile_completeness)
        await client.query(
          `INSERT INTO companion_nudges (companion_id, nudge_type) VALUES ($1, 'profile_4h')
           ON CONFLICT DO NOTHING`,
          [row.id]
        )
        results.profile_4h++
      } catch {
        results.errors++
      }
    }

    // ── Nudge 2: T+24h — no photos uploaded ────────────────────────────────
    const nudge2Rows = await client.query<{ id: string; email: string; name: string }>(
      `SELECT c.id, c.email, c.name
       FROM companions c
       JOIN companion_profiles cp ON cp.companion_id = c.id
       WHERE c.created_at BETWEEN now() - INTERVAL '25 hours' AND now() - INTERVAL '23 hours'
         AND NOT EXISTS (
           SELECT 1 FROM companion_photos ph
           WHERE ph.companion_profile_id = cp.id AND ph.deleted_at IS NULL
         )
         AND NOT EXISTS (
           SELECT 1 FROM companion_nudges n
           WHERE n.companion_id = c.id AND n.nudge_type = 'photos_24h'
         )`
    )
    for (const row of nudge2Rows.rows) {
      try {
        await sendPhotoNudgeEmail(row.email, row.name)
        await client.query(
          `INSERT INTO companion_nudges (companion_id, nudge_type) VALUES ($1, 'photos_24h')
           ON CONFLICT DO NOTHING`,
          [row.id]
        )
        results.photos_24h++
      } catch {
        results.errors++
      }
    }

    // ── Nudge 3: T+72h — is_live = false ───────────────────────────────────
    const nudge3Rows = await client.query<{
      id: string
      email: string
      name: string
      city: string | null
    }>(
      `SELECT c.id, c.email, c.name, cp.city
       FROM companions c
       JOIN companion_profiles cp ON cp.companion_id = c.id
       WHERE c.created_at BETWEEN now() - INTERVAL '73 hours' AND now() - INTERVAL '71 hours'
         AND cp.is_live = false
         AND NOT EXISTS (
           SELECT 1 FROM companion_nudges n
           WHERE n.companion_id = c.id AND n.nudge_type = 'live_72h'
         )`
    )
    for (const row of nudge3Rows.rows) {
      try {
        await sendGoLiveNudgeEmail(row.email, row.name, row.city)
        await client.query(
          `INSERT INTO companion_nudges (companion_id, nudge_type) VALUES ($1, 'live_72h')
           ON CONFLICT DO NOTHING`,
          [row.id]
        )
        results.live_72h++
      } catch {
        results.errors++
      }
    }

    return NextResponse.json({ ok: true, ...results })
  } finally {
    client.release()
  }
}
