import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  const isRailway = (process.env.DATABASE_URL ?? '').includes('rlwy.net')
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,   // Railway proxy needs more time
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    // Railway always requires SSL on the public proxy, even in dev
    ssl: isRailway ? { rejectUnauthorized: false } : false,
  })
}

// Singleton — reused across hot-reloads in dev and across requests in prod
// Setting to undefined forces a fresh pool when this module is re-evaluated
global._pgPool = undefined
export const pool: Pool = global._pgPool ?? (global._pgPool = createPool())

/** Convenience: run a query with automatic connection management */
export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query<T>(text, params)
    return result.rows
  } finally {
    client.release()
  }
}
