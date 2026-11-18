// A mock payment provider.
//
// Takes no money, holds no card, talks to nothing. It exists so that both
// payment experiences — Pay Now and Pay Later against a card guarantee — can be
// demonstrated and tested without a processor being chosen.
//
// It collects no card data of any kind, not even fictional digits typed into a
// form. A real processor collects cards in its own hosted fields; this mock
// skips straight to the token a processor would hand back, because building a
// card form now would be building the one thing that must never exist on an
// NJS page.
//
// Outcomes are scripted by the guest's email address rather than by chance, so
// a tester can reproduce a decline on demand and a test can assert on it.

import {
  NO_PAYMENT_CAPABILITIES,
  type CardGuarantee,
  type GuaranteeRequest,
  type PaymentOutcome,
  type PaymentProvider,
  type PaymentRequest,
} from '../payment.ts'
import { fail, ok, type Result } from '../types.ts'

/**
 * Scripted outcomes. Any synthetic guest whose email contains one of these
 * markers gets that outcome, for both Pay Now and Pay Later.
 */
export const SCRIPTED_OUTCOMES = {
  /** decline@example.test -> the processor refuses the card. */
  decline: 'decline',
  /** abandon@example.test -> the guest walks away. */
  abandon: 'abandon',
  /** outage@example.test -> the processor itself is unreachable. */
  outage: 'outage',
} as const

export interface MockPaymentOptions {
  now?: () => Date
  /** The synthetic guest email, which selects the scripted outcome. */
  guestEmail?: string
}

/**
 * A synthetic card guarantee.
 *
 * Note what is null and why. The mock is not a processor, so it cannot claim a
 * network token, an issuer's verification window, a 3-D Secure result, or the
 * initial transaction id a later charge would have to quote. Nor can it name a
 * terms version, because NJS has approved no terms. Each null is a line item on
 * what the eventual processor must supply, and filling any of them in with a
 * plausible value would hide a requirement.
 */
function syntheticGuarantee(at: string): CardGuarantee {
  return {
    card: {
      tokenRef: `MOCK-TOK-${at.slice(11, 19).replace(/:/g, '')}`,
      // Unknown: only a real processor can say whether it issued a network token.
      networkTokenised: null,
      brand: 'visa',
      // Fictional, and the digits a test card uses precisely so nobody mistakes
      // it for a real card.
      last4: '4242',
      expiryMonth: null,
      expiryYear: null,
    },
    verification: {
      method: 'zero-amount-auth',
      verifiedAt: at,
      // Null, not a guess. How long an issuer's verification means anything is
      // the processor's answer, and inventing one here would let the journey
      // imply the booking-time check still holds at arrival.
      assuranceExpiresAt: null,
      threeDSecure: null,
    },
    mandate: {
      acceptedAt: at,
      // Null: NJS has approved no written terms for a guarantee to reference.
      termsVersion: null,
      // Null: the mock cannot produce the identifier that card scheme rules
      // require a later merchant-initiated charge to quote.
      initialNetworkTransactionId: null,
      scope: 'unscheduled-card-on-file',
    },
    // The literal, always. A guarantee holds no money.
    fundsHeld: false,
    // Null: no re-verification schedule has been agreed.
    reverifyBefore: null,
  }
}

export function createMockPaymentProvider(options: MockPaymentOptions = {}): PaymentProvider {
  const now = options.now ?? (() => new Date())
  const email = (options.guestEmail ?? '').toLowerCase()

  const unreachable = () =>
    fail<PaymentOutcome>(
      'PROVIDER_UNAVAILABLE',
      'We could not reach the payment service. No reservation has been made and you have not been charged.',
      { retryable: true },
    )

  return {
    id: 'mock',
    label: 'Mock payment (no money moves, no card is held, no processor is connected)',
    // All false, truthfully: no processor has been evaluated, so nothing can be
    // claimed about settlement, tokenization, verification or later charges.
    capabilities: { ...NO_PAYMENT_CAPABILITIES, currencies: ['NGN'] },

    async pay(request: PaymentRequest): Promise<Result<PaymentOutcome>> {
      const at = now().toISOString()
      if (email.includes(SCRIPTED_OUTCOMES.outage)) return unreachable()

      if (email.includes(SCRIPTED_OUTCOMES.decline))
        return ok({
          status: 'failed',
          option: 'pay-now',
          reference: request.reference,
          providerReference: null,
          amount: request.amount,
          currency: request.currency,
          method: 'card',
          guarantee: null,
          at,
        })

      if (email.includes(SCRIPTED_OUTCOMES.abandon))
        return ok({
          status: 'cancelled',
          option: 'pay-now',
          reference: request.reference,
          providerReference: null,
          amount: 0,
          currency: request.currency,
          method: null,
          guarantee: null,
          at,
        })

      return ok({
        status: 'authorised',
        option: 'pay-now',
        reference: request.reference,
        providerReference: `MOCK-${request.reference}`,
        amount: request.amount,
        currency: request.currency,
        method: 'card',
        guarantee: null,
        at,
      })
    },

    async guarantee(request: GuaranteeRequest): Promise<Result<PaymentOutcome>> {
      const at = now().toISOString()
      if (email.includes(SCRIPTED_OUTCOMES.outage)) return unreachable()

      if (email.includes(SCRIPTED_OUTCOMES.decline))
        return ok({
          // The card could not be verified, so no guarantee exists.
          status: 'failed',
          option: 'card-guarantee',
          reference: request.reference,
          providerReference: null,
          amount: 0,
          currency: request.currency,
          method: 'card',
          guarantee: null,
          at,
        })

      if (email.includes(SCRIPTED_OUTCOMES.abandon))
        return ok({
          status: 'cancelled',
          option: 'card-guarantee',
          reference: request.reference,
          providerReference: null,
          amount: 0,
          currency: request.currency,
          method: null,
          guarantee: null,
          at,
        })

      return ok({
        status: 'guaranteed',
        option: 'card-guarantee',
        reference: request.reference,
        providerReference: `MOCK-GTEE-${request.reference}`,
        // Zero, always. A guarantee charges nothing.
        amount: 0,
        currency: request.currency,
        method: 'card',
        guarantee: syntheticGuarantee(at),
        at,
      })
    },
  }
}
