// The booking data contracts.
//
// This file is the boundary. Everything above it — the guest-facing journey in
// components/booking — depends only on these shapes, and everything below it —
// the mock adapter today, an Aiosell adapter later — depends only on these
// shapes too. Neither side imports the other. That is what makes the provider
// replaceable without redesigning the UI.
//
// Three rules hold throughout:
//
//  1. Dates are ISO calendar strings ('YYYY-MM-DD'), never Date objects. See
//     dates.ts for why.
//  2. Money is a whole number of naira, matching lib/accommodation.ts and
//     formatNaira. No minor units, no floats: NGN prices here are whole naira
//     and fractional kobo would only invite rounding drift.
//  3. Expected failure is a value, not an exception. Every provider call
//     returns Result<T>, so "no availability" and "payment declined" are
//     ordinary outcomes the UI must render, not errors that bubble up and blank
//     the page. Exceptions stay for genuine faults.

import type { Tier } from '../accommodation.ts'
import type { IsoDate } from './dates.ts'

export type { IsoDate }

/** ISO 4217. Only NGN is in use; the field exists so a quote is self-describing. */
export type Currency = 'NGN'

// ---------------------------------------------------------------------------
// What the guest asks for
// ---------------------------------------------------------------------------

export interface StayQuery {
  arrival: IsoDate
  departure: IsoDate
  adults: number
  children: number
  /** Number of rooms of the chosen category. */
  rooms: number
}

// ---------------------------------------------------------------------------
// What a provider offers back
// ---------------------------------------------------------------------------

export interface RateBreakdown {
  nights: number
  rooms: number
  /** Whole naira, per room per night. */
  nightlyRate: number
  /** nightlyRate x nights x rooms. */
  roomSubtotal: number
  /**
   * Whole naira. Null — not zero — when the tax and service position has not
   * been confirmed. Zero would read as "nothing to add", which is a claim we
   * cannot make; null lets the UI say the total is exclusive of taxes.
   */
  taxesAndFees: number | null
  /**
   * roomSubtotal + (taxesAndFees ?? 0).
   *
   * NOT necessarily the final payable amount. While `taxesAndFees` is null the
   * resort has not confirmed the tax and service position, so this equals the
   * room subtotal and must be LABELLED as a room subtotal — never as a total,
   * a total payable, or an amount due. Use isFinalTotal() to decide the label
   * rather than reading this field's name.
   */
  total: number
  currency: Currency
}

export interface RoomOffer {
  categoryId: string
  /** Display name from the catalogue, e.g. 'Royale Room, Ocean View'. */
  name: string
  category: string
  view: string | null
  tier: Tier
  nightlyRate: number
  /** How many rooms of this category the provider says are sellable. */
  roomsAvailable: number
  /**
   * Null where the resort has not confirmed occupancy for the category. The
   * catalogue carries null for every category today, so the UI must not imply
   * a limit it has not been given.
   */
  maxOccupancyPerRoom: number | null
  rate: RateBreakdown
  /** Null until the cancellation position is confirmed. */
  cancellationPolicy: string | null
}

export interface Selection {
  categoryId: string
  query: StayQuery
}

export interface Quote {
  /** Opaque to the UI. A provider may encode its own session in here. */
  quoteRef: string
  /** What was quoted for. A quote without its query is not reusable. */
  selection: Selection
  offer: RoomOffer
  rate: RateBreakdown
  /**
   * ISO instant after which the provider may reprice. Null where the provider
   * does not hold a price. Aiosell's behaviour here is unconfirmed.
   */
  expiresAt: string | null
}

// ---------------------------------------------------------------------------
// Who the guest is
// ---------------------------------------------------------------------------

export interface GuestDetails {
  firstName: string
  lastName: string
  /** Normalised: trimmed and lowercased, as lib/registrations/normalise.ts does. */
  email: string
  /** Digits including country code. */
  phone: string
  /** Exactly as the guest typed it, for calling them back. */
  phoneDisplay: string
  /** Free text, optional. Never used for anything operational. */
  specialRequests: string | null
}

export interface BookingDraft {
  draftRef: string
  selection: Selection
  quote: Quote
  guest: GuestDetails
  /** ISO instant. */
  createdAt: string
  /**
   * Whether the provider is actually holding the inventory for this draft, or
   * has merely acknowledged the intent. Aiosell's behaviour is unconfirmed, so
   * the UI must never promise a hold it cannot prove.
   */
  inventoryHeld: boolean
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Confirmation {
  /** The reference a guest quotes to the resort. */
  reference: string
  status: BookingStatus
  selection: Selection
  rate: RateBreakdown
  guest: GuestDetails
  /** ISO instant. */
  confirmedAt: string
  /**
   * The provider's own identifier for the reservation, where it returns one.
   * Null is meaningful: the July 2026 Aiosell sandbox push returned HTTP 200
   * with no booking id, so a null here is a real state to handle and not an
   * oversight.
   */
  providerReference: string | null
}

export interface CancellationResult {
  reference: string
  status: 'cancelled'
  cancelledAt: string
  /** Null where the refund position is not known. */
  refund: { amount: number; currency: Currency } | null
}

// ---------------------------------------------------------------------------
// Failure, as a value
// ---------------------------------------------------------------------------

export type BookingErrorCode =
  /** The feature is switched off for this environment. */
  | 'BOOKING_DISABLED'
  /** No provider is configured, or the configured one has no credentials. */
  | 'PROVIDER_NOT_CONFIGURED'
  /** The guest's query is not usable; `fields` says which parts. */
  | 'INVALID_QUERY'
  /** Arrival before guest-room operations begin. */
  | 'ARRIVAL_TOO_EARLY'
  /** Advance reservations have not opened yet. */
  | 'RESERVATIONS_NOT_OPEN'
  /** Nothing sellable for that query. */
  | 'NO_AVAILABILITY'
  /** The quote was repriced or withdrawn before the guest confirmed. */
  | 'QUOTE_EXPIRED'
  /** More guests than the category admits. */
  | 'OCCUPANCY_EXCEEDED'
  /** Payment is required before the reservation can be confirmed. */
  | 'PAYMENT_REQUIRED'
  /** Payment was attempted and did not succeed. */
  | 'PAYMENT_FAILED'
  /** The provider was reachable but refused, or was unreachable. */
  | 'PROVIDER_UNAVAILABLE'
  /** The same confirmation was submitted twice. */
  | 'DUPLICATE_SUBMISSION'
  /** The operation exists in this interface but not yet in the adapter. */
  | 'NOT_IMPLEMENTED'

export interface BookingError {
  code: BookingErrorCode
  /** One sentence, written for a guest to read. */
  message: string
  /** Field-level messages, keyed by StayQuery or GuestDetails field name. */
  fields?: Record<string, string>
  /**
   * True when trying again unchanged might succeed — a timeout, say, rather
   * than a rejected query. The UI shows a retry affordance only for these.
   */
  retryable?: boolean
}

/**
 * Whether `rate.total` is the final payable amount.
 *
 * False while the tax and service position is unconfirmed, which is the state
 * of every category today. The UI labels the figure accordingly: a room
 * subtotal is an honest partial price; a "total" that silently excludes taxes
 * is a quoted price the resort would have to dishonour.
 */
export function isFinalTotal(rate: RateBreakdown): boolean {
  return rate.taxesAndFees !== null
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: BookingError }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })

export const fail = <T = never>(
  code: BookingErrorCode,
  message: string,
  extra?: Omit<BookingError, 'code' | 'message'>,
): Result<T> => ({ ok: false, error: { code, message, ...extra } })
