import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { fetchSync, type FetchType } from '@/lib/aiosell/fetchSync'
import { requireDevAccess } from '@/lib/dev/guard'

export const dynamic = 'force-dynamic'

const FETCH_TYPES: FetchType[] = ['inventory', 'rates', 'reservations']
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Dev route: on-demand FETCH reconciliation (recovery path for missed
 * webhooks). Body: { type: "inventory" | "rates" | "reservations",
 * startDate, endDate }. inventory/rates are applied to the Neon mirror via
 * the shared webhook mapper; reservations is capture-only (undocumented
 * schema — redacted body lands in sync_logs, nothing is applied).
 */
export async function POST(req: Request) {
  const denied = requireDevAccess(req)
  if (denied) return denied

  let body: { type?: string; startDate?: string; endDate?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { type, startDate, endDate } = body
  if (!type || !FETCH_TYPES.includes(type as FetchType)) {
    return NextResponse.json(
      { error: `type must be one of: ${FETCH_TYPES.join(', ')}` },
      { status: 400 }
    )
  }
  if (!startDate || !endDate || !ISO_DAY.test(startDate) || !ISO_DAY.test(endDate)) {
    return NextResponse.json(
      { error: 'startDate and endDate are required as YYYY-MM-DD' },
      { status: 400 }
    )
  }

  const result = await fetchSync(getDb(), type as FetchType, startDate, endDate)
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
