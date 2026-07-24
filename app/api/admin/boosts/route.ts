import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

async function requireAdmin(): Promise<boolean> {
  const adminKey = process.env.CRON_SECRET
  if (!adminKey) return false
  const cookieStore = await cookies()
  return cookieStore.get('bb_admin_key')?.value === adminKey
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const community = searchParams.get('community')
  const status    = searchParams.get('status') // 'active' | 'cancelled' | '' (all)

  const conditions: string[] = []
  const params: unknown[]    = []

  if (community && ['female', 'male', 'shemale'].includes(community)) {
    params.push(community)
    conditions.push(`cb.community = $${params.length}`)
  }
  if (status && ['active', 'cancelled'].includes(status)) {
    params.push(status)
    conditions.push(`cb.status = $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const rows = await query<{
      id: string
      companion_id: string
      companion_name: string
      boost_type: string
      community: string
      week_start: string
      week_end: string
      price_eur: string
      status: string
      is_enabled: boolean
      banner_image_url: string | null
      banner_headline: string | null
      banner_tagline: string | null
      payment_status: string
      created_at: string
    }>(
      `SELECT
         cb.id,
         cb.companion_id,
         c.name  AS companion_name,
         cb.boost_type,
         cb.community,
         cb.week_start::text,
         cb.week_end::text,
         cb.price_eur::text,
         cb.status,
         cb.is_enabled,
         cb.banner_image_url,
         cb.banner_headline,
         cb.banner_tagline,
         cb.payment_status,
         cb.created_at::text
       FROM companion_boosts cb
       JOIN companions c ON c.id = cb.companion_id
       ${where}
       ORDER BY cb.week_start DESC, cb.created_at DESC`,
      params
    )

    return NextResponse.json({ boosts: rows })
  } catch (err) {
    console.error('GET /api/admin/boosts error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
