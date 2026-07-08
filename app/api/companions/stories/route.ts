import { NextRequest, NextResponse } from 'next/server'
import { query, pool } from '@/lib/db'
import { getSession } from '@/lib/session'
import { randomUUID } from 'crypto'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await query(
      `SELECT id, title, excerpt, moderation_status, like_count, view_count,
              comment_count, save_count, created_at
       FROM stories
       WHERE author_companion_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [session.sub]
    )
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Record<string, unknown> = await req.json().catch(() => ({}))
  const { title, content, excerpt } = body

  if (!content || String(content).trim().length < 20) {
    return NextResponse.json(
      { error: 'Story content must be at least 20 characters.' },
      { status: 400 }
    )
  }

  const id = randomUUID()
  const client = await pool.connect()
  try {
    await client.query(
      `INSERT INTO stories
        (id, title, body, excerpt, author_companion_id,
         author_type, is_published, moderation_status, published_at,
         like_count, view_count, comment_count, save_count, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,
               'companion', true, 'approved', NOW(),
               0,0,0,0,NOW(),NOW())`,
      [id, title ?? null, content, excerpt ?? null, session.sub]
    )
    return NextResponse.json({ id, ok: true }, { status: 201 })
  } finally {
    client.release()
  }
}
