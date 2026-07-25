import { query } from '@/lib/db'
import { sendPushToCompanion } from '@/lib/push'

export type NotificationRecipientType = 'companion' | 'user'

interface CreateNotificationInput {
  recipientType: NotificationRecipientType
  recipientId: string
  notificationType: string
  title: string
  body: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

/**
 * Inserts into the shared `notifications` table (also read by blushbite.co).
 * Web Push is fired for companion recipients only — `push_subscriptions` has no
 * user-side rows managed from this repo. Push is best-effort and never blocks
 * the notification insert.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await query(
    `INSERT INTO notifications
       (recipient_type, recipient_id, notification_type, title, body, action_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.recipientType,
      input.recipientId,
      input.notificationType,
      input.title,
      input.body,
      input.actionUrl ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  )

  if (input.recipientType === 'companion') {
    sendPushToCompanion(input.recipientId, input.actionUrl).catch((err) =>
      console.error('sendPushToCompanion failed:', err)
    )
  }
}
