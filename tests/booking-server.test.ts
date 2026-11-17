import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { handleBookingRequest, rateLimit, RATE_LIMIT_MAX, resetRateLimitForTests } from '../lib/booking/service.ts'
import { resetBookingServerStateForTests } from '../lib/booking/server.ts'
import { createBookingClient } from '../lib/booking/client.ts'
import type { BookingDraft, Confirmation, Quote, RoomOffer } from '../lib/booking/types.ts'

const STAY = {
  arrival: '2027-07-24',
  departure: '2027-07-27',
  adults: 2,
  children: 0,
  rooms: 1,
}

const GUEST = {
  firstName: 'Adaeze',
  lastName: 'Okonkwo',
  email: 'adaeze@example.test',
  phone: '0803 123 4567',
}

const AVAILABLE = 'royale-room-resort-side'

function fresh() {
  resetBookingServerStateForTests()
  resetRateLimitForTests()
}

/** Walk the journey through the service, as the route would. */
async function journey(simulate?: string) {
  const searched = await handleBookingRequest({ op: 'search', query: STAY })
  assert.equal(searched.ok, true)

  const quoted = await handleBookingRequest({
    op: 'quote',
    selection: { categoryId: AVAILABLE, query: STAY },
  })
  assert.equal(quoted.ok, true)
  if (!quoted.ok) throw new Error('unreachable')
  const quote = quoted.value as Quote

  const held = await handleBookingRequest({ op: 'hold', quoteRef: quote.quoteRef, guest: GUEST })
  assert.equal(held.ok, true)
  if (!held.ok) throw new Error('unreachable')
  const draft = held.value as BookingDraft

  const confirmed = await handleBookingRequest({
    op: 'confirm',
    draftRef: draft.draftRef,
    idempotencyKey: 'idem-key-0000001',
    simulate,
  })
  return { quote, draft, confirmed }
}

// ---------------------------------------------------------------------------
// The journey, server-side
// ---------------------------------------------------------------------------

test('the whole journey runs through the service', async () => {
  fresh()
  const { quote, confirmed } = await journey()
  assert.equal(confirmed.ok, true)
  if (!confirmed.ok) return
  const c = confirmed.value as Confirmation
  assert.equal(c.status, 'confirmed')
  assert.match(c.reference, /^NJS-\d{8}-[A-Z2-9]{6}$/)
  // 3 nights at the catalogue rate, calculated server-side.
  assert.equal(c.rate.total, 750_000)
  assert.equal(c.rate.total, quote.rate.total)
})

// ---------------------------------------------------------------------------
// What a client is not allowed to decide
// ---------------------------------------------------------------------------

test('a client cannot set the rate it is charged', async () => {
  fresh()
  const quoted = await handleBookingRequest({
    op: 'quote',
    selection: { categoryId: 'presidential-suite-ocean', query: STAY },
  })
  assert.equal(quoted.ok, true)
  if (!quoted.ok) return
  const quote = quoted.value as Quote
  assert.equal(quote.rate.nightlyRate, 2_000_000)

  // Post a hold carrying a forged quote object alongside the real reference.
  // The service reads its own stored copy and ignores everything else.
  const held = await handleBookingRequest({
    op: 'hold',
    quoteRef: quote.quoteRef,
    guest: GUEST,
    quote: { ...quote, rate: { ...quote.rate, total: 1, nightlyRate: 1 } },
    rate: { total: 1 },
    amount: 1,
  })
  assert.equal(held.ok, true)
  if (!held.ok) return
  const draft = held.value as BookingDraft
  assert.equal(draft.quote.rate.total, 6_000_000)

  const confirmed = await handleBookingRequest({
    op: 'confirm',
    draftRef: draft.draftRef,
    idempotencyKey: 'idem-forged-00001',
    amount: 1,
    rate: { total: 1 },
  })
  assert.equal(confirmed.ok, true)
  if (!confirmed.ok) return
  assert.equal((confirmed.value as Confirmation).rate.total, 6_000_000)
})

test('a client cannot assert that payment succeeded', async () => {
  fresh()
  const quoted = await handleBookingRequest({
    op: 'quote',
    selection: { categoryId: AVAILABLE, query: STAY },
  })
  if (!quoted.ok) throw new Error('unreachable')
  const quote = quoted.value as Quote
  const held = await handleBookingRequest({ op: 'hold', quoteRef: quote.quoteRef, guest: GUEST })
  if (!held.ok) throw new Error('unreachable')
  const draft = held.value as BookingDraft

  // Simulate a decline, while also posting a forged "authorised" outcome. The
  // forged field has no route into the service: payment is run server-side.
  const confirmed = await handleBookingRequest({
    op: 'confirm',
    draftRef: draft.draftRef,
    idempotencyKey: 'idem-forgedpay-01',
    simulate: 'declined',
    payment: { status: 'authorised', amount: 750_000, providerReference: 'forged' },
    paymentOutcome: { status: 'authorised' },
  })
  assert.equal(confirmed.ok, false)
  if (!confirmed.ok) assert.equal(confirmed.error.code, 'PAYMENT_FAILED')
})

test('an unknown quote or draft reference is an expired session, not a booking', async () => {
  fresh()
  const held = await handleBookingRequest({ op: 'hold', quoteRef: 'Q-MADEUP', guest: GUEST })
  assert.equal(held.ok, false)
  if (!held.ok) assert.equal(held.error.code, 'QUOTE_EXPIRED')

  const confirmed = await handleBookingRequest({
    op: 'confirm',
    draftRef: 'D-MADEUP',
    idempotencyKey: 'idem-unknown-0001',
  })
  assert.equal(confirmed.ok, false)
  if (!confirmed.ok) assert.equal(confirmed.error.code, 'QUOTE_EXPIRED')
})

// ---------------------------------------------------------------------------
// Server-side validation, independent of the client's
// ---------------------------------------------------------------------------

test('the server refuses an arrival before 23 July 2027 even if the client did not', async () => {
  fresh()
  for (const op of ['search', 'quote'] as const) {
    const body =
      op === 'search'
        ? { op, query: { ...STAY, arrival: '2027-07-22' } }
        : { op, selection: { categoryId: AVAILABLE, query: { ...STAY, arrival: '2027-07-22' } } }
    const result = await handleBookingRequest(body)
    assert.equal(result.ok, false, `${op} should refuse`)
    if (!result.ok) {
      assert.equal(result.error.code, 'INVALID_QUERY')
      assert.match(result.error.fields?.arrival ?? '', /23 July 2027/)
    }
  }
})

test('the server validates guest details and does not trust the client', async () => {
  fresh()
  const quoted = await handleBookingRequest({
    op: 'quote',
    selection: { categoryId: AVAILABLE, query: STAY },
  })
  if (!quoted.ok) throw new Error('unreachable')
  const quote = quoted.value as Quote

  const held = await handleBookingRequest({
    op: 'hold',
    quoteRef: quote.quoteRef,
    guest: { firstName: '', lastName: '', email: 'nope', phone: 'abc' },
  })
  assert.equal(held.ok, false)
  if (!held.ok) {
    assert.equal(held.error.code, 'INVALID_QUERY')
    assert.ok(held.error.fields?.firstName)
    assert.ok(held.error.fields?.email)
  }
})

test('an unrecognised or missing operation is refused', async () => {
  fresh()
  for (const body of [{}, { op: 'drop' }, { op: 42 }, null, 'search', []]) {
    const result = await handleBookingRequest(body)
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.error.code, 'INVALID_QUERY')
  }
})

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

test('the same idempotency key returns the first reservation, not a second', async () => {
  fresh()
  const { draft } = await journey()
  const again = await handleBookingRequest({
    op: 'confirm',
    draftRef: draft.draftRef,
    idempotencyKey: 'idem-key-0000001',
  })
  const first = await handleBookingRequest({
    op: 'confirm',
    draftRef: draft.draftRef,
    idempotencyKey: 'idem-key-0000001',
  })
  assert.equal(again.ok, true)
  assert.equal(first.ok, true)
  if (again.ok && first.ok) {
    assert.equal((again.value as Confirmation).reference, (first.value as Confirmation).reference)
  }
})

test('a confirm without a usable idempotency key is refused', async () => {
  fresh()
  const quoted = await handleBookingRequest({
    op: 'quote',
    selection: { categoryId: AVAILABLE, query: STAY },
  })
  if (!quoted.ok) throw new Error('unreachable')
  const held = await handleBookingRequest({
    op: 'hold',
    quoteRef: (quoted.value as Quote).quoteRef,
    guest: GUEST,
  })
  if (!held.ok) throw new Error('unreachable')

  for (const key of [undefined, '', 'short', 123]) {
    const result = await handleBookingRequest({
      op: 'confirm',
      draftRef: (held.value as BookingDraft).draftRef,
      idempotencyKey: key,
    })
    assert.equal(result.ok, false)
  }
})

// ---------------------------------------------------------------------------
// Payment outcomes, decided server-side
// ---------------------------------------------------------------------------

test('each simulated payment outcome produces its own guest-facing state', async () => {
  const cases: Array<[string, string]> = [
    ['declined', 'PAYMENT_FAILED'],
    ['abandoned', 'PAYMENT_REQUIRED'],
    ['processor-outage', 'PROVIDER_UNAVAILABLE'],
  ]
  for (const [simulate, code] of cases) {
    fresh()
    const { confirmed } = await journey(simulate)
    assert.equal(confirmed.ok, false, `${simulate} should not confirm`)
    if (!confirmed.ok) assert.equal(confirmed.error.code, code)
  }
})

test('a failed payment creates no reservation at all', async () => {
  fresh()
  const { confirmed } = await journey('declined')
  assert.equal(confirmed.ok, false)
  const lookup = await handleBookingRequest({ op: 'lookup', reference: 'NJS-ANY' })
  assert.equal(lookup.ok, false)
})

// ---------------------------------------------------------------------------
// The Aiosell adapter, through the server boundary
// ---------------------------------------------------------------------------

test('the aiosell provider refuses through the service, and takes no payment', async () => {
  fresh()
  const searched = await handleBookingRequest({ op: 'search', provider: 'aiosell', query: STAY })
  assert.equal(searched.ok, false)
  if (!searched.ok) assert.equal(searched.error.code, 'PROVIDER_NOT_CONFIGURED')
})

test('an unknown provider name falls back to the mock, never to something unvetted', async () => {
  fresh()
  const searched = await handleBookingRequest({ op: 'search', provider: 'evil', query: STAY })
  assert.equal(searched.ok, true)
})

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

test('a caller is rate limited within the window and released after it', () => {
  resetRateLimitForTests()
  const now = 1_000_000
  for (let i = 0; i < RATE_LIMIT_MAX; i++) {
    assert.equal(rateLimit('caller', now), true, `request ${i + 1} should be allowed`)
  }
  assert.equal(rateLimit('caller', now), false)
  // A different caller is unaffected.
  assert.equal(rateLimit('other', now), true)
  // The window rolls over.
  assert.equal(rateLimit('caller', now + 60_001), true)
})

// ---------------------------------------------------------------------------
// The client's own failure handling
// ---------------------------------------------------------------------------

test('the client reads a 404 as the feature being unavailable, not as a fault', async () => {
  const client = createBookingClient({
    fetchImpl: async () => new Response(null, { status: 404 }),
  })
  const result = await client.search(STAY)
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.error.code, 'BOOKING_DISABLED')
    assert.equal(result.error.retryable, false)
  }
})

test('the client turns an unreachable network into a retryable error', async () => {
  const client = createBookingClient({
    fetchImpl: async () => {
      throw new Error('getaddrinfo ENOTFOUND booking.internal')
    },
  })
  const result = await client.search(STAY)
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.error.code, 'PROVIDER_UNAVAILABLE')
    assert.equal(result.error.retryable, true)
    // The host name from the exception must not reach the guest.
    assert.doesNotMatch(result.error.message, /ENOTFOUND|booking\.internal/)
  }
})

test('the client sends references and intents, never rates or payment outcomes', async () => {
  const sent: Record<string, unknown>[] = []
  const client = createBookingClient({
    fetchImpl: async (_url, init) => {
      sent.push(JSON.parse(String((init as RequestInit).body)))
      return new Response(JSON.stringify({ ok: true, value: null }), { status: 200 })
    },
  })

  await client.hold('Q-123', {
    firstName: 'A',
    lastName: 'B',
    email: 'a@b.test',
    phone: '2348031234567',
    phoneDisplay: '0803 123 4567',
    specialRequests: null,
  })
  await client.confirm('D-123', { idempotencyKey: 'k-12345678', simulate: 'declined' })

  const [hold, confirm] = sent
  assert.equal(hold.quoteRef, 'Q-123')
  assert.equal(hold.quote, undefined)
  assert.equal(hold.rate, undefined)
  assert.equal(confirm.draftRef, 'D-123')
  assert.equal(confirm.payment, undefined)
  assert.equal(confirm.amount, undefined)
  assert.equal(confirm.simulate, 'declined')
})

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

test('the service and the route both refuse on production', () => {
  const out = execFileSync(
    process.execPath,
    [
      '--no-warnings',
      '--input-type=module',
      '-e',
      `import { handleBookingRequest } from './lib/booking/service.ts'
       const r = await handleBookingRequest({ op: 'search', query: ${JSON.stringify(STAY)} })
       process.stdout.write(r.ok ? 'ALLOWED' : r.error.code)`,
    ],
    { env: { ...process.env, VERCEL_ENV: 'production' }, encoding: 'utf8', cwd: process.cwd() },
  )
  assert.equal(out, 'BOOKING_DISABLED')
})
