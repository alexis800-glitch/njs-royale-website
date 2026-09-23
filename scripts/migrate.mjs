// Apply the registration schema to a Postgres database.
//
//   DATABASE_URL=... node scripts/migrate.mjs --dry-run   # show the target only
//   DATABASE_URL=... node scripts/migrate.mjs             # apply
//
// The connection string is read from the environment and never from an argument,
// so a credential cannot end up in shell history or in a process listing. The
// target host and database are printed so it is always obvious which branch was
// migrated; the password is never printed.

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS = [join(here, '..', 'lib', 'registrations', 'migrations', '001_registrations.sql')]

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) {
  console.error('No DATABASE_URL (or POSTGRES_URL) in the environment.')
  process.exit(1)
}

/** Host and database only — never the user, password or query string. */
function describeTarget(url) {
  try {
    const parsed = new URL(url)
    return { host: parsed.hostname, database: parsed.pathname.replace(/^\//, '') || '(default)' }
  } catch {
    return { host: '(unparseable)', database: '(unknown)' }
  }
}

const target = describeTarget(connectionString)
console.log(`Target host:     ${target.host}`)
console.log(`Target database: ${target.database}`)

if (process.argv.includes('--dry-run')) {
  console.log('\nDry run: nothing was applied.')
  process.exit(0)
}

const client = new pg.Client({ connectionString })
await client.connect()

try {
  for (const file of MIGRATIONS) {
    const sql = await readFile(file, 'utf8')
    await client.query(sql)
    console.log(`Applied ${file.split('/').pop()}`)
  }

  const columns = await client.query(
    `select column_name, data_type
       from information_schema.columns
      where table_name = 'registrations'
      order by ordinal_position`,
  )
  const indexes = await client.query(
    `select indexname from pg_indexes where tablename = 'registrations' order by indexname`,
  )
  const rows = await client.query('select count(*)::int as count from registrations')

  console.log(`\nregistrations: ${columns.rowCount} columns, ${indexes.rowCount} indexes, ${rows.rows[0].count} rows`)
  console.log(columns.rows.map((c) => `  ${c.column_name} ${c.data_type}`).join('\n'))
} finally {
  await client.end()
}
