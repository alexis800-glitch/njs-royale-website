// NJS Royale — The First Escape. Public campaign copy for the First Look guest page
// and the standard invitation proof. Founding Guest (VIP) copy lives in
// lib/foundingGuest.ts and is never imported by the /first-look page.

export const CAMPAIGN = {
  name: 'NJS Royale — The First Escape',
  tagline: 'You Saw It First. Now Watch the Journey Unfold.',
  pageLabel: 'Exclusive First Look Guest Registration',
} as const

// The only URL the invitation QR code may encode. Never a Preview URL.
export const FIRST_LOOK_CANONICAL_URL = 'https://www.njsbeachresort.com/first-look'
export const FIRST_LOOK_DISPLAY_URL = 'www.njsbeachresort.com/first-look'
export const FIRST_LOOK_QR_SRC = '/first-look/njs-first-look-qr.svg'

// The three-stage campaign journey shared by both invitations and both pages.
export type JourneyStage = 'first-look' | 'phase-one' | 'grand-opening'
export const JOURNEY: { id: JourneyStage; label: string; date: string; dateLong: string }[] = [
  { id: 'first-look', label: 'First Look', date: '23 Oct 2026', dateLong: '23 October 2026' },
  { id: 'phase-one', label: 'Phase I', date: '12 Dec 2026', dateLong: '12 December 2026' },
  { id: 'grand-opening', label: 'Grand Opening', date: '23 Jul 2027', dateLong: '23 July 2027' },
]

export const FIRST_ESCAPE = {
  label: 'Phase I Opening',
  date: '12 December 2026',
  dateShort: '12 December',
  hours: '11:00 a.m. until midnight',
  intro:
    'Return to experience NJS Royale in a whole new way as we officially open our Phase I Daycation experience.',
  doors: 'Doors open at 11:00 a.m., and the experience continues until midnight.',
} as const

export const GRAND_OPENING = {
  date: '23 July 2027',
} as const

export const PRIVILEGES_HEADING = 'Our Founding First Look Privileges'
export const GUEST_PRIVILEGES = [
  'Priority RSVP for two',
  'Signature NJS Royale welcome cocktail or champagne',
  'Complimentary curated tasting experience',
  'Priority access to the Phase I Opening Experience',
] as const

export const INVITATION_VALIDITY = 'Valid for invitee + one guest'

export const ADMISSION_NOTE =
  'Each invitation admits two people: the invited guest and one companion.'

export const VERIFICATION_NOTE =
  'Registration does not by itself guarantee entry or benefits. Invitations and guest privileges remain subject to invitation verification and RSVP confirmation.'

export const DRAFT_PROOF_LABEL = 'DRAFT FOR REVIEW — NOT FOR DISTRIBUTION'

// Proof routes are review material only: they 404 on the Production deployment.
// VERCEL_ENV is a system variable Vercel sets on every build; it is unset locally.
export const PROOFS_ENABLED = process.env.VERCEL_ENV !== 'production'
