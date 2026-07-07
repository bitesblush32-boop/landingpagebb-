import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fp') ?? ''

  // SHA-256 hex is exactly 64 chars
  if (fp.length !== 64 || !/^[0-9a-f]+$/.test(fp)) {
    return NextResponse.json({ found: false })
  }

  const rows = await query<{ community: string }>(
    'SELECT community FROM device_community_bindings WHERE fingerprint_hash = $1 LIMIT 1',
    [fp]
  )

  if (rows.length === 0) return NextResponse.json({ found: false })

  // Fire-and-forget last_seen update
  query(
    'UPDATE device_community_bindings SET last_seen = now() WHERE fingerprint_hash = $1',
    [fp]
  ).catch(() => {})

  return NextResponse.json({ found: true, community: rows[0].community })
}
