import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { bookings } from '@/lib/db/schema'
import { pushBooking } from '@/lib/aiosell/pushReservation'
import { requireDevAccess } from '@/lib/dev/guard'

export const dynamic = 'force-dynamic'

/**
 * Dev route: cancel a test booking. The local status flips to "cancelled"
 * FIRST, then action:"cancel" is pushed. A failed cancel push leaves the
 * booking as cancelled + sync_failed for manual retry — the local record is
 * the source of truth for the guest-facing state.
 */
export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const denied = requireDevAccess(req)
  if (denied) return denied

  const db = getDb()
  const booking = (
    await db.select().from(bookings).where(eq(bookings.bookingId, params.bookingId))
  )[0]
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status === 'cancelled' && booking.syncStatus === 'synced') {
    return NextResponse.json({ error: 'Booking is already cancelled and synced' }, { status: 409 })
  }

  await db
    .update(bookings)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(bookings.id, booking.id))

  const result = await pushBooking(db, params.bookingId, 'cancel')
  return NextResponse.json(result)
}
