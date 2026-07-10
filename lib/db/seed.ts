import { config } from 'dotenv'
config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { getDb } from './index'
import { ratePlans, rooms } from './schema'

/**
 * Seeds the sandbox rooms and BOTH rate-plan code sets.
 *
 * Aiosell's official OTA docs and their support team gave different codes
 * (docs: EXECUTIVE-S-101 style / support: executive-s-ep style), so both sets
 * are seeded and AIOSELL_RATEPLAN_SET=docs|support decides which one is
 * active. Nothing is hardcoded in application logic — switching sets is a
 * re-run of this script with the flag flipped.
 *
 * Re-runnable: everything is upserted on its unique code.
 */

const ROOMS = [
  { roomCode: 'EXECUTIVE', name: 'Executive Room' },
  { roomCode: 'SUITE', name: 'Suite' },
]

// Docs-style set (default active)
const DOCS_RATE_PLANS = [
  { rateplanCode: 'EXECUTIVE-S-101', roomCode: 'EXECUTIVE', label: 'Executive — Single' },
  { rateplanCode: 'EXECUTIVE-D-101', roomCode: 'EXECUTIVE', label: 'Executive — Double' },
  { rateplanCode: 'SUITE-S-101', roomCode: 'SUITE', label: 'Suite — Single' },
  { rateplanCode: 'SUITE-D-101', roomCode: 'SUITE', label: 'Suite — Double' },
]

// Alternate set provided verbally by Aiosell support
const SUPPORT_RATE_PLANS = [
  { rateplanCode: 'executive-s-ep', roomCode: 'EXECUTIVE', label: 'Executive — Single EP' },
  { rateplanCode: 'executive-d-ep', roomCode: 'EXECUTIVE', label: 'Executive — Double EP' },
  { rateplanCode: 'executive-s-cp', roomCode: 'EXECUTIVE', label: 'Executive — Single CP' },
  { rateplanCode: 'executive-d-cp', roomCode: 'EXECUTIVE', label: 'Executive — Double CP' },
  { rateplanCode: 'suite-s-ep', roomCode: 'SUITE', label: 'Suite — Single EP' },
  { rateplanCode: 'suite-d-ep', roomCode: 'SUITE', label: 'Suite — Double EP' },
  { rateplanCode: 'suite-s-cp', roomCode: 'SUITE', label: 'Suite — Single CP' },
  { rateplanCode: 'suite-d-cp', roomCode: 'SUITE', label: 'Suite — Double CP' },
]

async function main() {
  const activeSet = (process.env.AIOSELL_RATEPLAN_SET ?? 'docs').toLowerCase()
  if (activeSet !== 'docs' && activeSet !== 'support') {
    throw new Error(`AIOSELL_RATEPLAN_SET must be "docs" or "support", got "${activeSet}"`)
  }

  const db = getDb()

  for (const room of ROOMS) {
    await db
      .insert(rooms)
      .values(room)
      .onConflictDoUpdate({
        target: rooms.roomCode,
        set: { name: room.name, active: true, updatedAt: new Date() },
      })
  }

  const roomRows = await db.select().from(rooms)
  const roomIdByCode = new Map(roomRows.map((r) => [r.roomCode, r.id]))

  const allPlans = [
    ...DOCS_RATE_PLANS.map((p) => ({ ...p, active: activeSet === 'docs' })),
    ...SUPPORT_RATE_PLANS.map((p) => ({ ...p, active: activeSet === 'support' })),
  ]

  for (const plan of allPlans) {
    const roomId = roomIdByCode.get(plan.roomCode)
    if (!roomId) throw new Error(`Room ${plan.roomCode} missing for plan ${plan.rateplanCode}`)
    await db
      .insert(ratePlans)
      .values({
        rateplanCode: plan.rateplanCode,
        roomId,
        label: plan.label,
        active: plan.active,
      })
      .onConflictDoUpdate({
        target: ratePlans.rateplanCode,
        set: { roomId, label: plan.label, active: plan.active, updatedAt: new Date() },
      })
  }

  const planRows = await db.select().from(ratePlans).where(eq(ratePlans.active, true))
  console.log(`Seeded ${ROOMS.length} rooms and ${allPlans.length} rate plans.`)
  console.log(`Active set: ${activeSet} → ${planRows.map((p) => p.rateplanCode).join(', ')}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
