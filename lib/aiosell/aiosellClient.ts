import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '@/lib/db/schema'
import { syncLogs } from '@/lib/db/schema'

type Db = NeonHttpDatabase<typeof schema>

export type SyncOperation =
  | 'book'
  | 'modify'
  | 'cancel'
  | 'fetch_inventory'
  | 'fetch_rates'
  | 'fetch_reservations'

export interface AiosellCallResult {
  ok: boolean // HTTP-level success AND body parsed with success !== false
  httpStatus: number | null // null on network-level failure
  body: unknown // parsed JSON, or { rawText } if not JSON
  error: string | null
  retryable: boolean // network error or 5xx — 4xx is a definitive rejection
}

const REQUEST_TIMEOUT_MS = 15_000

// Keys whose values must never be persisted, matched case-insensitively at
// any depth of a logged payload.
const SENSITIVE_KEY = /authorization|password|passwd|secret|token|api[-_]?key|credential/i

/** Recursively strips sensitive keys from a payload before it is logged. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY.test(k) ? '[REDACTED]' : redact(v, depth + 1)
  }
  return out
}

function basicAuthHeader(): string {
  const user = process.env.AIOSELL_USERNAME
  const pass = process.env.AIOSELL_PASSWORD
  if (!user || !pass) {
    throw new Error('AIOSELL_USERNAME / AIOSELL_PASSWORD are not set')
  }
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

export function aiosellPushUrl(): string {
  const base = process.env.AIOSELL_BASE_URL
  const partner = process.env.AIOSELL_PARTNER_ID
  if (!base || !partner) throw new Error('AIOSELL_BASE_URL / AIOSELL_PARTNER_ID are not set')
  return `${base.replace(/\/$/, '')}/api/v2/cm/push/${partner}`
}

export function aiosellFetchUrl(): string {
  const base = process.env.AIOSELL_BASE_URL
  const partner = process.env.AIOSELL_PARTNER_ID
  if (!base || !partner) throw new Error('AIOSELL_BASE_URL / AIOSELL_PARTNER_ID are not set')
  return `${base.replace(/\/$/, '')}/api/v2/cm/data/${partner}`
}

/**
 * Makes ONE outbound call to Aiosell and writes ONE redacted row to
 * sync_logs — every attempt is audited, success or not. The Authorization
 * header is constructed inside this function and is never part of any
 * logged object; error messages are reduced to `message` only so no
 * library can echo credentials into the audit trail.
 */
export async function callAiosell(
  db: Db,
  args: {
    url: string
    requestBody: Record<string, unknown>
    operation: SyncOperation
    bookingId?: string | null
    attempt: number
  }
): Promise<AiosellCallResult> {
  const { url, requestBody, operation, bookingId, attempt } = args

  let httpStatus: number | null = null
  let body: unknown = null
  let error: string | null = null
  let retryable = false
  let ok = false

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: basicAuthHeader(),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    httpStatus = response.status
    const rawText = await response.text()
    try {
      body = rawText ? JSON.parse(rawText) : null
    } catch {
      body = { rawText: rawText.slice(0, 4000) }
    }

    if (!response.ok) {
      retryable = response.status >= 500
      error = `HTTP ${response.status}`
    } else if (body && typeof body === 'object' && (body as { success?: unknown }).success === false) {
      // 200 with success:false is a definitive business rejection, not retryable
      error = `Aiosell responded success=false: ${String((body as { message?: unknown }).message ?? '')}`
    } else {
      ok = true
    }
  } catch (err) {
    // Network-level failure (DNS, timeout, refused). Message only — never
    // the full error object, which can carry request internals.
    error = err instanceof Error ? err.message : 'network error'
    retryable = true
  }

  try {
    await db.insert(syncLogs).values({
      bookingId: bookingId ?? null,
      operation,
      attempt,
      requestPayload: redact(requestBody),
      responsePayload: body === null ? null : redact(body),
      httpStatus,
      success: ok,
      error,
    })
  } catch (logErr) {
    console.error(
      `sync_logs write failed for ${operation} attempt ${attempt}:`,
      logErr instanceof Error ? logErr.message : 'unknown'
    )
  }

  return { ok, httpStatus, body, error, retryable }
}

/** Depth-first search for a cmBookingId anywhere in an Aiosell response. */
export function findCmBookingId(value: unknown, depth = 0): string | null {
  if (depth > 6 || value === null || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    for (const v of value) {
      const found = findCmBookingId(v, depth + 1)
      if (found) return found
    }
    return null
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k.toLowerCase() === 'cmbookingid' && (typeof v === 'string' || typeof v === 'number')) {
      return String(v)
    }
    const found = findCmBookingId(v, depth + 1)
    if (found) return found
  }
  return null
}
