// NJS Royale Beach Resort — accommodation catalogue (data-driven).
//
// These are accommodation CATEGORIES, not individual rooms. The full resort will
// contain 262 keys at Grand Opening (July 2027).
//
// IMPORTANT: only fields confirmed by the client are populated. Everything not yet
// supplied is intentionally `null` (or an empty array) so the UI can hide it or show
// a tasteful "coming soon" state. Do NOT fabricate sizes, occupancy, bed types,
// bathrooms, floor/phase allocations, etc. Replacing a placeholder image later is a
// one-line change to `mainImage`.

export const RESORT_KEYS = 262
export const GRAND_OPENING = 'July 2027'

export type AvailabilityStatus =
  | 'enquire' // enquiries welcome; not yet bookable online
  | 'opening-soon'
  | null

export interface Accommodation {
  id: string
  name: string
  category: string
  view: string | null
  /** Opening rate in NGN (whole naira), per night. */
  openingRate: number
  mainImage: string | null
  galleryImages: string[]
  roomSize: string | null // e.g. "48 m²" — supply later
  bathroomSize: string | null
  bathroomType: string | null
  bedrooms: number | null
  bedType: string | null
  occupancy: string | null
  balconyOrTerrace: string | null
  livingArea: string | null
  diningArea: string | null
  kitchenOrKitchenette: string | null
  guestWC: string | null
  specialFeatures: string[]
  includedBenefits: string[]
  openingPhase: string | null // not assigned per-category yet — leave null
  availabilityStatus: AvailabilityStatus
}

// Tiers let the UI give larger residences more layout room later without
// forcing the standard-room format. Purely presentational grouping.
export type Tier = 'room' | 'multi-bedroom' | 'suite' | 'signature'

export interface AccommodationCategory extends Accommodation {
  tier: Tier
}

const base = {
  view: null,
  mainImage: null, // branded placeholder is shown until official photography is supplied
  galleryImages: [] as string[],
  roomSize: null,
  bathroomSize: null,
  bathroomType: null,
  bedrooms: null,
  bedType: null,
  occupancy: null,
  balconyOrTerrace: null,
  livingArea: null,
  diningArea: null,
  kitchenOrKitchenette: null,
  guestWC: null,
  specialFeatures: [] as string[],
  includedBenefits: [] as string[],
  openingPhase: null,
  availabilityStatus: 'enquire' as AvailabilityStatus,
}

// Confirmed opening-phase wording (client-supplied floor rollout). Centralised so
// phase copy can be updated in one place. No invented Phase III date.
export const PHASE_II = 'Phase II · From February 2027' // lower accommodation floors (1st & 2nd)
export const RAMP_UP = 'Resort Ramp-Up · Ahead of July 2027 Grand Opening' // later floors, no confirmed month

export const accommodation: AccommodationCategory[] = [
  { ...base, id: 'royale-room-resort-side', tier: 'room', category: 'Royale Room', name: 'Royale Room — Standard', view: 'Resort Side', openingRate: 250000, openingPhase: PHASE_II },
  { ...base, id: 'royale-room-pool-terrace', tier: 'room', category: 'Royale Room', name: 'Royale Room — Pool Terrace View', view: 'Pool Terrace View', openingRate: 275000, openingPhase: PHASE_II },
  { ...base, id: 'royale-room-coastal', tier: 'room', category: 'Royale Room', name: 'Royale Room — Coastal View', view: 'Coastal View', openingRate: 300000, openingPhase: PHASE_II },
  { ...base, id: 'royale-room-ocean', tier: 'room', category: 'Royale Room', name: 'Royale Room — Ocean View', view: 'Ocean View', openingRate: 325000, openingPhase: RAMP_UP },
  { ...base, id: 'royale-two-bedroom-coastal', tier: 'multi-bedroom', category: 'Royale Two-Bedroom', name: 'Royale Two-Bedroom — Coastal View', view: 'Coastal View', openingRate: 450000, openingPhase: RAMP_UP },
  { ...base, id: 'royale-two-bedroom-ocean', tier: 'multi-bedroom', category: 'Royale Two-Bedroom', name: 'Royale Two-Bedroom — Ocean View', view: 'Ocean View', openingRate: 500000, openingPhase: RAMP_UP },
  { ...base, id: 'royale-suite-coastal', tier: 'suite', category: 'Royale Suite', name: 'Royale Suite — Coastal View', view: 'Coastal View', openingRate: 500000, openingPhase: RAMP_UP },
  { ...base, id: 'royale-suite-ocean', tier: 'suite', category: 'Royale Suite', name: 'Royale Suite — Ocean View', view: 'Ocean View', openingRate: 575000, openingPhase: RAMP_UP },
  { ...base, id: 'executive-suite-ocean', tier: 'suite', category: 'Executive Suite', name: 'Executive Suite — Ocean View', view: 'Ocean View', openingRate: 750000, openingPhase: RAMP_UP },
  { ...base, id: 'grand-suite', tier: 'signature', category: 'Grand Suite', name: 'Grand Suite', view: null, openingRate: 1250000, openingPhase: RAMP_UP },
  { ...base, id: 'presidential-suite-ocean', tier: 'signature', category: 'Presidential Suite', name: 'Presidential Suite — Ocean View', view: 'Ocean View', openingRate: 2000000, openingPhase: RAMP_UP },
]

/** Format a whole-naira amount, e.g. 250000 -> "₦250,000". */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-US')}`
}

/** True when the category has at least one confirmed specification to display. */
export function hasSpecs(a: AccommodationCategory): boolean {
  return Boolean(
    a.roomSize ||
      a.bathroomSize ||
      a.bathroomType ||
      a.bedrooms ||
      a.bedType ||
      a.occupancy ||
      a.balconyOrTerrace ||
      a.livingArea ||
      a.diningArea ||
      a.kitchenOrKitchenette ||
      a.guestWC ||
      a.specialFeatures.length ||
      a.includedBenefits.length,
  )
}
