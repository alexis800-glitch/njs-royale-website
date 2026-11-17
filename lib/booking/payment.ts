// The payment boundary.
//
// No processor is selected, evaluated, contracted or approved. This file exists
// so that the booking journey can be built, tested and reviewed without that
// decision being made, and so that making it later does not reach into the UI.
//
// What the journey is allowed to know about payment is all here: an amount, a
// currency, a reference, and an outcome. It does not know a processor's name, a
// public key, a redirect, an iframe or an SDK. A processor is added by writing
// one PaymentProvider.
//
// Under some integration options the processor may not be NJS's choice at all —
// if reservations are taken on a provider-hosted page, that page brings its own
// payment. That is one more reason the journey must not be built around a
// particular processor's widget.

import type { Currency, Result } from './types.ts'

export interface PaymentRequest {
  /** Whole naira, matching RateBreakdown.total. */
  amount: number
  currency: Currency
  /** Our own reference for the attempt, for reconciliation. */
  reference: string
  /** One line, shown on the processor's own screens where it supports it. */
  description: string
}

export type PaymentStatus =
  /** Funds authorised or captured; the reservation may be confirmed. */
  | 'authorised'
  /** The guest abandoned the payment. Not an error. */
  | 'cancelled'
  /** Attempted and refused. */
  | 'failed'
  /** No payment was taken because none is required at this stage. */
  | 'not-required'

export interface PaymentOutcome {
  status: PaymentStatus
  /** Our reference for the attempt. */
  reference: string
  /** The processor's identifier, where there is one. */
  providerReference: string | null
  amount: number
  currency: Currency
  /** 'card', 'transfer', and so on. Null where unknown or not applicable. */
  method: string | null
  /** ISO instant. */
  at: string
}

export interface PaymentCapabilities {
  /** Settles to a Nigerian bank account. Unconfirmed for every candidate. */
  ngnSettlement: boolean
  /** Can refund through the same API. */
  refunds: boolean
  /** Guarantees one charge per reference. */
  idempotent: boolean
  currencies: Currency[]
}

export interface PaymentProvider {
  readonly id: string
  readonly label: string
  readonly capabilities: PaymentCapabilities
  /**
   * Attempt a payment. Returns an outcome, including the unsuccessful ones:
   * a declined card is an ordinary result the journey must render, not an
   * exception.
   */
  pay(request: PaymentRequest): Promise<Result<PaymentOutcome>>
}

/**
 * The default. Refuses every payment, because no processor has been chosen.
 *
 * Wired in deliberately rather than left as a null, so that an attempt to take
 * money in an environment where nothing was configured fails loudly and
 * harmlessly instead of reaching a half-configured processor.
 */
export const NO_PAYMENT_PROVIDER: PaymentProvider = {
  id: 'none',
  label: 'No payment provider selected',
  capabilities: { ngnSettlement: false, refunds: false, idempotent: false, currencies: [] },
  async pay() {
    return {
      ok: false,
      error: {
        code: 'PROVIDER_NOT_CONFIGURED',
        message:
          'Online payment is not available. Please contact the resort to complete your reservation.',
        retryable: false,
      },
    }
  },
}

/** A payment that was not asked for, for journeys where none is due yet. */
export function noPaymentRequired(reference: string, currency: Currency = 'NGN'): PaymentOutcome {
  return {
    status: 'not-required',
    reference,
    providerReference: null,
    amount: 0,
    currency,
    method: null,
    at: new Date().toISOString(),
  }
}
