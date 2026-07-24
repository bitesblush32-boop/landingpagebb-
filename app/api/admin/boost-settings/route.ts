import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

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
