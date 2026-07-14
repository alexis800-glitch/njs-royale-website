import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { bookings, ratePlans } from '@/lib/db/schema'
import { validateStay } from '@/lib/aiosell/availability'
import { pushBooking } from '@/lib/aiosell/pushReservation'
import { requireDevAccess } from '@/lib/dev/guard'

export const dynamic = 'force-dynamic'

interface ModifyInput {
  checkin?: string
  checkout?: string
  adults?: number
  children?: number
  specialRequests?: string
}

/**
 * Dev route: modify a test booking and push action:"modify" with the SAME
 * NJS bookingId. New dates are re-validated against the Neon mirror before
 * anything is written, exactly as production must.
 */
export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const denied = requireDevAccess(req)
  if (denied) return denied

  let input: ModifyInput
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const db = getDb()
  const booking = (
    await db.select().from(bookings).where(eq(bookings.bookingId, params.bookingId))
  )[0]
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'paid') {
    return NextResponse.json(
      { error: `Cannot modify a booking with status "${booking.status}"` },
      { status: 409 }
    )
  }

  const checkin = input.checkin ?? booking.checkin
  const checkout = input.checkout ?? booking.checkout

  const plan = (await db.select().from(ratePlans).where(eq(ratePlans.id, booking.ratePlanId)))[0]
  if (!plan) return NextResponse.json({ error: 'Rate plan missing' }, { status: 500 })

  // Re-validate the mirror for the (possibly) new dates
  const stay = await validateStay(db, plan.rateplanCode, checkin, checkout)
  if (!stay.ok) {
    return NextResponse.json(
      { error: 'Modified stay is not bookable per the Neon mirror', reasons: stay.errors },
      { status: 409 }
    )
  }

  const total = stay.nightlyPrices.reduce((sum, p) => sum + p.sellRate, 0)
  await db
    .update(bookings)
    .set({
      checkin,
      checkout,
      adults: input.adults ?? booking.adults,
      children: input.children ?? booking.children,
      specialRequests: input.specialRequests ?? booking.specialRequests,
      amountBeforeTax: total.toFixed(2),
      tax: '0.00',
      amountAfterTax: total.toFixed(2),
      currency: stay.currency,
      nightlyPrices: stay.nightlyPrices,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id))

  const result = await pushBooking(db, params.bookingId, 'modify')
  return NextResponse.json(result)
}
