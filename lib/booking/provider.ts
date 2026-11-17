// The booking-provider interface.
//
// One adapter is swapped for another by changing BOOKING_PROVIDER. Nothing in
// components/booking imports an adapter directly; it takes a BookingProvider
// and calls it. That is the whole point of this file: when Aiosell's
// documentation arrives, the work is writing one adapter against this
// interface, not revisiting the guest-facing journey.
//
// The six operations are the reservation lifecycle as the guest experiences it:
//
//   search   what is available, and at what price
//   quote    hold that price for a specific selection
//   hold     create a draft against the provider, before payment
//   confirm  turn the draft into a reservation
//   lookup   retrieve a reservation by its reference
//   cancel   release it
//
// `capabilities` exists because an adapter may not support all six. Aiosell's
// support for `hold` and `modify` in particular is unconfirmed, and the UI must
// be able to ask rather than assume: a journey that offers to hold a room
// against a provider that cannot hold one is a promise we would break.

import type {
  BookingDraft,
  CancellationResult,
  Confirmation,
  Currency,
  GuestDetails,
  Quote,
  Result,
  RoomOffer,
  Selection,
  StayQuery,
} from './types.ts'
import type { PaymentOutcome } from './payment.ts'

export interface ProviderCapabilities {
  search: boolean
  quote: boolean
  /** Can the provider hold inventory before payment? */
  hold: boolean
  confirm: boolean
  lookup: boolean
  cancel: boolean
  /** Can an existing reservation's dates or room be changed in place? */
  modify: boolean
  /** More than one room in a single reservation. */
  multiRoom: boolean
  currencies: Currency[]
}

export interface BookingProvider {
  readonly id: string
  /** Shown only in the prototype banner, never to a guest. */
  readonly label: string
  readonly capabilities: ProviderCapabilities

  search(query: StayQuery): Promise<Result<RoomOffer[]>>
  quote(selection: Selection): Promise<Result<Quote>>
  hold(quote: Quote, guest: GuestDetails): Promise<Result<BookingDraft>>
  confirm(draft: BookingDraft, payment: PaymentOutcome): Promise<Result<Confirmation>>
  lookup(reference: string): Promise<Result<Confirmation>>
  cancel(reference: string): Promise<Result<CancellationResult>>
}

/**
 * Capabilities with everything off. An adapter spreads this and switches on
 * only what it can actually do, so a newly added capability defaults to
 * unsupported rather than silently claiming support.
 */
export const NO_CAPABILITIES: ProviderCapabilities = {
  search: false,
  quote: false,
  hold: false,
  confirm: false,
  lookup: false,
  cancel: false,
  modify: false,
  multiRoom: false,
  currencies: [],
}
