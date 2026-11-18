// The payment boundary.
//
// No processor is selected, evaluated, contracted or approved. Not Paystack,
// not Flutterwave, not a bank gateway. This file exists so that the booking
// journey can be built, tested and reviewed without that decision being made,
// and so that making it later does not reach into the UI.
//
// NJS offers two payment experiences:
//
//   Pay Now              the guest pays the required amount at booking
//   Pay Later            the guest reserves against a card guarantee
//
// =========================================================================
// WHAT A CARD GUARANTEE ACTUALLY IS, AND WHAT IT IS NOT
// =========================================================================
//
// It is NOT a held sum of money. An authorisation reserves funds for days —
// commonly 7, sometimes up to about 30 — and then falls away. Guest rooms open
// on 23 July 2027; a reservation taken when advance bookings open on
// 19 December 2026 sits roughly seven months before arrival. No authorisation
// survives that, and a design that assumes one would fail silently: the hold
// would lapse, nobody would be told, and the first anyone learned of it would
// be a declined no-show charge months later.
//
// A workable guarantee is three separate things, and the types below keep them
// separate because they expire on different clocks:
//
//   1. A TOKEN. The processor stores the card and returns a reference. This is
//      the part that persists. A network token is better than a processor
//      token because it survives the card being reissued.
//
//   2. A VERIFICATION. A zero-amount or small, immediately-voided
//      authorisation proving the card was live AT THE TIME OF BOOKING. It says
//      nothing whatever about July 2027, which is why CardVerification carries
//      an explicit expiry and CardGuarantee carries a re-verification date.
//
//   3. A MANDATE. The guest's recorded consent that NJS may charge that card
//      later under stated terms, plus the initial transaction identifier that
//      later merchant-initiated charges must reference under card scheme
//      rules. Without it the later charge is likelier to be declined and
//      harder to defend in a dispute.
//
// So the later charge is an attempt, not a certainty: a merchant-initiated,
// unscheduled card-on-file transaction that can decline for insufficient
// funds, a cancelled card, or an issuer that does not like it. The guarantee
// is a commitment by the guest plus a means of trying to collect — never
// reserved money. Nothing in this prototype may imply otherwise.
//
// =========================================================================
// CARD DATA
// =========================================================================
//
// No type in this subsystem has a field for a card number, an expiry entered
// by a guest, or a security code, and none ever should. Collection belongs in
// the processor's own hosted fields or iframe, so that raw card data never
// touches an NJS server, an NJS log, or this repository — which is also what
// keeps PCI DSS scope at the lightest level. CardReference below holds only
// what a processor hands back for display: a token, a brand, the last four
// digits. A test asserts that no forbidden field name exists anywhere here.

import type { Currency, Result } from './types.ts'

// ---------------------------------------------------------------------------
// The two options
// ---------------------------------------------------------------------------

export type PaymentOption =
  /** The guest pays the required amount at booking. */
  | 'pay-now'
  /** The guest reserves against a card guarantee and pays later. */
  | 'card-guarantee'

export const PAYMENT_OPTIONS: PaymentOption[] = ['pay-now', 'card-guarantee']

// ---------------------------------------------------------------------------
// Card data we are allowed to hold
// ---------------------------------------------------------------------------

/**
 * A reference to a card, never a card.
 *
 * Everything here is what a processor returns for display and reuse. There is
 * deliberately no field for a primary account number, a CVV/CVC, or a
 * cardholder-entered expiry, because NJS must never receive, log or store
 * them.
 */
export interface CardReference {
  /** The processor's own token. Opaque to us. */
  tokenRef: string
  /**
   * Whether this is a network token rather than a processor-local one. Network
   * tokens survive the card being reissued, which matters a great deal when
   * the charge may be seven months away. Null where the processor does not say.
   */
  networkTokenised: boolean | null
  /** 'visa', 'mastercard', 'verve' — for display only. Null where unknown. */
  brand: string | null
  /** Last four digits, for the guest to recognise the card. Null where unknown. */
  last4: string | null
  /**
   * The card's own expiry, as reported by the processor — not typed by a guest.
   * Null where the processor does not return it. A card expiring before
   * arrival is a problem this field exists to let us detect early.
   */
  expiryMonth: number | null
  expiryYear: number | null
}

export type VerificationMethod =
  /** A zero-amount authorisation. Preferred where the issuer supports it. */
  | 'zero-amount-auth'
  /** A small authorisation, voided immediately. */
  | 'low-value-auth-voided'
  /** No verification was performed. */
  | 'none'

export interface CardVerification {
  method: VerificationMethod
  /** ISO instant. */
  verifiedAt: string
  /**
   * When this verification stops meaning anything.
   *
   * The field exists because the answer is "soon", and a guarantee taken months
   * before arrival must not be read as verified on the day. Null where the
   * processor gives no guidance, which must be treated as "unknown", never as
   * "indefinite".
   */
  assuranceExpiresAt: string | null
  /** Whether a 3-D Secure challenge was completed. Null where not applicable. */
  threeDSecure: boolean | null
}

export interface StoredCredentialMandate {
  /** ISO instant the guest accepted. */
  acceptedAt: string
  /**
   * The version of the written terms accepted. Null while NJS has approved no
   * terms — which is today. A mandate with no terms behind it is not a mandate,
   * and the UI says the terms are to be confirmed rather than implying any.
   */
  termsVersion: string | null
  /**
   * The initial transaction identifier a later merchant-initiated charge must
   * reference under card scheme rules. Null where the processor does not return
   * one, which is itself a reason not to rely on the later charge.
   */
  initialNetworkTransactionId: string | null
  /** Unscheduled card-on-file: charged on an event, not a schedule. */
  scope: 'unscheduled-card-on-file'
}

export interface CardGuarantee {
  card: CardReference
  verification: CardVerification
  mandate: StoredCredentialMandate
  /**
   * Always false, and typed as the literal so it cannot quietly become true.
   * No money is held by a guarantee. See the note at the top of this file.
   */
  fundsHeld: false
  /**
   * When the card should be re-verified before arrival, because the
   * booking-time verification will have lapsed. Null where no re-verification
   * schedule has been agreed — which is today, and is a requirement on the
   * eventual processor rather than something this prototype can invent.
   */
  reverifyBefore: string | null
}

// ---------------------------------------------------------------------------
// Requests and outcomes
// ---------------------------------------------------------------------------

export interface PaymentRequest {
  /** Whole naira, matching RateBreakdown.total. */
  amount: number
  currency: Currency
  /** Our own reference for the attempt, for reconciliation. */
  reference: string
  /** One line, shown on the processor's own screens where it supports it. */
  description: string
}

/**
 * A request to take a card guarantee rather than a payment.
 *
 * It carries no amount, because nothing is charged. It carries no card data,
 * because the processor collects that in its own hosted fields.
 */
export interface GuaranteeRequest {
  reference: string
  currency: Currency
  description: string
  /**
   * The arrival date, so a processor can be asked for a verification whose
   * assurance is relevant to it — and so that the gap between booking and
   * arrival is visible at the point where someone might assume an
   * authorisation covers it.
   */
  arrival: string
}

export type PaymentStatus =
  /** Funds authorised or captured; the reservation may be confirmed. */
  | 'authorised'
  /**
   * A card guarantee was taken: tokenised, verified at the time, mandate
   * recorded. NOTHING HAS BEEN CHARGED AND NO FUNDS ARE HELD.
   */
  | 'guaranteed'
  /** The guest abandoned the payment. Not an error. */
  | 'cancelled'
  /** Attempted and refused. */
  | 'failed'
  /** No payment was taken because none is required at this stage. */
  | 'not-required'

export interface PaymentOutcome {
  status: PaymentStatus
  /** Which experience produced this outcome. */
  option: PaymentOption
  /** Our reference for the attempt. */
  reference: string
  /** The processor's identifier, where there is one. */
  providerReference: string | null
  /** Whole naira actually charged. Zero for a guarantee, always. */
  amount: number
  currency: Currency
  /** 'card', 'transfer', and so on. Null where unknown or not applicable. */
  method: string | null
  /** Present only for a guarantee. Null for a payment. */
  guarantee: CardGuarantee | null
  /** ISO instant. */
  at: string
}

// ---------------------------------------------------------------------------
// What a processor would have to support
// ---------------------------------------------------------------------------

/**
 * The capability checklist for an eventual processor.
 *
 * This is the evaluation sheet, expressed as code so it cannot drift from what
 * the journey assumes. Every flag is false for every provider in this
 * repository today, because no processor has been evaluated — a false here
 * means "not demonstrated", never "not needed".
 */
export interface PaymentCapabilities {
  /** Settles to a Nigerian bank account. */
  ngnSettlement: boolean
  /** Can refund through the same API. */
  refunds: boolean
  /** Guarantees one charge per reference. */
  idempotent: boolean
  /** Collects card data in hosted fields or an iframe, so NJS never sees it. */
  hostedCardFields: boolean
  /** Stores a card and returns a reusable token. Required for Pay Later. */
  tokenization: boolean
  /** Issues network tokens that survive a card being reissued. */
  networkTokens: boolean
  /** Updates a stored card automatically when the issuer reissues it. */
  accountUpdater: boolean
  /** Zero-amount or voided low-value authorisation to verify a card. */
  accountVerification: boolean
  /** 3-D Secure, where the issuer requires it. */
  threeDSecure: boolean
  /** Records a stored-credential mandate and returns the initial transaction id. */
  storedCredentialMandates: boolean
  /** Merchant-initiated, unscheduled charges against a stored card. */
  merchantInitiatedCharges: boolean
  /** Re-verifying a stored card closer to arrival. */
  reverification: boolean
  currencies: Currency[]
}

/** Every capability unproven. Providers spread this and switch on what they show. */
export const NO_PAYMENT_CAPABILITIES: PaymentCapabilities = {
  ngnSettlement: false,
  refunds: false,
  idempotent: false,
  hostedCardFields: false,
  tokenization: false,
  networkTokens: false,
  accountUpdater: false,
  accountVerification: false,
  threeDSecure: false,
  storedCredentialMandates: false,
  merchantInitiatedCharges: false,
  reverification: false,
  currencies: [],
}

export interface PaymentProvider {
  readonly id: string
  readonly label: string
  readonly capabilities: PaymentCapabilities
  /**
   * Take a payment. Returns an outcome, including the unsuccessful ones: a
   * declined card is an ordinary result the journey must render.
   */
  pay(request: PaymentRequest): Promise<Result<PaymentOutcome>>
  /** Take a card guarantee. Charges nothing. */
  guarantee(request: GuaranteeRequest): Promise<Result<PaymentOutcome>>
}

/**
 * The default. Refuses everything, because no processor has been chosen.
 *
 * Wired in deliberately rather than left as a null, so that an attempt to take
 * money or hold a card in an environment where nothing was configured fails
 * loudly and harmlessly instead of reaching a half-configured processor.
 */
export const NO_PAYMENT_PROVIDER: PaymentProvider = {
  id: 'none',
  label: 'No payment provider selected',
  capabilities: NO_PAYMENT_CAPABILITIES,
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
  async guarantee() {
    return {
      ok: false,
      error: {
        code: 'PROVIDER_NOT_CONFIGURED',
        message:
          'Card guarantees are not available. Please contact the resort to complete your reservation.',
        retryable: false,
      },
    }
  },
}

/** A payment that was not asked for, for journeys where none is due yet. */
export function noPaymentRequired(reference: string, currency: Currency = 'NGN'): PaymentOutcome {
  return {
    status: 'not-required',
    option: 'pay-now',
    reference,
    providerReference: null,
    amount: 0,
    currency,
    method: null,
    guarantee: null,
    at: new Date().toISOString(),
  }
}
