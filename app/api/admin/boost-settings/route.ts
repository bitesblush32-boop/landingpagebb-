import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

async function requireAdmin(): Promise<boolean> {
  const adminKey = process.env.CRON_SECRET
  if (!adminKey) return false
  const cookieStore = await cookies()
  return cookieStore.get('bb_admin_key')?.value === adminKey
}

// PATCH — admin updates pricing + enabled flags
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = [
    'header_banner_enabled',
    'right_rail_enabled',
    'mid_grid_enabled',
    'featured_enabled',
    'price_featured_eur',
    'price_header_banner_eur',
    'price_right_rail_eur',
    'price_mid_grid_eur',
    'max_weeks_advance',
  ]

  const sets: string[] = []
  const vals: unknown[] = []
  for (const key of allowed) {
    if (key in body) {
      vals.push(body[key])
      sets.push(`${key} = $${vals.length}`)
    }
  }

  if (!sets.length) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  try {
    await query(
      `INSERT INTO boost_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`
    )
    await query(
      `UPDATE boost_settings SET ${sets.join(', ')} WHERE id = 1`,
      vals
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/boost-settings error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Public GET — companion boost page reads pricing + enabled flags
export async function GET() {
  try {
    const rows = await query<{
      header_banner_enabled: boolean
      right_rail_enabled: boolean
      mid_grid_enabled: boolean
      featured_enabled: boolean
      price_featured_eur: string
      price_header_banner_eur: string
      price_right_rail_eur: string
      price_mid_grid_eur: string
      max_weeks_advance: number
    }>(
      `SELECT
         header_banner_enabled,
         right_rail_enabled,
         mid_grid_enabled,
         featured_enabled,
         price_featured_eur::text,
         price_header_banner_eur::text,
         price_right_rail_eur::text,
         price_mid_grid_eur::text,
         max_weeks_advance
       FROM boost_settings
       WHERE id = 1`
    )

    if (!rows.length) {
      // Table exists but no seed row yet — return defaults
      return NextResponse.json({
        settings: {
          header_banner_enabled: true,
          right_rail_enabled: true,
          mid_grid_enabled: true,
          featured_enabled: true,
          price_featured_eur: '15.00',
          price_header_banner_eur: '25.00',
          price_right_rail_eur: '15.00',
          price_mid_grid_eur: '10.00',
          max_weeks_advance: 4,
        },
      })
    }

    return NextResponse.json({ settings: rows[0] })
  } catch (err) {
    console.error('GET /api/admin/boost-settings error:', err)

    // Return defaults so the boost page still renders
    return NextResponse.json({
      settings: {
        header_banner_enabled: true,
        right_rail_enabled: true,
        mid_grid_enabled: true,
        featured_enabled: true,
        price_featured_eur: '15.00',
        price_header_banner_eur: '25.00',
        price_right_rail_eur: '15.00',
        price_mid_grid_eur: '10.00',
        max_weeks_advance: 4,
      },
    })
  }
}
