// One-time migration script — run with: node scripts/migrate.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('Running migrations...')

    // D1: Add photo_verification_status to companion_photos
    await client.query(`
      ALTER TABLE companion_photos
      ADD COLUMN IF NOT EXISTS photo_verification_status VARCHAR(20) DEFAULT 'pending'
    `)
    console.log('✓  companion_photos.photo_verification_status added')

    console.log('All migrations complete.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
