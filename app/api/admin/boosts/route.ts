import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

function isAdminAuthed(req: Request): boolean {
  // Accept Bearer token (for programmatic use) OR bb_admin_key cookie (for browser)
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ') && auth.slice(7) === process.env.CRON_SECRET) return true
  return false
}

async function isAdminCookieValid(): Promise<boolean> {
  try {
    const jar = await cookies()
    const key = jar.get('bb_admin_key')?.value
    return key === process.env.CRON_SECRET
  } catch {
    return false
  }
}

// GET — all boosts (admin)
export async function GET(req: Request) {
  const authed = isAdminAuthed(req) || await isAdminCookieValid()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusFilter    = searchParams.get('status')    // 'active'|'cancelled'|'expired'|null
  const communityFilter = searchParams.get('community') // 'female'|'male'|'shemale'|null

  const conditions: string[] = ['week_end >= CURRENT_DATE - INTERVAL \'7 days\'']
  const params: unknown[] = []

  if (statusFilter) {
    params.push(statusFilter)
    conditions.push(`cb.status = $${params.length}`)
  }
  if (communityFilter) {
    params.push(communityFilter)
    conditions.push(`cb.community = $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const rows = await query<{
      id: string
      companion_id: string
      companion_name: string
      companion_email: string
      boost_type: string
      community: string
      week_start: string
      week_end: string
      price_eur: string
      status: string
      is_enabled: boolean
      payment_status: string
      banner_image_url: string | null
      created_at: string
    }>(
      `SELECT
         cb.id, cb.companion_id::text,
         c.name  AS companion_name,
         c.email AS companion_email,
         cb.boost_type, cb.community,
         cb.week_start::text, cb.week_end::text,
         cb.price_eur::text, cb.status, cb.is_enabled,
         cb.payment_status, cb.banner_image_url,
         cb.created_at::text
       FROM companion_boosts cb
       JOIN companions c ON c.id = cb.companion_id
       ${where}
       ORDER BY cb.week_start DESC, cb.community, cb.boost_type`,
      params
    )

    // Summary counts
    const active    = rows.filter(r => r.status === 'active' && r.is_enabled).length
    const disabled  = rows.filter(r => r.status === 'active' && !r.is_enabled).length
    const cancelled = rows.filter(r => r.status === 'cancelled').length

    return NextResponse.json({ boosts: rows, summary: { active, disabled, cancelled } })
  } catch (err) {
    console.error('GET /api/admin/boosts error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
