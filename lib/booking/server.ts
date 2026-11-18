// The server side of the booking boundary.
//
// Everything that must never reach a browser lives here: the provider
// instance, the credentials a real adapter would read from the environment,
// the authoritative copy of each draft, and the decision about whether a
// payment succeeded.
//
// The rule this file exists to enforce: THE CLIENT NEVER ASSERTS AN OUTCOME.
// A browser may say what it wants to do — search these dates, hold this quote,
// confirm this draft — and may never say what happened. In particular it can
// neither construct a PaymentOutcome nor post a rate. A client that could hand
// the server {status: 'authorised'} could book without paying, and a client
// that could post its own rate could book at a price it chose. Both are
// structurally impossible here, because the server reads the amount from its
// own copy of the draft and runs the payment itself.
//
// This module throws if it is ever imported into a browser bundle. There is no
// `server-only` package in this project's dependencies, so the guard is a
// runtime check rather than a build-time one — it still fails loudly, in
// development, the first time someone makes that mistake.

import { randomUUID } from 'node:crypto'
import { BOOKING_PROVIDER, type ProviderId } from './config.ts'
import { createMockProvider } from './mock/provider.ts'
import { createAiosellProvider } from './aiosell/provider.ts'
import { createMockPaymentProvider } from './mock/payment.ts'
import { NO_PAYMENT_PROVIDER, type PaymentOption, type PaymentOutcome } from './payment.ts'
import type { BookingProvider } from './provider.ts'
import {
  fail,
  ok,
  type BookingDraft,
  type Confirmation,
  type GuestDetails,
  type Quote,
  type Result,
} from './types.ts'

if (typeof window !== 'undefined') {
  throw new Error(
    'lib/booking/server.ts was imported into a browser bundle. It must stay server-side.',
  )
}

// ---------------------------------------------------------------------------
// Provider instances
// ---------------------------------------------------------------------------

/**
 * One provider per id, created once per server instance.
 *
 * A singleton rather than a per-request factory, because the mock keeps the
 * drafts it issued: a journey spans several requests and the second one has to
 * find what the first one wrote.
 */
const providers = new Map<ProviderId, BookingProvider>()

export function serverProvider(id: ProviderId = BOOKING_PROVIDER): BookingProvider {
  const existing = providers.get(id)
  if (existing) return existing
  const created = id === 'aiosell' ? createAiosellProvider() : createMockProvider()
  providers.set(id, created)
  return created
}

// ---------------------------------------------------------------------------
// The draft store — the server's own copy
// ---------------------------------------------------------------------------

interface StoredDraft {
  draft: BookingDraft
  providerId: ProviderId
  storedAt: number
}

const DRAFT_TTL_MS = 30 * 60 * 1000

/**
 * Drafts the server issued, keyed by draftRef.
 *
 * This is the authoritative copy. `confirm` reads the amount and the selection
 * from here and never from the request body, so a browser cannot alter a price
 * between holding a room and paying for it.
 *
 * In memory, per server instance, and deliberately not a database: the brief
 * forbids a reservation database, and under the recommended architecture
 * Aiosell remains the authoritative store rather than us. The consequence is
 * real and is left visible: if a journey spans a cold start, the draft is gone
 * and `confirm` answers QUOTE_EXPIRED. That is a state the journey already
 * renders, and the same state a real engine would produce when a held quote
 * lapses, so the prototype exercises it rather than hiding it.
 */
const drafts = new Map<string, StoredDraft>()

/** Confirmed idempotency keys, so a retry returns the first reservation. */
const confirmations = new Map<string, Confirmation>()

interface StoredQuote {
  quote: Quote
  providerId: ProviderId
  storedAt: number
}

/**
 * Quotes the server issued, keyed by quoteRef.
 *
 * Same reasoning as the draft store, one step earlier in the journey. The
 * client is given a quote to display and sends back only its reference, so the
 * rate that reaches `hold` is the rate the server calculated. If the client
 * posted the Quote object instead, it could hold a ₦2,000,000 Presidential
 * Suite at a rate of its own choosing.
 */
const quotes = new Map<string, StoredQuote>()

function sweep(now: number) {
  // Array.from rather than iterating the Map directly: the project's
  // TypeScript target does not allow Map iteration, and collecting first also
  // avoids deleting from a Map while walking it.
  for (const ref of Array.from(drafts.keys())) {
    const stored = drafts.get(ref)
    if (stored && now - stored.storedAt > DRAFT_TTL_MS) drafts.delete(ref)
  }
  for (const ref of Array.from(quotes.keys())) {
    const stored = quotes.get(ref)
    if (stored && now - stored.storedAt > DRAFT_TTL_MS) quotes.delete(ref)
  }
}

export function storeQuote(quote: Quote, providerId: ProviderId): void {
  const now = Date.now()
  sweep(now)
  quotes.set(quote.quoteRef, { quote, providerId, storedAt: now })
}

export function readQuote(quoteRef: string): StoredQuote | undefined {
  sweep(Date.now())
  return quotes.get(quoteRef)
}

/**
 * Hold a previously quoted stay for a guest.
 *
 * Takes a quote REFERENCE, not a quote. The rate, the room and the dates all
 * come from the server's stored copy.
 */
export async function holdQuote(
  quoteRef: string,
  guest: GuestDetails,
): Promise<Result<BookingDraft>> {
  const stored = readQuote(quoteRef)
  if (!stored)
    return fail<BookingDraft>(
      'QUOTE_EXPIRED',
      'Your booking session has expired. Please search again.',
    )

  const provider = serverProvider(stored.providerId)
  const held = await provider.hold(stored.quote, guest)
  if (!held.ok) return held

  storeDraft(held.value, stored.providerId)
  return held
}

export function storeDraft(draft: BookingDraft, providerId: ProviderId): void {
  const now = Date.now()
  sweep(now)
  drafts.set(draft.draftRef, { draft, providerId, storedAt: now })
}

export function readDraft(draftRef: string): StoredDraft | undefined {
  sweep(Date.now())
  return drafts.get(draftRef)
}

// ---------------------------------------------------------------------------
// Confirmation, including payment
// ---------------------------------------------------------------------------

export interface ConfirmRequest {
  draftRef: string
  /**
   * Pay now, or reserve against a card guarantee. Chosen by the guest, carried
   * here as a label; what it causes is decided entirely on this side.
   */
  paymentOption: PaymentOption
  /**
   * Supplied by the client so that a retried request does not create a second
   * reservation. The client generates it once per draft and reuses it on every
   * attempt, which is what makes the retry safe.
   */
  idempotencyKey: string
  /**
   * Prototype only: which scripted payment outcome to simulate. Honoured
   * because this whole route is preview-only and no processor exists. With a
   * real processor the server initiates payment and this field is ignored.
   */
  simulate?: 'authorised' | 'declined' | 'abandoned' | 'processor-outage'
}

const SIMULATED_EMAIL: Record<NonNullable<ConfirmRequest['simulate']>, string | null> = {
  authorised: null,
  declined: 'decline@example.test',
  abandoned: 'abandon@example.test',
  'processor-outage': 'outage@example.test',
}

/**
 * Confirm a held draft, taking payment first.
 *
 * Every number used here comes from the server's stored draft. The request
 * contributes a reference and an idempotency key and nothing else.
 */
export async function confirmDraft(request: ConfirmRequest): Promise<Result<Confirmation>> {
  const already = confirmations.get(request.idempotencyKey)
  if (already) return ok(already)

  const stored = readDraft(request.draftRef)
  if (!stored)
    return fail<Confirmation>(
      'QUOTE_EXPIRED',
      'Your booking session has expired. Please search again.',
    )

  const { draft, providerId } = stored
  const provider = serverProvider(providerId)

  // In production this is where a real PaymentProvider would be resolved from
  // server-side configuration. NO_PAYMENT_PROVIDER is the default and refuses,
  // because no processor has been selected.
  const simulate = request.simulate ?? 'authorised'
  const scriptedEmail = SIMULATED_EMAIL[simulate]
  const payments =
    providerId === 'aiosell'
      ? NO_PAYMENT_PROVIDER
      : createMockPaymentProvider({ guestEmail: scriptedEmail ?? draft.guest.email })

  const description = `${draft.quote.offer.name} — ${draft.quote.rate.nights} nights`

  // The branch that matters. Pay Now charges the amount from the server's own
  // draft; a card guarantee charges nothing at all and carries no amount into
  // the request, so there is no path by which a guarantee could take money.
  const paid =
    request.paymentOption === 'card-guarantee'
      ? await payments.guarantee({
          reference: draft.draftRef,
          currency: draft.quote.rate.currency,
          description,
          // The arrival date goes with the request so that the gap between
          // booking and arrival is visible to whatever handles it.
          arrival: draft.selection.query.arrival,
        })
      : await payments.pay({
          // From the server's draft, never from the request.
          amount: draft.quote.rate.total,
          currency: draft.quote.rate.currency,
          reference: draft.draftRef,
          description,
        })

  if (!paid.ok) return fail<Confirmation>(paid.error.code, paid.error.message, {
    retryable: paid.error.retryable,
  })

  const outcome: PaymentOutcome = paid.value
  const confirmed = await provider.confirm(draft, outcome)
  if (!confirmed.ok) return confirmed

  confirmations.set(request.idempotencyKey, confirmed.value)
  return confirmed
}

/** A fresh idempotency key, for callers that need one server-side. */
export function newIdempotencyKey(): string {
  return randomUUID()
}

/** Test seam: empty the stores between tests. Never called in production. */
export function resetBookingServerStateForTests(): void {
  drafts.clear()
  quotes.clear()
  confirmations.clear()
  providers.clear()
}
