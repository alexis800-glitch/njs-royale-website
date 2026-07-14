import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '@/lib/db/schema'
import type { AiosellWebhookPayload } from './types'
import { aiosellFetchUrl, callAiosell } from './aiosellClient'
import { classifyPayload, processWebhook } from './processWebhook'

type Db = NeonHttpDatabase<typeof schema>

export type FetchType = 'inventory' | 'rates' | 'reservations'

export interface FetchSyncResult {
  type: FetchType
  ok: boolean
  httpStatus: number | null
  error: string | null
  // inventory/rates only — result of running the response through the mirror
  rowsUpserted?: number
  warnings?: string[]
  // reservations only — schema is undocumented, so we capture, never apply
  capturedShape?: string
}

/** Top-level JSON shape summary — lets us document an undocumented schema
 *  without dumping guest data into results. Full body is in sync_logs. */
function shapeOf(value: unknown, depth = 0): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    return depth >= 2 ? 'array' : `array<${value.length ? shapeOf(value[0], depth + 1) : 'empty'}>`
  }
  if (typeof value === 'object') {
    if (depth >= 2) return 'object'
    return `{ ${Object.keys(value as object).join(', ')} }`
  }
  return typeof value
}

/**
 * On-demand FETCH reconciliation (us → Aiosell). This is the recovery path
 * for webhook pushes missed while our endpoint was down.
 *
 * - inventory / rates: the response is applied to the Neon mirror through
 *   the SAME mapper the webhook uses (processWebhook), so FETCH and push can
 *   never disagree about how data lands.
 * - reservations: the response schema is undocumented — the call is
 *   capture-only. The redacted body lands in sync_logs and only a shape
 *   summary is returned; nothing is written to mirror or booking tables.
 *
 * Scheduled (cron) reconciliation is deliberately NOT implemented — deferred
 * until separately approved.
 */
export async function fetchSync(
  db: Db,
  type: FetchType,
  startDate: string,
  endDate: string
): Promise<FetchSyncResult> {
  const hotelCode = process.env.AIOSELL_HOTEL_CODE
  if (!hotelCode) throw new Error('AIOSELL_HOTEL_CODE is not set')

  const result = await callAiosell(db, {
    url: aiosellFetchUrl(),
    requestBody: { type, hotelCode, startDate, endDate },
    operation: `fetch_${type}`,
    attempt: 1,
  })

  if (!result.ok) {
    return { type, ok: false, httpStatus: result.httpStatus, error: result.error }
  }

  if (type === 'reservations') {
    return {
      type,
      ok: true,
      httpStatus: result.httpStatus,
      error: null,
      capturedShape: shapeOf(result.body),
    }
  }

  // The FETCH response format is only partially documented. If it carries an
  // `updates` array it is webhook-shaped and goes through the shared mapper;
  // anything else is captured in sync_logs and reported for documentation.
  const body = result.body as AiosellWebhookPayload | null
  if (!body || !Array.isArray(body.updates)) {
    return {
      type,
      ok: false,
      httpStatus: result.httpStatus,
      error: `Unrecognized FETCH response shape: ${shapeOf(result.body)} — captured in sync_logs, nothing applied`,
    }
  }

  const eventType = classifyPayload(body)
  if (eventType === 'unknown') {
    return {
      type,
      ok: false,
      httpStatus: result.httpStatus,
      error: 'FETCH response did not classify as inventory/rates — captured in sync_logs, nothing applied',
    }
  }

  const processed = await processWebhook(db, eventType, body)
  return {
    type,
    ok: true,
    httpStatus: result.httpStatus,
    error: null,
    rowsUpserted: processed.rowsUpserted,
    warnings: processed.warnings,
  }
}
