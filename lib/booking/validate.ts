// Reservation validation.
//
// This is the authority. The booking journey validates as the guest types, for
// a responsive experience, but it calls these same functions to do it, so a
// field rejected in the browser reads exactly as it would be rejected on a
// server. When a booking route is eventually added it calls these too and
// trusts nothing from the client — the same arrangement the registration forms
// already use (lib/registrations/validate.ts).
//
// Two date rules are enforced here and are not negotiable in the UI:
//
//   * arrival >= EARLIEST_ARRIVAL (23 July 2027). Guest-room operations do not
//     commence before it, so there is nothing to sell.
//   * departure > arrival. A stay is at least one night.
//
// The first is checked here rather than relying on the date input's `min`
// attribute, because `min` is a hint a browser may ignore and anyone can edit.

import { normaliseEmail, normalisePhone, sanitiseMultiline, sanitiseText } from '../registrations/normalise.ts'
import { EARLIEST_ARRIVAL, LIMITS } from './config.ts'
import { compareIso, formatLongDate, isIsoDate, nightsBetween, type IsoDate } from './dates.ts'
import type { GuestDetails, StayQuery } from './types.ts'

export type FieldErrors = Record<string, string>

export type Validated<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors }

const LENGTHS = { name: 120, email: 254, phone: 32, requests: 1000 }

/** A whole number within [min, max]. Rejects NaN, Infinity and fractions. */
function isCount(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

// ---------------------------------------------------------------------------
// The stay
// ---------------------------------------------------------------------------

export function validateStayQuery(input: Partial<StayQuery>): Validated<StayQuery> {
  const errors: FieldErrors = {}

  const arrival = input.arrival
  const departure = input.departure

  if (!arrival) errors.arrival = 'Choose your arrival date.'
  else if (!isIsoDate(arrival)) errors.arrival = 'Choose a valid arrival date.'
  else if (compareIso(arrival, EARLIEST_ARRIVAL) < 0)
    errors.arrival = `Guest rooms open on ${formatLongDate(EARLIEST_ARRIVAL)}. Choose an arrival on or after that date.`

  if (!departure) errors.departure = 'Choose your departure date.'
  else if (!isIsoDate(departure)) errors.departure = 'Choose a valid departure date.'

  // Only compare the two once both are real dates, or the message is noise.
  if (!errors.arrival && !errors.departure && isIsoDate(arrival) && isIsoDate(departure)) {
    const nights = nightsBetween(arrival, departure)
    if (nights === 0) errors.departure = 'Your departure must be at least one night after your arrival.'
    else if (nights > LIMITS.maxNights)
      errors.departure = `We can hold up to ${LIMITS.maxNights} nights online. Please contact the resort for a longer stay.`
  }

  if (!isCount(input.adults, 1, LIMITS.maxAdults))
    errors.adults = `Choose between 1 and ${LIMITS.maxAdults} adults.`
  if (!isCount(input.children, 0, LIMITS.maxChildren))
    errors.children = `Choose up to ${LIMITS.maxChildren} children.`
  if (!isCount(input.rooms, 1, LIMITS.maxRooms))
    errors.rooms = `Choose between 1 and ${LIMITS.maxRooms} rooms.`

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      arrival: arrival as IsoDate,
      departure: departure as IsoDate,
      adults: input.adults as number,
      children: input.children as number,
      rooms: input.rooms as number,
    },
  }
}

// ---------------------------------------------------------------------------
// The guest
// ---------------------------------------------------------------------------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The raw shape the guest form submits, before validation.
 *
 * Every field is `unknown` because this is the untrusted side of the boundary:
 * the same function validates a React form's strings and a JSON body's
 * anything, and sanitiseText/normaliseEmail are what turn either into a value.
 * Naming the keys keeps it honest about which fields it reads, which a bare
 * Record<string, unknown> would not.
 */
export interface GuestDetailsInput {
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  phone?: unknown
  specialRequests?: unknown
}

export function validateGuestDetails(input: GuestDetailsInput): Validated<GuestDetails> {
  const errors: FieldErrors = {}

  const firstName = sanitiseText(input.firstName, LENGTHS.name)
  if (!firstName) errors.firstName = 'Enter your first name.'

  const lastName = sanitiseText(input.lastName, LENGTHS.name)
  if (!lastName) errors.lastName = 'Enter your last name.'

  const email = normaliseEmail(input.email).slice(0, LENGTHS.email)
  if (!email) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email))
    errors.email = 'Enter an email address in the format name@example.com.'

  const phoneDisplay = sanitiseText(input.phone, LENGTHS.phone)
  const phone = normalisePhone(phoneDisplay)
  if (!phoneDisplay) errors.phone = 'Enter your mobile or WhatsApp number.'
  else if (phone.length < 7 || phone.length > 15 || /[^\d\s()+-]/.test(phoneDisplay))
    errors.phone =
      'Enter a valid mobile or WhatsApp number, including the country code if outside Nigeria.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      email,
      phone,
      phoneDisplay,
      specialRequests: sanitiseMultiline(input.specialRequests, LENGTHS.requests) || null,
    },
  }
}

/**
 * Whether a party fits a category, where the category states an occupancy.
 *
 * Returns true when `maxOccupancyPerRoom` is null, because the resort has not
 * confirmed occupancy for any category yet. Refusing a booking on an
 * unconfirmed limit would be inventing resort policy; the limit is enforced the
 * moment the real number arrives, and until then this returns true and the UI
 * says occupancy is to be confirmed.
 */
export function partyFits(
  query: Pick<StayQuery, 'adults' | 'children' | 'rooms'>,
  maxOccupancyPerRoom: number | null,
): boolean {
  if (maxOccupancyPerRoom === null) return true
  return query.adults + query.children <= maxOccupancyPerRoom * query.rooms
}
