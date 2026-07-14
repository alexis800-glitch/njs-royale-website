import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { bookings, syncLogs } from '@/lib/db/schema'
import { pushBooking, type PushAction } from '@/lib/aiosell/pushReservation'
import { requireDevAccess } from '@/lib/dev/guard'

export const dynamic = 'force-dynamic'

const PUSH_ACTIONS: PushAction[] = ['book', 'modify', 'cancel']

/**
 * Dev route: manually retry a failed push. This is the recovery path after
 * short immediate retries are exhausted (scheduled cron retry is deferred).
 * The action retried is, in order of precedence: an explicit `action` in
 * the request body, the last attempted push operation from sync_logs, or a
 * status-derived default (cancelled → cancel, otherwise book).
 */
export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const denied = requireDevAccess(req)
  if (denied) return denied

  const db = getDb()
  const booking = (
    await db.select().from(bookings).where(eq(bookings.bookingId, params.bookingId))
  )[0]
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.syncStatus !== 'sync_failed') {
    return NextResponse.json(
      { error: `Booking sync_status is "${booking.syncStatus}" — only sync_failed can be retried` },
      { status: 409 }
    )
  }

  let action: PushAction | undefined
  try {
    const body = await req.json()
    if (body?.action !== undefined) {
      if (!PUSH_ACTIONS.includes(body.action)) {
        return NextResponse.json({ error: `Invalid action "${body.action}"` }, { status: 400 })
      }
      action = body.action
    }
  } catch {
    // empty body is fine — action will be derived
  }

  if (!action) {
    const lastPush = (
      await db
        .select({ operation: syncLogs.operation })
        .from(syncLogs)
        .where(eq(syncLogs.bookingId, params.bookingId))
        .orderBy(desc(syncLogs.id))
        .limit(1)
    )[0]
    if (lastPush && PUSH_ACTIONS.includes(lastPush.operation as PushAction)) {
      action = lastPush.operation as PushAction
    } else {
      action = booking.status === 'cancelled' ? 'cancel' : 'book'
    }
  }

  const result = await pushBooking(db, params.bookingId, action)
  return NextResponse.json({ retried: action, ...result })
}
