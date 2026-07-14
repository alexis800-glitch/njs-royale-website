import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bookings } from '@/lib/db/schema'
import { validateStay } from '@/lib/aiosell/availability'
import { generateBookingRef } from '@/lib/aiosell/bookingRef'
import { pushBooking } from '@/lib/aiosell/pushReservation'
import { requireDevAccess } from '@/lib/dev/guard'

export const dynamic = 'force-dynamic'

interface TestBookingInput {
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  guestPhone: string
  checkin: string
  checkout: string
  rateplanCode: string
  adults: number
  children?: number
  specialRequests?: string
  // Dev-only escape hatch: create the local booking but skip the outbound
  // push — used to test "local booking exists before/without push".
  skipPush?: boolean
}

const REQUIRED: (keyof TestBookingInput)[] = [
  'guestFirstName',
  'guestLastName',
  'guestEmail',
  'guestPhone',
  'checkin',
  'checkout',
  'rateplanCode',
  'adults',
]

/**
 * Dev route: create a sandbox test booking, then push it to Aiosell.
 *
 * Order is load-bearing and mirrors the production invariants:
 *   1. validate the stay against the Neon mirror (inventory, stop-sell,
 *      minimum stay, rates) — never against Aiosell;
 *   2. create the local booking row (status "paid" — payments are out of
 *      scope in sandbox, so test bookings are born payment-confirmed);
 *   3. only then push. A failed push leaves the booking as sync_failed.
 */
export async function POST(req: Request) {
  const denied = requireDevAccess(req)
  if (denied) return denied

  let input: TestBookingInput
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const missing = REQUIRED.filter((k) => input[k] === undefined || input[k] === '')
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 })
  }

  const db = getDb()

  // 1. Mirror validation
  let stay
  try {
    stay = await validateStay(db, input.rateplanCode, input.checkin, input.checkout)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'validation failed' },
      { status: 400 }
    )
  }
  if (!stay.ok || !stay.room || !stay.ratePlan) {
    return NextResponse.json(
      { error: 'Stay is not bookable per the Neon mirror', reasons: stay.errors },
      { status: 409 }
    )
  }

  // 2. Local booking first — the NJS reference is generated exactly once
  //    here and never changes, whatever happens to the push.
  const bookingRef = generateBookingRef()
  const total = stay.nightlyPrices.reduce((sum, p) => sum + p.sellRate, 0)

  const inserted = await db
    .insert(bookings)
    .values({
      bookingId: bookingRef,
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      guestCountry: 'Nigeria',
      checkin: input.checkin,
      checkout: input.checkout,
      roomId: stay.room.id,
      ratePlanId: stay.ratePlan.id,
      adults: input.adults,
      children: input.children ?? 0,
      // Sandbox: tax/tcs/tds are 0 (Aiosell-confirmed acceptable).
      // Production NGN tax handling is an open blocking question.
      amountBeforeTax: total.toFixed(2),
      tax: '0.00',
      amountAfterTax: total.toFixed(2),
      currency: stay.currency,
      specialRequests: input.specialRequests ?? null,
      status: 'paid',
      syncStatus: 'not_pushed',
      nightlyPrices: stay.nightlyPrices,
    })
    .returning({ id: bookings.id, bookingId: bookings.bookingId })

  if (input.skipPush) {
    return NextResponse.json({
      created: inserted[0].bookingId,
      pushed: false,
      note: 'skipPush set — local booking created, no outbound call made',
    })
  }

  // 3. Push (short retries inside; failure preserves the booking)
  const result = await pushBooking(db, bookingRef, 'book')
  return NextResponse.json({ created: bookingRef, ...result })
}
