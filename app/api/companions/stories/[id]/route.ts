import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { title, content, excerpt } = await req.json().catch(() => ({}))

  const client = await pool.connect()
  try {
    const res = await client.query(
      `UPDATE stories SET
         title    = COALESCE($1, title),
         content  = COALESCE($2, content),
         excerpt  = COALESCE($3, excerpt),
         moderation_status = 'pending',
         updated_at = NOW()
       WHERE id = $4 AND author_companion_id = $5 AND deleted_at IS NULL`,
      [title ?? null, content ?? null, excerpt ?? null, id, session.sub]
    )
    if (res.rowCount === 0) return NextResponse.json({ error: 'Story not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const client = await pool.connect()
  try {
    const res = await client.query(
      `UPDATE stories SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND author_companion_id = $2 AND deleted_at IS NULL`,
      [id, session.sub]
    )
    if (res.rowCount === 0) return NextResponse.json({ error: 'Story not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } finally {
    client.release()
  }
}
