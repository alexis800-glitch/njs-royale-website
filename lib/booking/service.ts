// The booking service — what the HTTP route actually does.
//
// Split out from the route the way lib/registrations/service.ts is, so the
// whole request path can be tested by calling a function rather than by
// standing up a server.
//
// Three things happen here that cannot happen in a browser:
//
//  1. Every payload is validated server-side before a provider sees it. The
//     client validates too, for a responsive form, but this is the authority.
//  2. Quotes and drafts are looked up by reference in the server's own store,
//     so a rate or a room the client posts is never used.
//  3. Errors are mapped to BookingError codes. Nothing from an exception — a
//     stack, a hostname, a connection string — reaches the response.

import { BOOKING_ENABLED } from './config.ts'
import type { ProviderId } from './config.ts'
import { validateGuestDetails, validateStayQuery } from './validate.ts'
import { confirmDraft, holdQuote, serverProvider, storeQuote } from './server.ts'
import { PAYMENT_OPTIONS, type PaymentOption } from './payment.ts'
import { fail, type Result } from './types.ts'

export type BookingOp = 'search' | 'quote' | 'hold' | 'confirm' | 'lookup' | 'cancel'

const OPS: BookingOp[] = ['search', 'quote', 'hold', 'confirm', 'lookup', 'cancel']

/**
 * Requests per caller per window.
 *
 * Configurable because an automated browser run is one legitimate caller
 * making hundreds of requests, and locally every caller collapses to the same
 * bucket (see callerKey in the route). Production leaves it at the default.
 */
function configuredMax(): number {
  const raw = Number(process.env.BOOKING_RATE_LIMIT_MAX)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60
}

export const RATE_LIMIT_MAX = configuredMax()
export const RATE_LIMIT_WINDOW_MS = 60_000

interface Bucket {
  count: number
  resetAt: number
}

/**
 * Per-instance rate limiting.
 *
 * The caller key is derived from the forwarded address and held only as a map
 * key for the length of a window. It is never logged, never stored and never
 * returned, so no address outlives the minute it arrived in.
 */
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, now = Date.now()): boolean {
  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false
  bucket.count += 1
  return true
}

export function resetRateLimitForTests(): void {
  buckets.clear()
}

function provider(body: Record<string, unknown>): ProviderId {
  // Honoured only because this route does not exist on production: see the
  // gate below and app/api/booking/route.ts. With a real adapter the provider
  // comes from server configuration alone and this field is ignored.
  return body.provider === 'aiosell' ? 'aiosell' : 'mock'
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

/**
 * Handle one booking request.
 *
 * Returns a Result, which the route serialises. Never throws for an expected
 * condition; a genuine fault is caught at the edge and reported as
 * PROVIDER_UNAVAILABLE rather than leaking its message.
 */
export async function handleBookingRequest(body: unknown): Promise<Result<unknown>> {
  // The gate, again. The route refuses first, but a service that could be
  // called from anywhere should not rely on its caller having checked.
  if (!BOOKING_ENABLED)
    return fail('BOOKING_DISABLED', 'Online booking is not available.', { retryable: false })

  const input = asRecord(body)
  const op = input.op

  if (typeof op !== 'string' || !OPS.includes(op as BookingOp))
    return fail('INVALID_QUERY', 'Unrecognised request.', { retryable: false })

  const providerId = provider(input)
  const engine = serverProvider(providerId)

  switch (op as BookingOp) {
    case 'search': {
      const checked = validateStayQuery(asRecord(input.query))
      if (!checked.ok)
        return fail('INVALID_QUERY', 'Please check your dates and party size.', {
          fields: checked.errors,
        })
      return engine.search(checked.value)
    }

    case 'quote': {
      const selection = asRecord(input.selection)
      const categoryId = selection.categoryId
      if (typeof categoryId !== 'string' || categoryId.length === 0 || categoryId.length > 80)
        return fail('INVALID_QUERY', 'Choose a room category.', { retryable: false })

      const checked = validateStayQuery(asRecord(selection.query))
      if (!checked.ok)
        return fail('INVALID_QUERY', 'Please check your dates and party size.', {
          fields: checked.errors,
        })

      const quoted = await engine.quote({ categoryId, query: checked.value })
      // Stored so that `hold` can read the rate from here rather than from a
      // request body.
      if (quoted.ok) storeQuote(quoted.value, providerId)
      return quoted
    }

    case 'hold': {
      const quoteRef = input.quoteRef
      if (typeof quoteRef !== 'string' || quoteRef.length === 0 || quoteRef.length > 120)
        return fail('QUOTE_EXPIRED', 'Your booking session has expired. Please search again.')

      const guest = validateGuestDetails(asRecord(input.guest))
      if (!guest.ok)
        return fail('INVALID_QUERY', 'Please check your details.', { fields: guest.errors })

      return holdQuote(quoteRef, guest.value)
    }

    case 'confirm': {
      const draftRef = input.draftRef
      const idempotencyKey = input.idempotencyKey
      if (typeof draftRef !== 'string' || draftRef.length === 0 || draftRef.length > 120)
        return fail('QUOTE_EXPIRED', 'Your booking session has expired. Please search again.')
      if (
        typeof idempotencyKey !== 'string' ||
        idempotencyKey.length < 8 ||
        idempotencyKey.length > 120
      )
        return fail('INVALID_QUERY', 'Unrecognised request.', { retryable: false })

      // Validated against the allowlist rather than cast. An unrecognised
      // option becomes Pay Now, which is the option that cannot leave a
      // reservation resting on a card nobody verified.
      const requested = input.paymentOption
      const paymentOption: PaymentOption =
        typeof requested === 'string' && (PAYMENT_OPTIONS as string[]).includes(requested)
          ? (requested as PaymentOption)
          : 'pay-now'

      const simulate = input.simulate
      const allowed = ['authorised', 'declined', 'abandoned', 'processor-outage'] as const
      type Simulated = (typeof allowed)[number]
      const chosen =
        typeof simulate === 'string' && (allowed as readonly string[]).includes(simulate)
          ? (simulate as Simulated)
          : 'authorised'

      return confirmDraft({ draftRef, paymentOption, idempotencyKey, simulate: chosen })
    }

    case 'lookup':
    case 'cancel': {
      const reference = input.reference
      if (typeof reference !== 'string' || reference.length === 0 || reference.length > 120)
        return fail('INVALID_QUERY', 'Unrecognised reservation reference.', { retryable: false })
      return op === 'lookup' ? engine.lookup(reference) : engine.cancel(reference)
    }
  }
}
