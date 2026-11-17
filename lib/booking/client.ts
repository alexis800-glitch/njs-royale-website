// The client-safe booking interface.
//
// This is what a browser is allowed to hold. It imports types and fetch, and
// nothing else: no adapter, no credential, no provider factory. Everything it
// can do is one POST to /api/booking, which the server validates from scratch.
//
// BookingClient is deliberately NOT the same shape as BookingProvider, and the
// difference is the security property:
//
//   BookingProvider.confirm(draft: BookingDraft, payment: PaymentOutcome)
//   BookingClient.confirm(draftRef: string, intent: ConfirmIntent)
//
// The provider interface takes a whole draft and a payment OUTCOME, because
// the server legitimately knows both. The client interface takes references
// and an INTENT, because a browser must be able to say what it wants and never
// what happened. A client that could pass {status: 'authorised'} could book
// without paying; a client that could pass a draft could set its own rate.
// Neither is expressible here — not forbidden by a check that might be
// forgotten, but absent from the type.
//
// The same reasoning applies to `hold`, which takes a quote reference rather
// than a Quote: the rate used is the one the server calculated and stored.

import type {
  BookingDraft,
  CancellationResult,
  Confirmation,
  GuestDetails,
  Quote,
  Result,
  RoomOffer,
  Selection,
  StayQuery,
} from './types.ts'

export interface ConfirmIntent {
  /**
   * Generated once per draft and reused on every retry, so that a double-tap
   * or a network replay returns the first reservation instead of creating a
   * second one.
   */
  idempotencyKey: string
  /**
   * Prototype only: which scripted payment result to simulate. The server
   * honours it only because the booking route is preview-only and no processor
   * exists. With a real processor the server initiates payment and decides the
   * outcome itself.
   */
  simulate?: 'authorised' | 'declined' | 'abandoned' | 'processor-outage'
}

export interface BookingClient {
  search(query: StayQuery): Promise<Result<RoomOffer[]>>
  quote(selection: Selection): Promise<Result<Quote>>
  hold(quoteRef: string, guest: GuestDetails): Promise<Result<BookingDraft>>
  confirm(draftRef: string, intent: ConfirmIntent): Promise<Result<Confirmation>>
  lookup(reference: string): Promise<Result<Confirmation>>
  cancel(reference: string): Promise<Result<CancellationResult>>
}

export interface BookingClientOptions {
  /** Which adapter the server should use. Preview-only; see ConfirmIntent. */
  providerId?: 'mock' | 'aiosell'
  endpoint?: string
  /** Injected in tests. */
  fetchImpl?: typeof fetch
}

const UNREACHABLE = {
  ok: false as const,
  error: {
    code: 'PROVIDER_UNAVAILABLE' as const,
    message: 'We could not reach the booking system. Please try again in a moment.',
    retryable: true,
  },
}

export function createBookingClient(options: BookingClientOptions = {}): BookingClient {
  const endpoint = options.endpoint ?? '/api/booking'
  const providerId = options.providerId ?? 'mock'
  const doFetch = options.fetchImpl ?? fetch

  async function post<T>(payload: Record<string, unknown>): Promise<Result<T>> {
    try {
      const response = await doFetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, provider: providerId }),
      })

      // A 404 means the feature is not deployed here, which is the expected
      // answer on production rather than a fault.
      if (response.status === 404)
        return {
          ok: false,
          error: {
            code: 'BOOKING_DISABLED',
            message: 'Online booking is not available. Please contact the resort.',
            retryable: false,
          },
        }

      if (!response.ok && response.status !== 200) {
        const body = (await response.json().catch(() => null)) as Result<T> | null
        if (body && body.ok === false) return body
        return UNREACHABLE
      }

      return (await response.json()) as Result<T>
    } catch {
      // Offline, DNS, CORS, an aborted request: all the same to a guest, and
      // all retryable.
      return UNREACHABLE
    }
  }

  return {
    search: (query) => post<RoomOffer[]>({ op: 'search', query }),
    quote: (selection) => post<Quote>({ op: 'quote', selection }),
    hold: (quoteRef, guest) => post<BookingDraft>({ op: 'hold', quoteRef, guest }),
    confirm: (draftRef, intent) =>
      post<Confirmation>({
        op: 'confirm',
        draftRef,
        idempotencyKey: intent.idempotencyKey,
        simulate: intent.simulate,
      }),
    lookup: (reference) => post<Confirmation>({ op: 'lookup', reference }),
    cancel: (reference) => post<CancellationResult>({ op: 'cancel', reference }),
  }
}
