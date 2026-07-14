import { eq, sql } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '@/lib/db/schema'
import { bookings, ratePlans, rooms } from '@/lib/db/schema'
import { aiosellPushUrl, callAiosell, findCmBookingId, redact } from './aiosellClient'
import { formatBookedOn } from './bookingRef'

type Db = NeonHttpDatabase<typeof schema>
type BookingRow = typeof bookings.$inferSelect

export type PushAction = 'book' | 'modify' | 'cancel'

export interface PushResult {
  bookingId: string
  action: PushAction
  pushed: boolean
  syncStatus: 'synced' | 'sync_failed'
  cmBookingId: string | null
  attempts: number
  error: string | null
}

// Short immediate retries only — serverless-safe. Total added latency is at
// most 4s; anything that still fails is persisted as sync_failed and
// recovered via the manual retry route (scheduled retry deferred).
const RETRY_DELAYS_MS = [0, 1_000, 3_000]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Builds the Aiosell reservation payload from a local booking row and the
 * mirror-derived nightly prices stored on it. `cmBookingId` is omitted
 * unconditionally on every action — the NJS bookingId is the primary,
 * idempotent reference; Aiosell's cmBookingId is stored on the booking as a
 * secondary reference only and is never sent back.
 */
export function buildReservationPayload(
  action: PushAction,
  booking: BookingRow,
  roomCode: string,
  rateplanCode: string
): Record<string, unknown> {
  const hotelCode = process.env.AIOSELL_HOTEL_CODE
  const channel = process.env.AIOSELL_CHANNEL_NAME
  if (!hotelCode || !channel) {
    throw new Error('AIOSELL_HOTEL_CODE / AIOSELL_CHANNEL_NAME are not set')
  }

  if (action === 'cancel') {
    // Minimal cancel payload per Aiosell docs
    return { action, hotelCode, channel, bookingId: booking.bookingId }
  }

  const nightlyPrices = booking.nightlyPrices as { date: string; sellRate: number }[]

  return {
    action,
    hotelCode,
    channel,
    bookingId: booking.bookingId,
    bookedOn: formatBookedOn(booking.createdAt),
    checkin: booking.checkin,
    checkout: booking.checkout,
    segment: 'Website',
    specialRequests: booking.specialRequests ?? '',
    pah: false,
    amount: {
      amountAfterTax: Number(booking.amountAfterTax),
      amountBeforeTax: Number(booking.amountBeforeTax),
      tax: Number(booking.tax),
      currency: booking.currency,
      commission: 0,
      // TODO: confirm NGN tax handling with Aiosell before production (§7 Q6)
      tcs: 0,
      tds: 0,
    },
    guest: {
      firstName: booking.guestFirstName,
      lastName: booking.guestLastName,
      email: booking.guestEmail,
      phone: booking.guestPhone,
      address: {
        line1: booking.guestAddressLine1 ?? '',
        city: booking.guestCity ?? '',
        state: booking.guestState ?? '',
        country: booking.guestCountry,
        zipCode: booking.guestZip ?? '',
      },
    },
    rooms: [
      {
        roomCode,
        rateplanCode,
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        occupancy: { adults: booking.adults, children: booking.children },
        prices: nightlyPrices,
      },
    ],
  }
}

/**
 * Pushes a local booking to Aiosell. The booking row MUST already exist —
 * this function never creates one, so a failed push can never lose a
 * booking. Enforces the payment-before-push invariant structurally:
 * book/modify require status "paid", cancel requires status "cancelled".
 */
export async function pushBooking(
  db: Db,
  bookingRef: string,
  action: PushAction
): Promise<PushResult> {
  const bookingRows = await db.select().from(bookings).where(eq(bookings.bookingId, bookingRef))
  const booking = bookingRows[0]
  if (!booking) throw new Error(`Booking ${bookingRef} not found — nothing was pushed`)

  const requiredStatus = action === 'cancel' ? 'cancelled' : 'paid'
  if (booking.status !== requiredStatus) {
    throw new Error(
      `Booking ${bookingRef} has status "${booking.status}" — "${action}" requires "${requiredStatus}". Push refused.`
    )
  }

  const roomRow = (await db.select().from(rooms).where(eq(rooms.id, booking.roomId)))[0]
  const planRow = (await db.select().from(ratePlans).where(eq(ratePlans.id, booking.ratePlanId)))[0]
  if (!roomRow || !planRow) {
    throw new Error(`Booking ${bookingRef} references a missing room or rate plan`)
  }

  const payload = buildReservationPayload(action, booking, roomRow.roomCode, planRow.rateplanCode)
  const url = aiosellPushUrl()

  await db
    .update(bookings)
    .set({ syncStatus: 'sync_pending', updatedAt: new Date() })
    .where(eq(bookings.id, booking.id))

  let lastError: string | null = null
  let attemptsMade = 0

  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i] > 0) await sleep(RETRY_DELAYS_MS[i])
    attemptsMade = i + 1

    await db
      .update(bookings)
      .set({ pushAttempts: sql`${bookings.pushAttempts} + 1`, updatedAt: new Date() })
      .where(eq(bookings.id, booking.id))

    const result = await callAiosell(db, {
      url,
      requestBody: payload,
      operation: action,
      bookingId: booking.bookingId,
      attempt: attemptsMade,
    })

    if (result.ok) {
      const cmBookingId = findCmBookingId(result.body)
      await db
        .update(bookings)
        .set({
          syncStatus: 'synced',
          // Secondary reference only — never overwritten with our own ref
          cmBookingId: cmBookingId ?? booking.cmBookingId,
          aiosellResponse: redact(result.body),
          lastPushError: null,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, booking.id))
      return {
        bookingId: booking.bookingId,
        action,
        pushed: true,
        syncStatus: 'synced',
        cmBookingId: cmBookingId ?? booking.cmBookingId,
        attempts: attemptsMade,
        error: null,
      }
    }

    lastError = result.error
    if (!result.retryable) break // 4xx / business rejection — retrying cannot help
  }

  await db
    .update(bookings)
    .set({ syncStatus: 'sync_failed', lastPushError: lastError, updatedAt: new Date() })
    .where(eq(bookings.id, booking.id))

  return {
    bookingId: booking.bookingId,
    action,
    pushed: false,
    syncStatus: 'sync_failed',
    cmBookingId: booking.cmBookingId,
    attempts: attemptsMade,
    error: lastError,
  }
}
