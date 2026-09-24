// NJS Royale Founding Guest — VIP invitation copy, shared by the Founding Guest
// proof and the /founding-guest registration page. Never import this from the
// /first-look page: Founding Guest benefits are not shown to ordinary guests.

export const FOUNDING_GUEST = {
  kicker: 'By Personal Invitation',
  title: 'NJS Royale Founding Guest',
  registeredNote: 'Your invitation is individually registered upon activation.',
  categoryNote: 'Accommodation category assigned by NJS Royale.',
} as const

// The only URL the Founding Guest QR code may encode. Never a Preview URL.
export const FOUNDING_GUEST_CANONICAL_URL = 'https://www.njsbeachresort.com/founding-guest'
export const FOUNDING_GUEST_DISPLAY_URL = 'www.njsbeachresort.com/founding-guest'
export const FOUNDING_GUEST_QR_SRC = '/founding-guest/njs-founding-guest-qr.svg'

// Invitation copy and the stay, as confirmed by Mrs Shuler. Breakfast is confirmed
// for the morning after the Grand Opening only.
//
// CORRECTED 24 September 2026: this sentence described 23 July 2027 as the
// unveiling of the "complete NJS Royale Beach Resort". That understated Phase One,
// which opens the resort itself on 12 December 2026 (see lib/opening.ts); 23 July
// 2027 opens the guest rooms and accommodation.
//
// ⚠ THE PRINTED FOUNDING GUEST INVITATION STILL CARRIES THE OLD WORDING. The same
// correction must be made to the physical card before it goes to final printing,
// or the card and this website will contradict each other.
export const FOUNDING_GUEST_INVITATION =
  'You were among the distinguished guests who witnessed NJS Royale before its doors fully opened. It would be our honour to welcome you back for the opening of NJS Royale’s guest rooms and accommodation on 23 July 2027.'

export const STAY_BENEFIT = {
  heading: 'Complimentary Two-Night Stay for Two',
  dates: '23–25 July 2027',
  includes: 'Includes the NJS Grand Opening celebration and breakfast the following morning.',
} as const

export const REGISTRATION_DEADLINE = '31 May 2027'
export const REGISTRATION_DEADLINE_SENTENCE = 'Registration must be completed by 31 May 2027.'

// Complete conditions — shown in full on /founding-guest.
export const CONDITIONS = [
  'Registration must be completed by 31 May 2027.',
  'Subject to confirmed registration and RSVP.',
  'Government-issued identification is required at check-in.',
  'Transportation and airfare are not included.',
  'Incidentals and additional expenses are the guests’ responsibility.',
  'The invitation and accommodation benefit are non-transferable and not redeemable for cash.',
  'Failure to check in on 23 July 2027 without advance notice will be treated as a no-show; the accommodation reservation will be released and the complimentary stay forfeited.',
] as const

// Two-sided printed invitation. The front invites; the back activates.
export const TURN_OVER = 'Turn over to activate your invitation and review the conditions.'

export const ACTIVATION_HEADING = 'Activate Your Founding Guest Invitation'

// Concise conditions printed on the invitation back (the deadline is shown
// separately above them).
export const CONDITIONS_CARD = [
  'Subject to confirmed registration and RSVP.',
  'Government-issued ID required at check-in.',
  'Incidentals and extras are the guest’s responsibility.',
  'Transportation and airfare are not included.',
  'Non-transferable and not redeemable for cash.',
  'No-show on 23 July 2027 without advance notice releases the accommodation and forfeits the complimentary stay.',
] as const
