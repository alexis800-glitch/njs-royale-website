// A mock payment provider.
//
// Takes no money, talks to nothing, and exists so that the journey's payment
// states — authorised, declined, abandoned — can be demonstrated and tested
// without a processor being chosen.
//
// Outcomes are scripted by the guest's email address rather than by chance, so
// a tester can reproduce a decline on demand and a test can assert on it. A
// real processor is added by writing another PaymentProvider; nothing in the
// journey changes.

import type { PaymentOutcome, PaymentProvider, PaymentRequest } from '../payment.ts'
import { fail, ok, type Result } from '../types.ts'

/**
 * Scripted outcomes. Any synthetic guest whose email contains one of these
 * markers gets that outcome.
 */
export const SCRIPTED_OUTCOMES = {
  /** decline@example.test -> the processor refuses. */
  decline: 'decline',
  /** abandon@example.test -> the guest walks away from the payment page. */
  abandon: 'abandon',
  /** outage@example.test -> the processor itself is unreachable. */
  outage: 'outage',
} as const

export interface MockPaymentOptions {
  now?: () => Date
  /** The synthetic guest email, which selects the scripted outcome. */
  guestEmail?: string
}

export function createMockPaymentProvider(options: MockPaymentOptions = {}): PaymentProvider {
  const now = options.now ?? (() => new Date())
  const email = (options.guestEmail ?? '').toLowerCase()

  return {
    id: 'mock',
    label: 'Mock payment (no money moves, no processor is connected)',
    capabilities: {
      // All false, truthfully: no processor has been evaluated, so nothing can
      // be claimed about settlement, refunds or idempotency.
      ngnSettlement: false,
      refunds: false,
      idempotent: false,
      currencies: ['NGN'],
    },

    async pay(request: PaymentRequest): Promise<Result<PaymentOutcome>> {
      const at = now().toISOString()

      if (email.includes(SCRIPTED_OUTCOMES.outage))
        return fail<PaymentOutcome>(
          'PROVIDER_UNAVAILABLE',
          'We could not reach the payment service. No reservation has been made and you have not been charged.',
          { retryable: true },
        )

      if (email.includes(SCRIPTED_OUTCOMES.decline))
        return ok({
          status: 'failed',
          reference: request.reference,
          providerReference: null,
          amount: request.amount,
          currency: request.currency,
          method: 'card',
          at,
        })

      if (email.includes(SCRIPTED_OUTCOMES.abandon))
        return ok({
          status: 'cancelled',
          reference: request.reference,
          providerReference: null,
          amount: request.amount,
          currency: request.currency,
          method: null,
          at,
        })

      return ok({
        status: 'authorised',
        reference: request.reference,
        providerReference: `MOCK-${request.reference}`,
        amount: request.amount,
        currency: request.currency,
        method: 'card',
        at,
      })
    },
  }
}
