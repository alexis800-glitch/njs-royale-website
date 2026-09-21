// NJS Royale — The First Escape. Public campaign copy for the First Look guest page
// and the standard invitation proof. VIP (Founding Guest) copy deliberately lives only
// in its own proof route so it never ships with the public registration page.

export const CAMPAIGN = {
  name: 'NJS Royale — The First Escape',
  tagline: 'You Saw It First. Now Come Experience It.',
  pageLabel: 'Exclusive First Look Guest Registration',
} as const

// The only URL the invitation QR code may encode. Never a Preview URL.
export const FIRST_LOOK_CANONICAL_URL = 'https://www.njsbeachresort.com/first-look'
export const FIRST_LOOK_DISPLAY_URL = 'www.njsbeachresort.com/first-look'
export const FIRST_LOOK_QR_SRC = '/first-look/njs-first-look-qr.svg'

export const FIRST_ESCAPE = {
  date: '12 December 2026',
  dateShort: '12 December',
  hours: '11:00 a.m. until midnight',
  doors: 'Doors open at 11:00 a.m.; the experience continues until midnight',
} as const

export const GRAND_OPENING = {
  date: '23 July 2027',
} as const

export const GUEST_PRIVILEGES = [
  'Priority RSVP',
  'A welcome cocktail or champagne',
  'A complimentary tasting experience',
] as const

export const ADMISSION_NOTE =
  'Each invitation admits two people: the invited guest and one companion.'

export const VERIFICATION_NOTE =
  'Registration does not by itself guarantee entry or benefits. Invitations and guest privileges remain subject to invitation verification and RSVP confirmation.'

export const DRAFT_PROOF_LABEL = 'Draft — do not distribute until the page is live.'

// Proof routes are review material only: they 404 on the Production deployment.
// VERCEL_ENV is a system variable Vercel sets on every build; it is unset locally.
export const PROOFS_ENABLED = process.env.VERCEL_ENV !== 'production'
