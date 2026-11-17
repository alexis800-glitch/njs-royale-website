// Synthetic availability for the prototype.
//
// Rates here are the resort's own published opening rates, taken straight from
// lib/accommodation.ts. Availability is invented. Nothing else is: where the
// resort has not confirmed a fact — occupancy per room, the tax and service
// position, the cancellation policy — this file returns null and the journey
// renders "to be confirmed" rather than a plausible-looking number.
//
// That is a deliberate choice. A prototype that quietly fills in ₦ taxes and a
// 24-hour cancellation policy would be the most convincing part of the demo and
// the least true, and somebody would quote it back to a guest. The nulls are
// the deliverable: each one is an item on the list of details still needed.
//
// Availability is derived, not random: the same query always returns the same
// answer, so a tester can reproduce a sold-out category and a test can assert
// on it. It varies by category and by arrival date so that the journey's
// empty-state and partial-availability paths are both reachable.

import { accommodation, type AccommodationCategory } from '../../accommodation.ts'
import { nightsBetween, type IsoDate } from '../dates.ts'
import type { RateBreakdown, RoomOffer, StayQuery } from '../types.ts'

/**
 * FNV-1a, 32-bit. A stable string hash, so availability is a pure function of
 * the query rather than of when the test ran.
 */
function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Synthetic rooms available for a category on an arrival date: 0 to 5.
 *
 * Roughly one category in six reads as sold out, which is what makes the
 * no-availability state reachable in a demo without anyone editing code.
 */
export function syntheticRoomsAvailable(categoryId: string, arrival: IsoDate): number {
  return hash(`${categoryId}:${arrival}`) % 6
}

/** The breakdown for a category at a given stay length and room count. */
export function buildRate(
  nightlyRate: number,
  nights: number,
  rooms: number,
): RateBreakdown {
  const roomSubtotal = nightlyRate * nights * rooms
  return {
    nights,
    rooms,
    nightlyRate,
    roomSubtotal,
    // Null, not zero: the tax and service position is not confirmed, and zero
    // would read as a claim that there is nothing to add.
    taxesAndFees: null,
    total: roomSubtotal,
    currency: 'NGN',
  }
}

function toOffer(category: AccommodationCategory, query: StayQuery): RoomOffer {
  const nights = nightsBetween(query.arrival, query.departure)
  return {
    categoryId: category.id,
    name: category.name,
    category: category.category,
    view: category.view,
    tier: category.tier,
    nightlyRate: category.openingRate,
    roomsAvailable: syntheticRoomsAvailable(category.id, query.arrival),
    // The catalogue carries null occupancy for every category, and this
    // prototype does not invent one. partyFits() therefore admits any party
    // size, and the journey says occupancy is to be confirmed.
    maxOccupancyPerRoom: null,
    rate: buildRate(category.openingRate, nights, query.rooms),
    cancellationPolicy: null,
  }
}

/**
 * Every category that can take the requested number of rooms, cheapest first.
 *
 * A category with fewer rooms available than requested is left out rather than
 * shown as unbookable: a guest asking for three rooms is not helped by a list
 * of rooms they cannot have.
 */
export function syntheticOffers(query: StayQuery): RoomOffer[] {
  return accommodation
    .map((category) => toOffer(category, query))
    .filter((offer) => offer.roomsAvailable >= query.rooms)
    .sort((a, b) => a.nightlyRate - b.nightlyRate)
}

/** Every category, including sold-out ones, for the prototype's debug panel. */
export function syntheticOffersIncludingSoldOut(query: StayQuery): RoomOffer[] {
  return accommodation
    .map((category) => toOffer(category, query))
    .sort((a, b) => a.nightlyRate - b.nightlyRate)
}
