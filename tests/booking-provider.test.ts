import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createMockProvider } from '../lib/booking/mock/provider.ts'
import { createMockPaymentProvider } from '../lib/booking/mock/payment.ts'
import { createAiosellProvider, BLOCKED_PENDING_AIOSELL } from '../lib/booking/aiosell/provider.ts'
import { syntheticOffers, syntheticRoomsAvailable } from '../lib/booking/mock/inventory.ts'
import { resolveProvider } from '../lib/booking/index.ts'
import { noPaymentRequired, NO_PAYMENT_PROVIDER } from '../lib/booking/payment.ts'
import type { GuestDetails, StayQuery } from '../lib/booking/types.ts'

// A stay that the synthetic inventory has rooms for. Availability is a pure
// function of category and arrival date, so these fixtures never flake.
const STAY: StayQuery = {
  arrival: '2027-07-24',
  departure: '2027-07-27',
  adults: 2,
  children: 0,
  rooms: 1,
}

/** Sold out on 2027-07-24 by the availability hash. */
const SOLD_OUT_CATEGORY = 'grand-suite'
const AVAILABLE_CATEGORY = 'royale-room-resort-side'

const GUEST: GuestDetails = {
  firstName: 'Adaeze',
  lastName: 'Okonkwo',
  email: 'adaeze@example.test',
  phone: '2348031234567',
  phoneDisplay: '0803 123 4567',
  specialRequests: null,
}

/** A fixed clock and a seeded generator, so references are reproducible. */
function deterministic() {
  let seed = 42
  return {
    now: () => new Date('2026-11-17T06:00:00Z'),
    random: () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    },
  }
}

// ---------------------------------------------------------------------------
// The happy path, end to end
// ---------------------------------------------------------------------------

test('a reservation can be taken from search through to confirmation', async () => {
  const provider = createMockProvider(deterministic())

  const search = await provider.search(STAY)
  assert.equal(search.ok, true)
  if (!search.ok) return
  assert.ok(search.value.length > 0)
  // Cheapest first.
  const rates = search.value.map((o) => o.nightlyRate)
  assert.deepEqual(rates, [...rates].sort((a, b) => a - b))

  const quoted = await provider.quote({ categoryId: AVAILABLE_CATEGORY, query: STAY })
  assert.equal(quoted.ok, true)
  if (!quoted.ok) return
  // 3 nights x 1 room at the catalogue's own opening rate for this category.
  assert.equal(quoted.value.rate.nights, 3)
  assert.equal(quoted.value.rate.rooms, 1)
  assert.equal(quoted.value.rate.nightlyRate, 250_000)
  assert.equal(quoted.value.rate.roomSubtotal, 750_000)
  assert.equal(quoted.value.rate.total, 750_000)
  // Taxes are null, not zero: the position is unconfirmed.
  assert.equal(quoted.value.rate.taxesAndFees, null)
  assert.equal(quoted.value.rate.currency, 'NGN')

  const held = await provider.hold(quoted.value, GUEST)
  assert.equal(held.ok, true)
  if (!held.ok) return
  // Truthful: nothing is actually held anywhere.
  assert.equal(held.value.inventoryHeld, false)
  assert.deepEqual(held.value.selection.query, STAY)

  const payment = createMockPaymentProvider({ guestEmail: GUEST.email, now: deterministic().now })
  const paid = await payment.pay({
    amount: quoted.value.rate.total,
    currency: 'NGN',
    reference: held.value.draftRef,
    description: 'Royale Room, Standard — 3 nights',
  })
  assert.equal(paid.ok, true)
  if (!paid.ok) return
  assert.equal(paid.value.status, 'authorised')

  const confirmed = await provider.confirm(held.value, paid.value)
  assert.equal(confirmed.ok, true)
  if (!confirmed.ok) return
  assert.equal(confirmed.value.status, 'confirmed')
  assert.match(confirmed.value.reference, /^NJS-20261117-[A-Z2-9]{6}$/)
  // Null is a real state: the July 2026 sandbox returned 200 with no booking id.
  assert.equal(confirmed.value.providerReference, null)
  assert.equal(confirmed.value.guest.email, GUEST.email)
})

test('a confirmed reservation can be looked up and cancelled', async () => {
  const provider = createMockProvider(deterministic())
  const quoted = await provider.quote({ categoryId: AVAILABLE_CATEGORY, query: STAY })
  assert.equal(quoted.ok, true)
  if (!quoted.ok) return
  const held = await provider.hold(quoted.value, GUEST)
  assert.equal(held.ok, true)
  if (!held.ok) return
  const confirmed = await provider.confirm(held.value, noPaymentRequired(held.value.draftRef))
  assert.equal(confirmed.ok, true)
  if (!confirmed.ok) return

  const found = await provider.lookup(confirmed.value.reference)
  assert.equal(found.ok, true)

  const cancelled = await provider.cancel(confirmed.value.reference)
  assert.equal(cancelled.ok, true)
  if (!cancelled.ok) return
  assert.equal(cancelled.value.status, 'cancelled')
  // No refund is stated, because the refund position is unconfirmed.
  assert.equal(cancelled.value.refund, null)

  const after = await provider.lookup(confirmed.value.reference)
  assert.equal(after.ok, true)
  if (after.ok) assert.equal(after.value.status, 'cancelled')
})

// ---------------------------------------------------------------------------
// Failure states — each one the journey has to render
// ---------------------------------------------------------------------------

test('a sold-out category is refused at the quote, not silently substituted', async () => {
  const provider = createMockProvider(deterministic())
  assert.equal(syntheticRoomsAvailable(SOLD_OUT_CATEGORY, STAY.arrival), 0)

  const quoted = await provider.quote({ categoryId: SOLD_OUT_CATEGORY, query: STAY })
  assert.equal(quoted.ok, false)
  if (!quoted.ok) {
    assert.equal(quoted.error.code, 'NO_AVAILABILITY')
    assert.match(quoted.error.message, /no longer available/)
  }
})

test('an empty result set reads as no availability, not as an empty list', async () => {
  const provider = createMockProvider({ ...deterministic(), findOffers: () => [] })
  const search = await provider.search(STAY)
  assert.equal(search.ok, false)
  if (!search.ok) {
    assert.equal(search.error.code, 'NO_AVAILABILITY')
    assert.match(search.error.message, /different dates/)
  }
})

test('the adapter re-validates its caller and refuses an illegal arrival', async () => {
  const provider = createMockProvider(deterministic())
  const search = await provider.search({ ...STAY, arrival: '2027-07-22' })
  assert.equal(search.ok, false)
  if (!search.ok) {
    assert.equal(search.error.code, 'INVALID_QUERY')
    assert.match(search.error.fields?.arrival ?? '', /23 July 2027/)
  }
})

test('a declined payment leaves no reservation and says so plainly', async () => {
  const provider = createMockProvider(deterministic())
  const declining = { ...GUEST, email: 'decline@example.test' }
  const quoted = await provider.quote({ categoryId: AVAILABLE_CATEGORY, query: STAY })
  assert.equal(quoted.ok, true)
  if (!quoted.ok) return
  const held = await provider.hold(quoted.value, declining)
  assert.equal(held.ok, true)
  if (!held.ok) return

  const payment = createMockPaymentProvider({ guestEmail: declining.email })
  const paid = await payment.pay({
    amount: 1,
    currency: 'NGN',
    reference: held.value.draftRef,
    description: 'test',
  })
  assert.equal(paid.ok, true)
  if (!paid.ok) return
  assert.equal(paid.value.status, 'failed')

  const confirmed = await provider.confirm(held.value, paid.value)
  assert.equal(confirmed.ok, false)
  if (!confirmed.ok) {
    assert.equal(confirmed.error.code, 'PAYMENT_FAILED')
    assert.match(confirmed.error.message, /not been charged/)
    assert.equal(confirmed.error.retryable, true)
  }
})

test('an abandoned payment is not treated as a failure', async () => {
  const abandoning = { ...GUEST, email: 'abandon@example.test' }
  const payment = createMockPaymentProvider({ guestEmail: abandoning.email })
  const paid = await payment.pay({ amount: 1, currency: 'NGN', reference: 'r', description: 'd' })
  assert.equal(paid.ok, true)
  if (paid.ok) assert.equal(paid.value.status, 'cancelled')
})

test('an unreachable processor is a retryable error, not a decline', async () => {
  const payment = createMockPaymentProvider({ guestEmail: 'outage@example.test' })
  const paid = await payment.pay({ amount: 1, currency: 'NGN', reference: 'r', description: 'd' })
  assert.equal(paid.ok, false)
  if (!paid.ok) {
    assert.equal(paid.error.code, 'PROVIDER_UNAVAILABLE')
    assert.equal(paid.error.retryable, true)
    assert.match(paid.error.message, /not been charged/)
  }
})

test('confirming twice returns the first reservation rather than making a second', async () => {
  const provider = createMockProvider(deterministic())
  const quoted = await provider.quote({ categoryId: AVAILABLE_CATEGORY, query: STAY })
  assert.equal(quoted.ok, true)
  if (!quoted.ok) return
  const held = await provider.hold(quoted.value, GUEST)
  assert.equal(held.ok, true)
  if (!held.ok) return

  const first = await provider.confirm(held.value, noPaymentRequired(held.value.draftRef))
  const second = await provider.confirm(held.value, noPaymentRequired(held.value.draftRef))
  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  if (first.ok && second.ok) {
    assert.equal(second.value.reference, first.value.reference)
  }
})

test('confirming an unknown draft is refused as an expired session', async () => {
  const provider = createMockProvider(deterministic())
  const confirmed = await provider.confirm(
    {
      draftRef: 'D-NOTAREALDRAFT',
      selection: { categoryId: AVAILABLE_CATEGORY, query: STAY },
      quote: {
        quoteRef: 'Q-X',
        selection: { categoryId: AVAILABLE_CATEGORY, query: STAY },
        offer: syntheticOffers(STAY)[0],
        rate: syntheticOffers(STAY)[0].rate,
        expiresAt: null,
      },
      guest: GUEST,
      createdAt: '2026-11-17T06:00:00.000Z',
      inventoryHeld: false,
    },
    noPaymentRequired('x'),
  )
  assert.equal(confirmed.ok, false)
  if (!confirmed.ok) assert.equal(confirmed.error.code, 'QUOTE_EXPIRED')
})

test('a provider outage is retryable on every operation', async () => {
  const provider = createMockProvider({ ...deterministic(), simulateOutage: true })
  const results = await Promise.all([
    provider.search(STAY),
    provider.quote({ categoryId: AVAILABLE_CATEGORY, query: STAY }),
    provider.lookup('NJS-1'),
    provider.cancel('NJS-1'),
  ])
  for (const r of results) {
    assert.equal(r.ok, false)
    if (!r.ok) {
      assert.equal(r.error.code, 'PROVIDER_UNAVAILABLE')
      assert.equal(r.error.retryable, true)
    }
  }
})

// ---------------------------------------------------------------------------
// The payment boundary
// ---------------------------------------------------------------------------

test('the default payment provider refuses, because none has been chosen', async () => {
  const paid = await NO_PAYMENT_PROVIDER.pay({
    amount: 750_000,
    currency: 'NGN',
    reference: 'r',
    description: 'd',
  })
  assert.equal(paid.ok, false)
  if (!paid.ok) assert.equal(paid.error.code, 'PROVIDER_NOT_CONFIGURED')
})

test('no payment provider claims NGN settlement, refunds or idempotency', () => {
  for (const p of [NO_PAYMENT_PROVIDER, createMockPaymentProvider()]) {
    assert.equal(p.capabilities.ngnSettlement, false)
    assert.equal(p.capabilities.refunds, false)
    assert.equal(p.capabilities.idempotent, false)
  }
})

// ---------------------------------------------------------------------------
// The Aiosell adapter is a stub, and says so
// ---------------------------------------------------------------------------

test('the Aiosell adapter refuses every operation while undocumented', async () => {
  const provider = createAiosellProvider()
  const results = await Promise.all([
    provider.search(STAY),
    provider.quote({ categoryId: AVAILABLE_CATEGORY, query: STAY }),
    provider.lookup('x'),
    provider.cancel('x'),
  ])
  for (const r of results) {
    assert.equal(r.ok, false)
    if (!r.ok) {
      assert.equal(r.error.code, 'PROVIDER_NOT_CONFIGURED')
      assert.equal(r.error.retryable, false)
    }
  }
})

test('the Aiosell adapter claims no capability it has not been shown', () => {
  const { capabilities } = createAiosellProvider()
  for (const [name, value] of Object.entries(capabilities)) {
    if (name === 'currencies') {
      assert.deepEqual(value, [])
      continue
    }
    assert.equal(value, false, `${name} must not be claimed`)
  }
})

test('the mock claims only what it actually does', () => {
  const { capabilities } = createMockProvider()
  assert.equal(capabilities.search, true)
  assert.equal(capabilities.confirm, true)
  assert.equal(capabilities.multiRoom, true)
  // Modification is not modelled, so it is not claimed.
  assert.equal(capabilities.modify, false)
})

test('every integration function is recorded as mocked or blocked, with a reason', () => {
  assert.ok(BLOCKED_PENDING_AIOSELL.length >= 10)
  for (const f of BLOCKED_PENDING_AIOSELL) {
    assert.ok(f.id && f.label)
    assert.ok(f.state === 'mocked' || f.state === 'blocked')
    if (f.state === 'blocked') {
      assert.ok(f.needs && f.needs.length > 20, `${f.id} is blocked but says nothing about why`)
    } else {
      assert.equal(f.needs, null)
    }
  }
})

// ---------------------------------------------------------------------------
// Resolution and the production gate
// ---------------------------------------------------------------------------

test('the default provider is the mock, never Aiosell', () => {
  assert.equal(resolveProvider().id, 'mock')
  assert.equal(resolveProvider('mock').id, 'mock')
  assert.equal(resolveProvider('aiosell').id, 'aiosell')
})

test('booking is off on the production deployment and no variable can turn it on', () => {
  // Checked in a child process, because BOOKING_ENABLED is derived once at
  // module load. This is the gate that keeps the prototype off the public site,
  // so it is worth the subprocess.
  const read = (env: Record<string, string>) =>
    execFileSync(
      process.execPath,
      [
        '--no-warnings',
        '--input-type=module',
        '-e',
        "import { BOOKING_ENABLED } from './lib/booking/config.ts'; process.stdout.write(String(BOOKING_ENABLED))",
      ],
      { env: { ...process.env, ...env }, encoding: 'utf8', cwd: process.cwd() },
    )

  assert.equal(read({ VERCEL_ENV: 'production' }), 'false')
  // Not even with someone setting the obvious override.
  assert.equal(read({ VERCEL_ENV: 'production', BOOKING_ENABLED: 'true' }), 'false')
  // On, where it is meant to be on.
  assert.equal(read({ VERCEL_ENV: 'preview' }), 'true')
  assert.equal(read({ VERCEL_ENV: '' }), 'true')
})
