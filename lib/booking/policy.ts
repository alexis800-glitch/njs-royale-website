// Reservation policy — every field unconfirmed, on purpose.
//
// A card guarantee is only meaningful alongside the terms it guarantees: by
// when a guest may cancel without charge, what a no-show costs, and whether a
// deposit is required at all. NJS has approved none of those, and Aiosell's
// commercial terms are still being discussed, so this file holds the shape of
// the policy with nulls where the numbers will go.
//
// Nulls rather than defaults, and nulls rather than placeholders. A prototype
// showing "free cancellation until 48 hours before arrival" would be the most
// quotable sentence in the demo and entirely invented; a guest who read it
// would have been told something NJS never agreed. The UI renders every null
// as "to be confirmed" and the tests assert that nothing here is filled in.

import type { Currency } from './types.ts'

/** Whether the guest pays everything now, or a deposit. Not decided. */
export type PayNowBasis = 'full-stay' | 'deposit' | 'first-night'

export interface Money {
  amount: number
  currency: Currency
}

export interface ReservationPolicy {
  /**
   * The last moment a guest may cancel without charge, expressed as hours
   * before arrival. Null until NJS approves a cancellation policy.
   */
  freeCancellationHoursBeforeArrival: number | null
  /** What a no-show is charged. Null until NJS approves it. */
  noShowCharge: Money | null
  /** What must be paid at the time of booking under Pay Now. Null: undecided. */
  payNowBasis: PayNowBasis | null
  /** A deposit, where one is required. Null: not decided that one is. */
  deposit: Money | null
  /**
   * The version of the written terms a guest accepts when they give a card
   * guarantee. Null until terms exist to version.
   */
  termsVersion: string | null
}

/**
 * The policy as it actually stands: nothing confirmed.
 *
 * Exported as a constant rather than built inline so that the day NJS approves
 * terms, one object changes and every surface follows.
 */
export const UNCONFIRMED_POLICY: ReservationPolicy = {
  freeCancellationHoursBeforeArrival: null,
  noShowCharge: null,
  payNowBasis: null,
  deposit: null,
  termsVersion: null,
}

/** True when every term is still unconfirmed, which is the state today. */
export function isPolicyUnconfirmed(policy: ReservationPolicy): boolean {
  return (
    policy.freeCancellationHoursBeforeArrival === null &&
    policy.noShowCharge === null &&
    policy.payNowBasis === null &&
    policy.deposit === null &&
    policy.termsVersion === null
  )
}

/**
 * What a guest may be told about cancellation today.
 *
 * One sentence, and it is the truth: we do not yet know. Returning a string
 * from here rather than writing copy in a component keeps every surface saying
 * the same thing, and makes the day it changes a one-line change.
 */
export function cancellationSummary(policy: ReservationPolicy): string {
  if (policy.freeCancellationHoursBeforeArrival === null)
    return 'Cancellation terms are to be confirmed by the resort.'
  return `Free cancellation until ${policy.freeCancellationHoursBeforeArrival} hours before arrival.`
}

export function noShowSummary(policy: ReservationPolicy): string {
  if (policy.noShowCharge === null)
    return 'No-show charges are to be confirmed by the resort.'
  return `A no-show is charged ${policy.noShowCharge.amount} ${policy.noShowCharge.currency}.`
}

export function payNowSummary(policy: ReservationPolicy): string {
  if (policy.payNowBasis === null)
    return 'Whether the full stay or a deposit is payable at booking is to be confirmed by the resort.'
  if (policy.payNowBasis === 'deposit' && policy.deposit)
    return `A deposit of ${policy.deposit.amount} ${policy.deposit.currency} is payable at booking.`
  if (policy.payNowBasis === 'first-night') return 'The first night is payable at booking.'
  return 'The full stay is payable at booking.'
}
