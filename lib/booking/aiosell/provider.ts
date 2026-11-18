// The Aiosell adapter — a stub, deliberately.
//
// This file implements BookingProvider and refuses every call. It is not an
// unfinished integration; it is the shape of the finished one, with the parts
// that require Aiosell's documentation left empty rather than guessed.
//
// Nothing here invents an endpoint, a field name, an authentication scheme or a
// behaviour. Aiosell has supplied no booking-API documentation, and a plausible
// guess would be worse than nothing: it would look like knowledge, get reviewed
// as knowledge, and fail in a way nobody could distinguish from a bug.
//
// What IS known is recorded in BLOCKED_PENDING_AIOSELL below, and in
// docs/aiosell-booking-readiness.md (PR #28). When the documentation arrives,
// the work is filling in these six methods against the interface the journey
// already uses. No component changes.

import { NO_CAPABILITIES, type BookingProvider, type ProviderCapabilities } from '../provider.ts'
import { fail, type Result } from '../types.ts'

/**
 * Every capability false — meaning unknown, not denied.
 *
 * Aiosell's own open question (readiness doc, Question 15) is whether NJS uses
 * its hosted engine or connects a custom frontend to its APIs. Until that is
 * answered in writing, we do not know which of these six operations are even
 * available to us, so none is claimed.
 */
const CAPABILITIES: ProviderCapabilities = { ...NO_CAPABILITIES }

const NOT_CONFIGURED = (operation: string) =>
  fail<never>(
    'PROVIDER_NOT_CONFIGURED',
    'Online booking is not yet available. Please contact the resort to make a reservation.',
    {
      retryable: false,
      fields: { _operation: operation },
    },
  )

export function createAiosellProvider(): BookingProvider {
  return {
    id: 'aiosell',
    label: 'Aiosell (not configured — awaiting documentation and contractual confirmation)',
    capabilities: CAPABILITIES,
    async search() { return NOT_CONFIGURED('search') as Result<never> },
    async quote() { return NOT_CONFIGURED('quote') as Result<never> },
    async hold() { return NOT_CONFIGURED('hold') as Result<never> },
    async confirm() { return NOT_CONFIGURED('confirm') as Result<never> },
    async lookup() { return NOT_CONFIGURED('lookup') as Result<never> },
    async cancel() { return NOT_CONFIGURED('cancel') as Result<never> },
  }
}

// ---------------------------------------------------------------------------
// What is mocked, and what is blocked
// ---------------------------------------------------------------------------

export type IntegrationState =
  /** Fully exercised against the mock; the Aiosell adapter is a mapping job. */
  | 'mocked'
  /** Modelled in the interface, but the real behaviour is unknown. */
  | 'blocked'

export interface IntegrationFunction {
  id: string
  label: string
  state: IntegrationState
  /** What is still needed, where blocked. */
  needs: string | null
}

/**
 * The honest status of each integration function.
 *
 * This is the machine-readable form of the list NJS has to put to Aiosell. The
 * prototype renders it, so the gap is visible in the demo rather than buried in
 * a document.
 */
export const BLOCKED_PENDING_AIOSELL: IntegrationFunction[] = [
  {
    id: 'journey',
    label: 'Guest-facing booking journey, validation and error states',
    state: 'mocked',
    needs: null,
  },
  {
    id: 'rate-display',
    label: 'Rate presentation from the resort catalogue',
    state: 'mocked',
    needs: null,
  },
  {
    id: 'date-rules',
    label: 'Arrival-date restrictions and stay-length rules',
    state: 'mocked',
    needs: null,
  },
  {
    id: 'availability',
    label: 'Live availability and inventory counts',
    state: 'blocked',
    needs:
      'Whether availability is read from an Aiosell endpoint on demand, or pushed to us and mirrored. Question 26 of the readiness document asks whether a local mirror is even authorised.',
  },
  {
    id: 'rates-sync',
    label: 'Authoritative rates, taxes and service charges',
    state: 'blocked',
    needs:
      'The tax and service position, and whether rates come from Aiosell or from the resort catalogue. Every rate total in this prototype is exclusive of taxes because the position is unconfirmed.',
  },
  {
    id: 'hold',
    label: 'Holding inventory before payment',
    state: 'blocked',
    needs:
      'Whether Aiosell can hold a room, and for how long. The prototype reports inventoryHeld: false because nothing is held.',
  },
  {
    id: 'create',
    label: 'Creating a reservation',
    state: 'blocked',
    needs:
      'Production API access, documentation and contractual permission. The July 2026 sandbox push was accepted but returned no booking id.',
  },
  {
    id: 'modify',
    label: 'Modifying a reservation',
    state: 'blocked',
    needs: 'Whether modification is supported at all, or whether it is cancel-and-rebook.',
  },
  {
    id: 'cancel',
    label: 'Cancelling a reservation and the refund position',
    state: 'blocked',
    needs: 'Cancellation and refund handling, and who is the authority for the policy.',
  },
  {
    id: 'reconcile',
    label: 'Booking confirmation and reconciliation',
    state: 'blocked',
    needs:
      'The confirmation mechanism, and whether a webhook or a poll tells us a reservation landed. A 200 with no booking id is not a confirmation.',
  },
  {
    id: 'payment',
    label: 'Payment, NGN settlement and the 5% fee',
    state: 'blocked',
    needs:
      'Whether payment is ours to take or Aiosell’s, NGN settlement to a Nigerian account, what the reported 5% covers, and duplicate-payment prevention. No processor has been selected.',
  },
  {
    id: 'branding',
    label: 'White-label customisation limits',
    state: 'blocked',
    needs:
      'The supported level of branding, if any part of the journey must run on an Aiosell-hosted page.',
  },
]

export const MOCKED_COUNT = BLOCKED_PENDING_AIOSELL.filter((f) => f.state === 'mocked').length
export const BLOCKED_COUNT = BLOCKED_PENDING_AIOSELL.filter((f) => f.state === 'blocked').length
