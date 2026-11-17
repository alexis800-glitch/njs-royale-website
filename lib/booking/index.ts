// The booking subsystem's front door.
//
// Components import from here and never reach into an adapter. Swapping the
// provider is a change to BOOKING_PROVIDER plus one new file under
// lib/booking/<provider>/ — not a change to the guest-facing journey.

export * from './types.ts'
export * from './dates.ts'
export * from './config.ts'
export * from './validate.ts'
export * from './provider.ts'
export * from './payment.ts'

import { BOOKING_ENABLED, BOOKING_PROVIDER, type ProviderId } from './config.ts'
import type { BookingProvider } from './provider.ts'
import { createMockProvider } from './mock/provider.ts'
import { createAiosellProvider } from './aiosell/provider.ts'

export { createMockProvider } from './mock/provider.ts'
export { createMockPaymentProvider, SCRIPTED_OUTCOMES } from './mock/payment.ts'
export {
  BLOCKED_PENDING_AIOSELL,
  BLOCKED_COUNT,
  MOCKED_COUNT,
  createAiosellProvider,
  type IntegrationFunction,
  type IntegrationState,
} from './aiosell/provider.ts'
export { syntheticOffers, syntheticOffersIncludingSoldOut, buildRate } from './mock/inventory.ts'

/**
 * The provider for this environment.
 *
 * Note what this does NOT do: it does not check BOOKING_ENABLED. Resolving a
 * provider is harmless — it is a factory call, no network, no credentials — and
 * conflating the two switches would make the gate harder to reason about. The
 * gate is enforced where it belongs: the route refuses to render at all on
 * production. assertBookingEnabled() below is for callers that need it in a
 * code path rather than in a route.
 */
export function resolveProvider(id: ProviderId = BOOKING_PROVIDER): BookingProvider {
  switch (id) {
    case 'aiosell':
      return createAiosellProvider()
    case 'mock':
      return createMockProvider()
    default: {
      // Exhaustiveness: adding a ProviderId without a case is a type error here
      // rather than a silent fallback to the mock in production.
      const never: never = id
      throw new Error(`Unknown booking provider: ${String(never)}`)
    }
  }
}

/** Throws unless bookings are enabled for this environment. */
export function assertBookingEnabled(): void {
  if (!BOOKING_ENABLED) {
    throw new Error('Booking is disabled in this environment.')
  }
}
