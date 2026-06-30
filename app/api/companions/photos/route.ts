import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    `SELECT cp.id, cp.url, cp.is_primary, cp.sort_order, cp.is_approved, cp.created_at
     FROM companion_photos cp
     JOIN companion_profiles prof ON prof.id = cp.companion_profile_id
     WHERE prof.companion_id = $1 AND cp.deleted_at IS NULL
     ORDER BY cp.sort_order ASC, cp.created_at ASC`,
    [session.sub]
  )
  return NextResponse.json(rows)
}
