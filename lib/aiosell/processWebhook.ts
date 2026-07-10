import { sql } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '@/lib/db/schema'
import {
  dailyInventory,
  dailyRates,
  ratePlans,
  rateplanRestrictions,
  rooms,
  roomRestrictions,
} from '@/lib/db/schema'
import type {
  AiosellRestrictions,
  AiosellWebhookPayload,
  WebhookEventType,
} from './types'

type Db = NeonHttpDatabase<typeof schema>

// Guard against a malformed range flooding the tables (normal pushes cover
// days or weeks; a year-ahead push is 366 rows).
const MAX_DAYS_PER_UPDATE = 400

/**
 * Aiosell POSTs all four update types to one URL. Discriminate by shape:
 * - updates[].rooms[] without `restrictions`        → inventory
 * - updates[].rooms[] with `restrictions`           → inventory_restrictions
 * - updates[].rates[] with a `rate` field           → rates
 * - updates[].rates[] with `restrictions`, no rate  → rate_restrictions
 */
export function classifyPayload(payload: AiosellWebhookPayload): WebhookEventType {
  const updates = payload?.updates
  if (!Array.isArray(updates) || updates.length === 0) return 'unknown'

  for (const update of updates) {
    if (Array.isArray(update?.rooms) && update.rooms.length > 0) {
      return update.rooms.some((r) => r && typeof r === 'object' && 'restrictions' in r)
        ? 'inventory_restrictions'
        : 'inventory'
    }
    if (Array.isArray(update?.rates) && update.rates.length > 0) {
      if (update.rates.some((r) => typeof r?.rate === 'number')) return 'rates'
      if (update.rates.some((r) => r && typeof r === 'object' && 'restrictions' in r)) {
        return 'rate_restrictions'
      }
    }
  }
  return 'unknown'
}

/** Expands a YYYY-MM-DD range inclusively into one string per day. */
export function expandDateRange(startDate: string, endDate: string): string[] {
  const isoDay = /^\d{4}-\d{2}-\d{2}$/
  if (!isoDay.test(startDate) || !isoDay.test(endDate)) {
    throw new Error(`Invalid date range: "${startDate}" → "${endDate}"`)
  }
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    throw new Error(`Invalid date range: "${startDate}" → "${endDate}"`)
  }
  const days: string[] = []
  for (let t = start.getTime(); t <= end.getTime(); t += 86_400_000) {
    if (days.length >= MAX_DAYS_PER_UPDATE) {
      throw new Error(`Date range exceeds ${MAX_DAYS_PER_UPDATE} days: "${startDate}" → "${endDate}"`)
    }
    days.push(new Date(t).toISOString().slice(0, 10))
  }
  return days
}

function restrictionColumns(r: AiosellRestrictions | undefined) {
  return {
    stopSell: r?.stopSell ?? false,
    minimumStay: r?.minimumStay ?? null,
    maximumStay: r?.maximumStay ?? null,
    closeOnArrival: r?.closeOnArrival ?? false,
    closeOnDeparture: r?.closeOnDeparture ?? false,
    minimumStayArrival: r?.minimumStayArrival ?? null,
    maximumStayArrival: r?.maximumStayArrival ?? null,
    exactStayArrival: r?.exactStayArrival ?? null,
    minimumAdvanceReservation: r?.minimumAdvanceReservation ?? null,
    maximumAdvanceReservation: r?.maximumAdvanceReservation ?? null,
  }
}

// Multi-row upserts can hit the same (id, date) twice inside one statement,
// which Postgres rejects — keep the last write per key instead.
function dedupeByKey<T>(rows: T[], key: (row: T) => string): T[] {
  const map = new Map<string, T>()
  for (const row of rows) map.set(key(row), row)
  return Array.from(map.values())
}

export interface ProcessResult {
  eventType: WebhookEventType
  rowsUpserted: number
  warnings: string[]
}

/**
 * Applies a classified Aiosell webhook payload to the local mirror tables.
 * Aiosell is the source of truth: every upsert overwrites local values.
 * Unknown room/rateplan codes are skipped and reported as warnings (the
 * caller still returns HTTP 200 — Aiosell must never see a 500 for these).
 */
export async function processWebhook(
  db: Db,
  eventType: WebhookEventType,
  payload: AiosellWebhookPayload
): Promise<ProcessResult> {
  const warnings: string[] = []

  const expectedHotelCode = process.env.AIOSELL_HOTEL_CODE
  if (
    expectedHotelCode &&
    payload.hotelCode &&
    payload.hotelCode.toLowerCase() !== expectedHotelCode.toLowerCase()
  ) {
    // Docs and support disagree on the sandbox hotel code, so mismatches are
    // logged but still processed. Tighten to a hard reject before production.
    warnings.push(
      `hotelCode mismatch: received "${payload.hotelCode}", expected "${expectedHotelCode}" — processed anyway (sandbox)`
    )
  }

  // Case-insensitive lookup maps: Aiosell's docs and support disagree on code
  // casing, so inbound codes match regardless of case.
  const roomRows = await db.select().from(rooms)
  const planRows = await db.select().from(ratePlans)
  const roomIdByCode = new Map(roomRows.map((r) => [r.roomCode.toLowerCase(), r.id]))
  const planIdByCode = new Map(planRows.map((p) => [p.rateplanCode.toLowerCase(), p.id]))

  let rowsUpserted = 0

  for (const update of payload.updates ?? []) {
    const dates = expandDateRange(update.startDate, update.endDate)

    if (eventType === 'inventory' || eventType === 'inventory_restrictions') {
      const inventoryRows: (typeof dailyInventory.$inferInsert)[] = []
      const restrictionRows: (typeof roomRestrictions.$inferInsert)[] = []

      for (const room of update.rooms ?? []) {
        const roomId = roomIdByCode.get(String(room.roomCode ?? '').toLowerCase())
        if (!roomId) {
          warnings.push(`Unknown roomCode "${room.roomCode}" — skipped`)
          continue
        }
        for (const day of dates) {
          if (typeof room.available === 'number') {
            inventoryRows.push({ roomId, date: day, available: room.available })
          }
          if (eventType === 'inventory_restrictions' && room.restrictions) {
            restrictionRows.push({ roomId, date: day, ...restrictionColumns(room.restrictions) })
          }
        }
      }

      const uniqueInventory = dedupeByKey(inventoryRows, (r) => `${r.roomId}|${r.date}`)
      if (uniqueInventory.length > 0) {
        await db
          .insert(dailyInventory)
          .values(uniqueInventory)
          .onConflictDoUpdate({
            target: [dailyInventory.roomId, dailyInventory.date],
            set: {
              available: sql`excluded.available`,
              updatedAt: sql`now()`,
            },
          })
        rowsUpserted += uniqueInventory.length
      }

      const uniqueRestrictions = dedupeByKey(restrictionRows, (r) => `${r.roomId}|${r.date}`)
      if (uniqueRestrictions.length > 0) {
        await db
          .insert(roomRestrictions)
          .values(uniqueRestrictions)
          .onConflictDoUpdate({
            target: [roomRestrictions.roomId, roomRestrictions.date],
            set: {
              stopSell: sql`excluded.stop_sell`,
              minimumStay: sql`excluded.minimum_stay`,
              maximumStay: sql`excluded.maximum_stay`,
              closeOnArrival: sql`excluded.close_on_arrival`,
              closeOnDeparture: sql`excluded.close_on_departure`,
              minimumStayArrival: sql`excluded.minimum_stay_arrival`,
              maximumStayArrival: sql`excluded.maximum_stay_arrival`,
              exactStayArrival: sql`excluded.exact_stay_arrival`,
              minimumAdvanceReservation: sql`excluded.minimum_advance_reservation`,
              maximumAdvanceReservation: sql`excluded.maximum_advance_reservation`,
              updatedAt: sql`now()`,
            },
          })
        rowsUpserted += uniqueRestrictions.length
      }
    }

    if (eventType === 'rates' || eventType === 'rate_restrictions') {
      const rateRows: (typeof dailyRates.$inferInsert)[] = []
      const restrictionRows: (typeof rateplanRestrictions.$inferInsert)[] = []

      for (const rate of update.rates ?? []) {
        const ratePlanId = planIdByCode.get(String(rate.rateplanCode ?? '').toLowerCase())
        if (!ratePlanId) {
          warnings.push(`Unknown rateplanCode "${rate.rateplanCode}" — skipped`)
          continue
        }
        for (const day of dates) {
          if (typeof rate.rate === 'number') {
            rateRows.push({ ratePlanId, date: day, rate: String(rate.rate) })
          }
          if (eventType === 'rate_restrictions' && rate.restrictions) {
            restrictionRows.push({ ratePlanId, date: day, ...restrictionColumns(rate.restrictions) })
          }
        }
      }

      const uniqueRates = dedupeByKey(rateRows, (r) => `${r.ratePlanId}|${r.date}`)
      if (uniqueRates.length > 0) {
        await db
          .insert(dailyRates)
          .values(uniqueRates)
          .onConflictDoUpdate({
            target: [dailyRates.ratePlanId, dailyRates.date],
            set: {
              rate: sql`excluded.rate`,
              updatedAt: sql`now()`,
            },
          })
        rowsUpserted += uniqueRates.length
      }

      const uniqueRestrictions = dedupeByKey(restrictionRows, (r) => `${r.ratePlanId}|${r.date}`)
      if (uniqueRestrictions.length > 0) {
        await db
          .insert(rateplanRestrictions)
          .values(uniqueRestrictions)
          .onConflictDoUpdate({
            target: [rateplanRestrictions.ratePlanId, rateplanRestrictions.date],
            set: {
              stopSell: sql`excluded.stop_sell`,
              minimumStay: sql`excluded.minimum_stay`,
              maximumStay: sql`excluded.maximum_stay`,
              closeOnArrival: sql`excluded.close_on_arrival`,
              closeOnDeparture: sql`excluded.close_on_departure`,
              minimumStayArrival: sql`excluded.minimum_stay_arrival`,
              maximumStayArrival: sql`excluded.maximum_stay_arrival`,
              exactStayArrival: sql`excluded.exact_stay_arrival`,
              minimumAdvanceReservation: sql`excluded.minimum_advance_reservation`,
              maximumAdvanceReservation: sql`excluded.maximum_advance_reservation`,
              updatedAt: sql`now()`,
            },
          })
        rowsUpserted += uniqueRestrictions.length
      }
    }
  }

  return { eventType, rowsUpserted, warnings }
}
