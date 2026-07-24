import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

async function requireAdmin(): Promise<boolean> {
  const adminKey = process.env.CRON_SECRET
  if (!adminKey) return false
  const cookieStore = await cookies()
  return cookieStore.get('bb_admin_key')?.value === adminKey
}

// PATCH — toggle is_enabled or cancel a boost
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: { is_enabled?: boolean; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    if (typeof body.is_enabled === 'boolean') {
      await query(
        `UPDATE companion_boosts SET is_enabled = $1 WHERE id = $2`,
        [body.is_enabled, id]
      )
    } else if (body.status === 'cancelled') {
      await query(
        `UPDATE companion_boosts SET status = 'cancelled' WHERE id = $1`,
        [id]
      )
    } else if (body.status === 'active') {
      await query(
        `UPDATE companion_boosts SET status = 'active' WHERE id = $1`,
        [id]
      )
    } else {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/boosts/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — hard delete a boost record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await query(`DELETE FROM companion_boosts WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/boosts/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
