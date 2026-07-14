import { and, eq, gte, lt } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '@/lib/db/schema'
import {
  dailyInventory,
  dailyRates,
  ratePlans,
  rateplanRestrictions,
  roomRestrictions,
  rooms,
} from '@/lib/db/schema'

type Db = NeonHttpDatabase<typeof schema>

export interface NightlyPrice {
  date: string
  sellRate: number
}

export interface AvailabilityResult {
  ok: boolean
  errors: string[]
  nights: string[]
  nightlyPrices: NightlyPrice[]
  currency: string
  room: { id: number; roomCode: string } | null
  ratePlan: { id: number; rateplanCode: string } | null
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** checkin (inclusive) → checkout (exclusive), one YYYY-MM-DD per night. */
export function expandNights(checkin: string, checkout: string): string[] {
  if (!ISO_DAY.test(checkin) || !ISO_DAY.test(checkout)) {
    throw new Error(`Invalid stay dates: "${checkin}" → "${checkout}"`)
  }
  const start = new Date(`${checkin}T00:00:00Z`).getTime()
  const end = new Date(`${checkout}T00:00:00Z`).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new Error(`Invalid stay dates: "${checkin}" → "${checkout}"`)
  }
  const nights: string[] = []
  for (let t = start; t < end; t += 86_400_000) {
    nights.push(new Date(t).toISOString().slice(0, 10))
  }
  return nights
}

/**
 * Validates a prospective stay against the Neon mirror ONLY — never against
 * Aiosell directly. Checks, per the approved Phase 2 scope:
 *   1. inventory: every night has available >= 1 for the room
 *   2. stop-sell: no night is stop-sold at room or rateplan level
 *   3. minimum stay: arrival-date minimumStay (room and rateplan) is met
 *   4. rates: every night has a mirrored rate for the rate plan
 * Also derives the nightly prices the reservation push will send, so the
 * payload can never disagree with what was validated.
 */
export async function validateStay(
  db: Db,
  rateplanCode: string,
  checkin: string,
  checkout: string
): Promise<AvailabilityResult> {
  const errors: string[] = []
  const nights = expandNights(checkin, checkout)

  const planRows = await db.select().from(ratePlans)
  const plan = planRows.find(
    (p) => p.rateplanCode.toLowerCase() === rateplanCode.toLowerCase() && p.active
  )
  if (!plan) {
    return {
      ok: false,
      errors: [`Unknown or inactive rateplanCode "${rateplanCode}"`],
      nights,
      nightlyPrices: [],
      currency: 'NGN',
      room: null,
      ratePlan: null,
    }
  }
  const roomRow = (await db.select().from(rooms).where(eq(rooms.id, plan.roomId)))[0]

  const nightRange = and(gte(dailyInventory.date, checkin), lt(dailyInventory.date, checkout))
  const [inventoryRows, rateRows, roomRestrictionRows, planRestrictionRows] = await Promise.all([
    db.select().from(dailyInventory).where(and(eq(dailyInventory.roomId, plan.roomId), nightRange)),
    db
      .select()
      .from(dailyRates)
      .where(
        and(
          eq(dailyRates.ratePlanId, plan.id),
          gte(dailyRates.date, checkin),
          lt(dailyRates.date, checkout)
        )
      ),
    db
      .select()
      .from(roomRestrictions)
      .where(
        and(
          eq(roomRestrictions.roomId, plan.roomId),
          gte(roomRestrictions.date, checkin),
          lt(roomRestrictions.date, checkout)
        )
      ),
    db
      .select()
      .from(rateplanRestrictions)
      .where(
        and(
          eq(rateplanRestrictions.ratePlanId, plan.id),
          gte(rateplanRestrictions.date, checkin),
          lt(rateplanRestrictions.date, checkout)
        )
      ),
  ])

  const inventoryByDate = new Map(inventoryRows.map((r) => [r.date, r.available]))
  const rateByDate = new Map(rateRows.map((r) => [r.date, r]))

  // 1. Inventory — a night with no mirror row is treated as unavailable
  //    (the mirror is the source of truth; absence of data is not availability).
  for (const night of nights) {
    const available = inventoryByDate.get(night)
    if (available === undefined) errors.push(`No inventory data for ${night}`)
    else if (available < 1) errors.push(`No availability on ${night} (available=${available})`)
  }

  // 2. Stop-sell at either level
  for (const r of roomRestrictionRows) {
    if (r.stopSell) errors.push(`Stop-sell (room) on ${r.date}`)
  }
  for (const r of planRestrictionRows) {
    if (r.stopSell) errors.push(`Stop-sell (rate plan) on ${r.date}`)
  }

  // 3. Minimum stay on the arrival date, strictest of room/rateplan level
  const arrivalRoom = roomRestrictionRows.find((r) => r.date === checkin)
  const arrivalPlan = planRestrictionRows.find((r) => r.date === checkin)
  const minStay = Math.max(arrivalRoom?.minimumStay ?? 0, arrivalPlan?.minimumStay ?? 0)
  if (minStay > 0 && nights.length < minStay) {
    errors.push(`Minimum stay is ${minStay} night(s); requested ${nights.length}`)
  }

  // 4. Rates — every night must have a mirrored rate
  const nightlyPrices: NightlyPrice[] = []
  let currency = 'NGN'
  for (const night of nights) {
    const rate = rateByDate.get(night)
    if (!rate) {
      errors.push(`No rate for ${night} on ${plan.rateplanCode}`)
    } else {
      nightlyPrices.push({ date: night, sellRate: Number(rate.rate) })
      currency = rate.currency
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    nights,
    nightlyPrices,
    currency,
    room: roomRow ? { id: roomRow.id, roomCode: roomRow.roomCode } : null,
    ratePlan: { id: plan.id, rateplanCode: plan.rateplanCode },
  }
}
