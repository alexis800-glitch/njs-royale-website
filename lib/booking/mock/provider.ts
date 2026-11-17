// The mock booking provider.
//
// A complete, deterministic implementation of BookingProvider that creates no
// reservation anywhere. It exists so that the guest-facing journey can be
// built, demonstrated and tested end to end before any provider is connected,
// and so that the journey's failure states are reachable on demand rather than
// only when something really breaks.
//
// Determinism is the point. `now` and `random` are injected, so a test can
// assert on an exact reference and a tester can reproduce yesterday's demo.
//
// Reservations live in a Map for the lifetime of the process. That is not a
// database and must not become one: it is per-instance, lost on restart, and
// invisible to any other instance. The brief forbids a production reservation
// database, and this keeps the prototype honest about having no persistence.

import {
  fail,
  ok,
  type BookingDraft,
  type CancellationResult,
  type Confirmation,
  type GuestDetails,
  type Quote,
  type Result,
  type RoomOffer,
  type Selection,
  type StayQuery,
} from '../types.ts'
import { NO_CAPABILITIES, type BookingProvider, type ProviderCapabilities } from '../provider.ts'
import type { PaymentOutcome } from '../payment.ts'
import { partyFits, validateStayQuery } from '../validate.ts'
import { syntheticOffers } from './inventory.ts'

export interface MockProviderOptions {
  /** Clock, for deterministic timestamps and references. */
  now?: () => Date
  /** Uniform [0, 1). Injected so references are reproducible in tests. */
  random?: () => number
  /**
   * Force every call to fail with PROVIDER_UNAVAILABLE, so a tester can see
   * what the journey does when the provider is down without unplugging
   * anything.
   */
  simulateOutage?: boolean
  /**
   * Override where offers come from. The default derives them from the
   * catalogue and the synthetic availability hash, which cannot be made to
   * return nothing for a realistic query — so the sold-out path would otherwise
   * be untestable. Tests pass a stub here; the prototype never does.
   */
  findOffers?: (query: StayQuery) => RoomOffer[]
}

const CAPABILITIES: ProviderCapabilities = {
  ...NO_CAPABILITIES,
  search: true,
  quote: true,
  hold: true,
  confirm: true,
  lookup: true,
  cancel: true,
  // Deliberately false. Changing an existing reservation in place is not
  // modelled, because Aiosell's support for it is unconfirmed and a mock that
  // claimed it would hide the gap.
  modify: false,
  multiRoom: true,
  currencies: ['NGN'],
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1

function token(random: () => number, length: number): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(random() * ALPHABET.length)]
  }
  return out
}

/** NJS-20270723-AB12CD, the shape the resort's own references already use. */
function reference(now: Date, random: () => number): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  return `NJS-${stamp}-${token(random, 6)}`
}

export function createMockProvider(options: MockProviderOptions = {}): BookingProvider {
  const now = options.now ?? (() => new Date())
  const random = options.random ?? Math.random
  const outage = options.simulateOutage ?? false
  const findOffers = options.findOffers ?? syntheticOffers

  // Per-instance, per-process. Not persistence. See the note at the top.
  const drafts = new Map<string, BookingDraft>()
  const reservations = new Map<string, Confirmation>()
  /** draftRef -> reference, so a repeated confirm returns the first booking. */
  const confirmedDrafts = new Map<string, string>()

  const down = <T>(): Result<T> =>
    fail<T>('PROVIDER_UNAVAILABLE', 'The booking system is temporarily unavailable. Please try again in a moment.', {
      retryable: true,
    })

  return {
    id: 'mock',
    label: 'Mock provider (synthetic data, no reservation is created)',
    capabilities: CAPABILITIES,

    async search(query: StayQuery): Promise<Result<RoomOffer[]>> {
      if (outage) return down<RoomOffer[]>()

      // Validated here as well as in the UI: an adapter must not trust its
      // caller any more than a route trusts a browser.
      const checked = validateStayQuery(query)
      if (!checked.ok)
        return fail<RoomOffer[]>('INVALID_QUERY', 'Please check your dates and party size.', {
          fields: checked.errors,
        })

      const offers = findOffers(checked.value)
      if (offers.length === 0)
        return fail<RoomOffer[]>(
          'NO_AVAILABILITY',
          'We have no rooms for those dates. Please try different dates, or fewer rooms.',
        )

      return ok(offers)
    },

    async quote(selection: Selection): Promise<Result<Quote>> {
      if (outage) return down<Quote>()

      const checked = validateStayQuery(selection.query)
      if (!checked.ok)
        return fail<Quote>('INVALID_QUERY', 'Please check your dates and party size.', {
          fields: checked.errors,
        })

      const offer = findOffers(checked.value).find((o) => o.categoryId === selection.categoryId)
      if (!offer)
        return fail<Quote>(
          'NO_AVAILABILITY',
          'That room is no longer available for your dates. Please choose another.',
        )

      if (!partyFits(checked.value, offer.maxOccupancyPerRoom))
        return fail<Quote>('OCCUPANCY_EXCEEDED', 'That room does not take a party of this size.')

      return ok({
        quoteRef: `Q-${token(random, 8)}`,
        selection: { categoryId: selection.categoryId, query: checked.value },
        offer,
        rate: offer.rate,
        // Null: this mock does not hold a price, and whether Aiosell holds one
        // is unconfirmed. The journey must not display a countdown it invented.
        expiresAt: null,
      })
    },

    async hold(quote: Quote, guest: GuestDetails): Promise<Result<BookingDraft>> {
      if (outage) return down<BookingDraft>()

      const draft: BookingDraft = {
        draftRef: `D-${token(random, 8)}`,
        selection: quote.selection,
        quote,
        guest,
        createdAt: now().toISOString(),
        // False, and truthfully so: nothing is reserved anywhere by this call.
        inventoryHeld: false,
      }
      drafts.set(draft.draftRef, draft)
      return ok(draft)
    },

    async confirm(draft: BookingDraft, payment: PaymentOutcome): Promise<Result<Confirmation>> {
      if (outage) return down<Confirmation>()

      if (!drafts.has(draft.draftRef))
        return fail<Confirmation>(
          'QUOTE_EXPIRED',
          'Your booking session has expired. Please search again.',
        )

      // Duplicate-submission guard. A guest who double-taps Confirm, or whose
      // network retries the request, must not create two reservations. Keyed on
      // the draft, so the second attempt returns the first reservation rather
      // than a second one or an error.
      const alreadyConfirmed = confirmedDrafts.get(draft.draftRef)
      if (alreadyConfirmed !== undefined) {
        const existing = reservations.get(alreadyConfirmed)
        if (existing) return ok(existing)
        return fail<Confirmation>('DUPLICATE_SUBMISSION', 'This booking has already been submitted.')
      }

      if (payment.status === 'failed')
        return fail<Confirmation>(
          'PAYMENT_FAILED',
          'Your payment was not completed. No reservation has been made and you have not been charged.',
          { retryable: true },
        )

      if (payment.status === 'cancelled')
        return fail<Confirmation>(
          'PAYMENT_REQUIRED',
          'Payment was not completed, so your reservation has not been confirmed.',
          { retryable: true },
        )

      const confirmation: Confirmation = {
        reference: reference(now(), random),
        status: 'confirmed',
        selection: draft.selection,
        rate: draft.quote.rate,
        guest: draft.guest,
        confirmedAt: now().toISOString(),
        // Null on purpose. The July 2026 Aiosell sandbox push returned HTTP 200
        // with no booking id, so a confirmation with no provider reference is a
        // real state and the journey has to render it.
        providerReference: null,
      }

      confirmedDrafts.set(draft.draftRef, confirmation.reference)
      reservations.set(confirmation.reference, confirmation)
      return ok(confirmation)
    },

    async lookup(ref: string): Promise<Result<Confirmation>> {
      if (outage) return down<Confirmation>()
      const found = reservations.get(ref)
      if (!found) return fail<Confirmation>('NOT_IMPLEMENTED', 'We could not find that reservation.')
      return ok(found)
    },

    async cancel(ref: string): Promise<Result<CancellationResult>> {
      if (outage) return down<CancellationResult>()
      const found = reservations.get(ref)
      if (!found)
        return fail<CancellationResult>('NOT_IMPLEMENTED', 'We could not find that reservation.')

      reservations.set(ref, { ...found, status: 'cancelled' })
      return ok({
        reference: ref,
        status: 'cancelled',
        cancelledAt: now().toISOString(),
        // Null: the refund position is not confirmed, so none is stated.
        refund: null,
      })
    },
  }
}
