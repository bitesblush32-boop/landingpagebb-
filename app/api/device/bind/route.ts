import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/session'

const VALID = ['female', 'male', 'shemale']

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { fingerprint_hash, community } = body as Record<string, string>

  if (
    !fingerprint_hash ||
    fingerprint_hash.length !== 64 ||
    !/^[0-9a-f]+$/.test(fingerprint_hash)
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid fingerprint' }, { status: 400 })
  }
  if (!VALID.includes(community)) {
    return NextResponse.json({ ok: false, error: 'Invalid community' }, { status: 400 })
  }

  // Attach companion_id if the request comes from an authenticated session
  const session = await getSession().catch(() => null)
  const companionId = session?.sub ?? null

  await query(
    `INSERT INTO device_community_bindings (fingerprint_hash, community, companion_id, created_at, last_seen)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (fingerprint_hash) DO UPDATE
       SET community     = $2,
           companion_id  = COALESCE($3, device_community_bindings.companion_id),
           last_seen     = now()`,
    [fingerprint_hash, community, companionId]
  )

  return NextResponse.json({ ok: true })
}
