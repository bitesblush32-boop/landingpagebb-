import webpush from 'web-push'
import { query } from '@/lib/db'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@blushbite.co'

let configured = false
function ensureConfigured() {
  if (configured) return
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys are not set — see .env.local')
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  configured = true
}

interface PushSubRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Sends a discreet push to every subscription registered for a companion.
 * Payload never includes explicit content — generic text only, per platform policy.
 * Dead subscriptions (410 Gone / 404) are pruned automatically.
 */
export async function sendPushToCompanion(companionId: string, url?: string): Promise<void> {
  ensureConfigured()

  const subs = await query<PushSubRow>(
    `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE companion_id = $1`,
    [companionId]
  )
  if (subs.length === 0) return

  const payload = JSON.stringify({
    title: 'BlushBite',
    body: 'You have a new notification.',
    url: url ?? '/dashboard',
  })

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await query(`DELETE FROM push_subscriptions WHERE id = $1`, [sub.id]).catch(() => {})
        } else {
          console.error('sendPushToCompanion failed:', err)
        }
      }
    })
  )
}
