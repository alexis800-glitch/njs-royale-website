// The gates.
//
// Three independent switches stand between this prototype and a real
// reservation. Each one is here, in one file, so that enabling bookings is a
// deliberate, reviewable change rather than a side effect of something else.
//
// All three default to the safe position. BOOKING_ENABLED is the master switch
// and is derived from the environment rather than from a variable someone can
// set by mistake: on Vercel's production target the feature is off, full stop,
// and no environment variable can turn it on. The same mechanism already keeps
// the invitation proof routes off production (see PROOFS_ENABLED in
// lib/firstLook.ts), so this is the house pattern rather than a new one.

import { compareIso, todayIso, type IsoDate } from './dates.ts'

/**
 * Master switch. False on the production deployment, always.
 *
 * VERCEL_ENV is a system variable Vercel sets on every build ('production',
 * 'preview' or 'development'); it is unset locally, so local development and
 * preview deployments get the prototype and the public website does not.
 *
 * Deliberately not `process.env.BOOKING_ENABLED === 'true'`: a feature that can
 * accept money must not be one typo in a dashboard away from being live.
 */
export const BOOKING_ENABLED = process.env.VERCEL_ENV !== 'production'

/**
 * The first date a guest may arrive. Guest-room operations commence on
 * 23 July 2027; there is no room to sell before it.
 */
export const EARLIEST_ARRIVAL: IsoDate = '2027-07-23'

/**
 * The first date advance room reservations are intended to be accepted, which
 * is when Phase One opens. Distinct from EARLIEST_ARRIVAL: this one is about
 * when the booking window opens, that one about when a stay may start.
 */
export const RESERVATIONS_OPEN_FROM: IsoDate = '2026-12-19'

/**
 * Which adapter to use. Only 'mock' is implemented. 'aiosell' resolves to a
 * stub that refuses every call until Aiosell's documentation arrives.
 */
export type ProviderId = 'mock' | 'aiosell'

export const BOOKING_PROVIDER: ProviderId =
  process.env.BOOKING_PROVIDER === 'aiosell' ? 'aiosell' : 'mock'

/**
 * Journey limits. These are interface limits, not resort policy: the resort has
 * not confirmed occupancy per category, so these bound the form rather than
 * describe what the resort will sell. See mock/inventory.ts.
 */
export const LIMITS = {
  maxRooms: 3,
  maxAdults: 8,
  maxChildren: 6,
  /** Longest stay the form will submit, in nights. */
  maxNights: 21,
} as const

export type BookingWindow = 'not-open-yet' | 'open'

/**
 * Whether advance reservations have opened, as of `today`.
 *
 * The clock is an argument so this is testable and so a server render and a
 * client render can be given the same date rather than disagreeing across
 * midnight.
 */
export function bookingWindow(today: IsoDate = todayIso()): BookingWindow {
  return compareIso(today, RESERVATIONS_OPEN_FROM) < 0 ? 'not-open-yet' : 'open'
}

/**
 * The earliest date the arrival field should offer.
 *
 * Max of EARLIEST_ARRIVAL and today, so the field can never offer a date in the
 * past once 23 July 2027 has passed.
 */
export function earliestSelectableArrival(today: IsoDate = todayIso()): IsoDate {
  return compareIso(today, EARLIEST_ARRIVAL) > 0 ? today : EARLIEST_ARRIVAL
}

/**
 * What this prototype is and is not, in one place, for the banner the preview
 * shows. Written for a colleague testing the journey, not for a guest.
 */
export const PROTOTYPE_NOTICE = {
  heading: 'Prototype — not a live booking system',
  points: [
    'Rooms, availability and rates are synthetic. No reservation is created.',
    'No payment is taken, and no payment processor is connected.',
    'Guest details are held in this browser tab only and are never sent anywhere.',
    'Disabled on the public website: this journey exists on preview builds only.',
  ],
} as const
