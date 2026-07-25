// Adds companion support to the shared `push_subscriptions` table.
// Run with: node scripts/migrate-push-companion.js
//
// This table is also read by blushbite.co — verified before writing this that the
// table currently has 0 rows and 0 duplicate endpoints, so this is a safe,
// non-destructive, additive change with nothing to migrate/backfill.

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env.local')
  const match = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.*)$/m)
  if (match) process.env.DATABASE_URL = match[1].trim()
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.DATABASE_URL || '').includes('rlwy.net') ? { rejectUnauthorized: false } : false,
})

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('1. Adding companion_id column...')
    await client.query(`
      ALTER TABLE push_subscriptions
      ADD COLUMN IF NOT EXISTS companion_id UUID REFERENCES companions(id) ON DELETE CASCADE
    `)

    console.log('2. Making user_id nullable...')
    await client.query(`ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL`)

    console.log('3. Requiring at least one of user_id / companion_id...')
    await client.query(`
      ALTER TABLE push_subscriptions
      ADD CONSTRAINT push_sub_recipient_check CHECK (user_id IS NOT NULL OR companion_id IS NOT NULL)
    `)

    console.log('4. Replacing (user_id, endpoint) unique constraint with a plain endpoint unique...')
    await client.query(`ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS uq_push_endpoint`)
    await client.query(`ALTER TABLE push_subscriptions ADD CONSTRAINT uq_push_endpoint UNIQUE (endpoint)`)

    await client.query('COMMIT')
    console.log('Done. push_subscriptions now supports companion recipients.')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
