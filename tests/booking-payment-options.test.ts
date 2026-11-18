import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { handleBookingRequest, resetRateLimitForTests } from '../lib/booking/service.ts'
import { resetBookingServerStateForTests } from '../lib/booking/server.ts'
import { createMockPaymentProvider } from '../lib/booking/mock/payment.ts'
import { NO_PAYMENT_PROVIDER, PAYMENT_OPTIONS } from '../lib/booking/payment.ts'
import {
  UNCONFIRMED_POLICY,
  cancellationSummary,
  isPolicyUnconfirmed,
  noShowSummary,
  payNowSummary,
} from '../lib/booking/policy.ts'
import type { BookingDraft, Confirmation, Quote } from '../lib/booking/types.ts'

const STAY = {
  arrival: '2027-07-24',
  departure: '2027-07-27',
  adults: 2,
  children: 0,
  rooms: 1,
}
const GUEST = {
  firstName: 'Amara',
  lastName: 'Test-Guest',
  email: 'amara.test-guest@example.test',
  phone: '0803 000 0000',
}
const EXPENSIVE = 'presidential-suite-ocean'

function fresh() {
  resetBookingServerStateForTests()
  resetRateLimitForTests()
}

async function confirmWith(
  paymentOption: 'pay-now' | 'card-guarantee' | unknown,
  { categoryId = 'royale-room-resort-side', email = GUEST.email, simulate = 'authorised', key = 'k-0000000001' } = {},
) {
  const quoted = await handleBookingRequest({
    op: 'quote',
    selection: { categoryId, query: STAY },
  })
  if (!quoted.ok) throw new Error('quote failed')
  const held = await handleBookingRequest({
    op: 'hold',
    quoteRef: (quoted.value as Quote).quoteRef,
    guest: { ...GUEST, email },
  })
  if (!held.ok) throw new Error('hold failed')
  const confirmed = await handleBookingRequest({
    op: 'confirm',
    draftRef: (held.value as BookingDraft).draftRef,
    paymentOption,
    idempotencyKey: key,
    simulate,
  })
  return { quote: quoted.value as Quote, draft: held.value as BookingDraft, confirmed }
}

// ---------------------------------------------------------------------------
// Pay Now
// ---------------------------------------------------------------------------

test('Pay Now charges the amount from the server draft and records it', async () => {
  fresh()
  const { confirmed } = await confirmWith('pay-now')
  assert.equal(confirmed.ok, true)
  if (!confirmed.ok) return
  const c = confirmed.value as Confirmation
  assert.equal(c.payment.option, 'pay-now')
  assert.equal(c.payment.status, 'authorised')
  assert.equal(c.payment.amountPaid, 750_000)
  assert.equal(c.payment.guarantee, null)
})

// ---------------------------------------------------------------------------
// Pay Later — card guaranteed
// ---------------------------------------------------------------------------

test('a card guarantee charges nothing, whatever the stay costs', async () => {
  fresh()
  const { quote, confirmed } = await confirmWith('card-guarantee', { categoryId: EXPENSIVE })
  // A stay worth six million naira.
  assert.equal(quote.rate.total, 6_000_000)
  assert.equal(confirmed.ok, true)
  if (!confirmed.ok) return
  const c = confirmed.value as Confirmation
  assert.equal(c.payment.option, 'card-guarantee')
  assert.equal(c.payment.status, 'guaranteed')
  // Zero. Not the room rate, not a deposit, not a percentage.
  assert.equal(c.payment.amountPaid, 0)
})

test('a guarantee holds no funds, and says so in a way that cannot drift', async () => {
  fresh()
  const { confirmed } = await confirmWith('card-guarantee')
  assert.equal(confirmed.ok, true)
  if (!confirmed.ok) return
  const g = (confirmed.value as Confirmation).payment.guarantee
  assert.ok(g, 'a guarantee should be recorded')
  assert.equal(g!.fundsHeld, false)
  assert.equal(g!.mandate.scope, 'unscheduled-card-on-file')
})

test('the guarantee records only a token, never card data', async () => {
  fresh()
  const { confirmed } = await confirmWith('card-guarantee')
  if (!confirmed.ok) throw new Error('unreachable')
  const g = (confirmed.value as Confirmation).payment.guarantee!
  assert.match(g.card.tokenRef, /^MOCK-TOK-/)
  assert.equal(g.card.last4, '4242')
  // The serialised guarantee must contain nothing that looks like a card.
  const json = JSON.stringify(g)
  for (const forbidden of ['cardNumber', 'cvv', 'cvc', 'securityCode', 'pan']) {
    assert.ok(!json.includes(forbidden), `serialised guarantee must not mention ${forbidden}`)
  }
  // Sixteen consecutive digits would be a card number.
  assert.doesNotMatch(json, /\d{13,19}/)
})

test('what the mock cannot know stays null rather than being invented', async () => {
  fresh()
  const { confirmed } = await confirmWith('card-guarantee')
  if (!confirmed.ok) throw new Error('unreachable')
  const g = (confirmed.value as Confirmation).payment.guarantee!
  // Each null below is a requirement on the eventual processor. Filling any of
  // them in with a plausible value would hide that requirement.
  assert.equal(g.card.networkTokenised, null, 'only a real processor can claim a network token')
  assert.equal(g.verification.assuranceExpiresAt, null, 'the verification window is unknown')
  assert.equal(g.verification.threeDSecure, null)
  assert.equal(g.mandate.termsVersion, null, 'NJS has approved no terms to reference')
  assert.equal(g.mandate.initialNetworkTransactionId, null)
  assert.equal(g.reverifyBefore, null, 'no re-verification schedule has been agreed')
})

test('a card that cannot be verified yields no guarantee and no reservation', async () => {
  fresh()
  const { confirmed } = await confirmWith('card-guarantee', { email: 'decline@example.test' })
  assert.equal(confirmed.ok, false)
  if (!confirmed.ok) assert.equal(confirmed.error.code, 'PAYMENT_FAILED')
})

test('a guest who abandons the card form leaves the booking unconfirmed', async () => {
  fresh()
  const { confirmed } = await confirmWith('card-guarantee', { email: 'abandon@example.test' })
  assert.equal(confirmed.ok, false)
  if (!confirmed.ok) assert.equal(confirmed.error.code, 'PAYMENT_REQUIRED')
})

// ---------------------------------------------------------------------------
// The option is the server's to interpret
// ---------------------------------------------------------------------------

test('an unrecognised payment option falls back to Pay Now, never to a guarantee', async () => {
  fresh()
  for (const bogus of ['free', 'card_guarantee', '', 42, null, undefined]) {
    resetBookingServerStateForTests()
    const { confirmed } = await confirmWith(bogus, { key: `k-${String(bogus)}-000000` })
    assert.equal(confirmed.ok, true)
    if (confirmed.ok) {
      assert.equal((confirmed.value as Confirmation).payment.option, 'pay-now')
    }
  }
})

test('both options are offered, and only those two', () => {
  assert.deepEqual(PAYMENT_OPTIONS, ['pay-now', 'card-guarantee'])
})

// ---------------------------------------------------------------------------
// Capabilities and the unconfigured default
// ---------------------------------------------------------------------------

test('no provider claims any payment capability, because none has been evaluated', () => {
  for (const provider of [NO_PAYMENT_PROVIDER, createMockPaymentProvider()]) {
    for (const [name, value] of Object.entries(provider.capabilities)) {
      if (name === 'currencies') continue
      assert.equal(value, false, `${provider.id} must not claim ${name}`)
    }
  }
})

test('the default provider refuses a guarantee as well as a payment', async () => {
  const paid = await NO_PAYMENT_PROVIDER.pay({
    amount: 1,
    currency: 'NGN',
    reference: 'r',
    description: 'd',
  })
  const held = await NO_PAYMENT_PROVIDER.guarantee({
    reference: 'r',
    currency: 'NGN',
    description: 'd',
    arrival: '2027-07-24',
  })
  assert.equal(paid.ok, false)
  assert.equal(held.ok, false)
  if (!held.ok) {
    assert.equal(held.error.code, 'PROVIDER_NOT_CONFIGURED')
    assert.match(held.error.message, /Card guarantees are not available/)
  }
})

test('the Aiosell path takes no payment and holds no card', async () => {
  fresh()
  const searched = await handleBookingRequest({
    op: 'search',
    provider: 'aiosell',
    query: STAY,
  })
  assert.equal(searched.ok, false)
  if (!searched.ok) assert.equal(searched.error.code, 'PROVIDER_NOT_CONFIGURED')
})

// ---------------------------------------------------------------------------
// Policy — nothing confirmed
// ---------------------------------------------------------------------------

test('every reservation term is still unconfirmed', () => {
  assert.equal(isPolicyUnconfirmed(UNCONFIRMED_POLICY), true)
  assert.equal(UNCONFIRMED_POLICY.freeCancellationHoursBeforeArrival, null)
  assert.equal(UNCONFIRMED_POLICY.noShowCharge, null)
  assert.equal(UNCONFIRMED_POLICY.payNowBasis, null)
  assert.equal(UNCONFIRMED_POLICY.deposit, null)
  assert.equal(UNCONFIRMED_POLICY.termsVersion, null)
})

test('the policy summaries say "to be confirmed" and name no number', () => {
  for (const line of [
    cancellationSummary(UNCONFIRMED_POLICY),
    noShowSummary(UNCONFIRMED_POLICY),
    payNowSummary(UNCONFIRMED_POLICY),
  ]) {
    assert.match(line, /to be confirmed/i)
    // No invented hours, percentages or amounts.
    assert.doesNotMatch(line, /\d/)
  }
})

// ---------------------------------------------------------------------------
// The rule that must never be broken
// ---------------------------------------------------------------------------

test('no booking source file declares a field for raw card data', () => {
  const roots = ['lib/booking', 'components/booking', 'app/api/booking', 'app/booking']
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.(ts|tsx)$/.test(path)) files.push(path)
    }
  }
  roots.forEach(walk)
  assert.ok(files.length > 15, 'expected to scan the whole booking subsystem')

  // A PROPERTY DECLARATION, not a mention: the comments in payment.ts discuss
  // these names at length and must stay legal. This matches `cvv:` or `cvv?:`
  // at the start of a line, which is what a field looks like.
  const forbidden = /^\s*(cardNumber|card_number|pan|cvv|cvc|securityCode|security_code|cardholderName)\s*\??\s*:/im
  const offenders = files.filter((f) => forbidden.test(readFileSync(f, 'utf8')))
  assert.deepEqual(offenders, [], 'raw card fields must not exist in the booking subsystem')
})

test('no booking component renders a card-number input', () => {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.tsx$/.test(path)) files.push(path)
    }
  }
  walk('components/booking')
  walk('app/booking')

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    for (const marker of ['cc-number', 'cc-csc', 'cc-exp', 'autoComplete="cc']) {
      assert.ok(!source.includes(marker), `${file} must not collect card data (${marker})`)
    }
  }
})
