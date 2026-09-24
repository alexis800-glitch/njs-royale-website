// Durable storage for registrations — Postgres (Neon), reached over the pooled
// connection string that Vercel injects.
//
// A registration counts as successful only once `save` has committed a row. The
// route reports success to the guest from that fact and nothing else.

import { Pool } from 'pg'
import type { RegistrationRecord } from './validate.ts'

export type SavedRegistration = {
  id: string
  createdAt: Date
  /** True when this submission_id had already been stored (a retry or double-click). */
  duplicate: boolean
}

export type SaveInput = {
  record: RegistrationRecord
  submissionId: string
  sourcePath: string
  ipHash: string | null
  userAgent: string | null
  consentMarketing: boolean
  consentVersion: number | null
  consentDecidedAt: string | null
  metaEventId: string
}

export interface RegistrationStore {
  save(input: SaveInput): Promise<SavedRegistration>
  /** Registrations already stored for this IP hash since the given time. */
  countRecentByIpHash(ipHash: string, since: Date): Promise<number>
  recordMetaOutcome(id: string, status: string): Promise<void>
}

/** Connection string, in the order Vercel's Postgres integrations provide one. */
export function connectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    undefined
  )
}

// One pool per process, kept on globalThis so a hot-reloaded module in development
// does not leak a new pool on every edit.
const globalForPool = globalThis as unknown as { njsRegistrationPool?: Pool }

function getPool(): Pool {
  const existing = globalForPool.njsRegistrationPool
  if (existing) return existing

  const connection = connectionString()
  if (!connection) throw new Error('No Postgres connection string configured')

  const pool = new Pool({
    connectionString: connection,
    // Serverless: many short-lived instances, so each holds very few connections.
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  })
  globalForPool.njsRegistrationPool = pool
  return pool
}

// Re-exported so callers have one obvious place to reach for it.
export { hashIp } from './ipHash.ts'

const INSERT = `
  insert into registrations (
    kind, submission_id, invitation_code, full_name, email, phone, phone_display,
    companion_name, attending, party_size, arrival_window, arrival_notes,
    marketing_opt_in, policy_ack, conditions_ack,
    consent_marketing, consent_version, consent_decided_at,
    source_path, ip_hash, user_agent, meta_event_id
  ) values (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
  )
  on conflict (submission_id) do nothing
  returning id, created_at
`

const SELECT_BY_SUBMISSION = `
  select id, created_at from registrations where submission_id = $1
`

export const postgresStore: RegistrationStore = {
  async save(input: SaveInput): Promise<SavedRegistration> {
    const { record } = input
    const pool = getPool()
    const values = [
      record.kind,
      input.submissionId,
      record.invitationCode,
      record.fullName,
      record.email,
      record.phone,
      record.phoneDisplay,
      record.companionName,
      record.attending,
      record.partySize,
      record.arrivalWindow,
      record.arrivalNotes,
      record.marketingOptIn,
      record.policyAck,
      record.conditionsAck,
      input.consentMarketing,
      input.consentVersion,
      input.consentDecidedAt,
      input.sourcePath,
      input.ipHash,
      input.userAgent,
      input.metaEventId,
    ]

    const inserted = await pool.query(INSERT, values)
    if (inserted.rowCount && inserted.rowCount > 0) {
      return { id: inserted.rows[0].id, createdAt: inserted.rows[0].created_at, duplicate: false }
    }

    // `do nothing` fired: this submission is already stored. Report the original
    // row so a double-click or a retry is a success, not a second registration.
    const existing = await pool.query(SELECT_BY_SUBMISSION, [input.submissionId])
    if (existing.rowCount && existing.rowCount > 0) {
      return { id: existing.rows[0].id, createdAt: existing.rows[0].created_at, duplicate: true }
    }
    throw new Error('Registration insert reported a conflict but no row was found')
  },

  async countRecentByIpHash(ipHash: string, since: Date): Promise<number> {
    const pool = getPool()
    const result = await pool.query(
      'select count(*)::int as count from registrations where ip_hash = $1 and created_at > $2',
      [ipHash, since],
    )
    return result.rows[0]?.count ?? 0
  },

  async recordMetaOutcome(id: string, status: string): Promise<void> {
    const pool = getPool()
    await pool.query('update registrations set meta_status = $2 where id = $1', [id, status])
  },
}
