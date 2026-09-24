// Server-side validation for both registration forms.
//
// The browser validates too, for a responsive experience, but this is the
// authority: the route never trusts the client. Both sides share these rules and
// these messages so a field rejected here reads the same as one rejected there.

import { normaliseEmail, normalisePhone, sanitiseMultiline, sanitiseText } from './normalise.ts'

export type RegistrationKind = 'first-look' | 'founding-guest'

export const REGISTRATION_KINDS: RegistrationKind[] = ['first-look', 'founding-guest']

/** Arrival windows offered on the Founding Guest form. The server accepts no others. */
export const ARRIVAL_OPTIONS = [
  'Morning (before 12:00 noon)',
  'Afternoon (12:00 noon – 4:00 p.m.)',
  'Early evening (4:00 p.m. – 7:00 p.m.)',
  'Later in the evening (after 7:00 p.m.)',
]

/** Per-field limits. Anything longer is a mistake or an attack, not a name. */
const LIMITS = {
  code: 40,
  name: 120,
  email: 254,
  phone: 32,
  arrival: 60,
  notes: 1000,
}

export type FieldErrors = Record<string, string>

/** What we store once the input has been validated and normalised. */
export type RegistrationRecord = {
  kind: RegistrationKind
  invitationCode: string
  fullName: string
  /** Normalised: trimmed and lowercased. */
  email: string
  /** Normalised: digits including country code. */
  phone: string
  /** Exactly as the guest typed it, for calling them back. */
  phoneDisplay: string
  companionName: string | null
  attending: boolean | null
  partySize: number | null
  arrivalWindow: string | null
  arrivalNotes: string | null
  marketingOptIn: boolean
  policyAck: boolean
  conditionsAck: boolean
}

export type ValidationResult =
  | { ok: true; record: RegistrationRecord }
  | { ok: false; errors: FieldErrors }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function checkEmail(raw: unknown, errors: FieldErrors, field: string): string {
  const email = normaliseEmail(raw).slice(0, LIMITS.email)
  if (!email) errors[field] = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email))
    errors[field] = 'Enter an email address in the format name@example.com.'
  return email
}

function checkPhone(raw: unknown, errors: FieldErrors, field: string): { display: string; normalised: string } {
  const display = sanitiseText(raw, LIMITS.phone)
  const normalised = normalisePhone(display)
  if (!display) {
    errors[field] = 'Enter your mobile or WhatsApp number.'
  } else if (normalised.length < 7 || normalised.length > 15 || /[^\d\s()+-]/.test(display)) {
    errors[field] =
      'Enter a valid mobile or WhatsApp number, including the country code if outside Nigeria.'
  }
  return { display, normalised }
}

function isTrue(value: unknown): boolean {
  return value === true
}

/** First Look guest RSVP for the Phase I opening on 12 December 2026. */
export function validateFirstLook(input: Record<string, unknown>): ValidationResult {
  const errors: FieldErrors = {}

  const invitationCode = sanitiseText(input.code, LIMITS.code)
  if (!invitationCode) errors.code = 'Enter the invitation or reference code shown on your invitation.'

  const fullName = sanitiseText(input.fullName, LIMITS.name)
  if (!fullName) errors.fullName = 'Enter your full name.'

  const email = checkEmail(input.email, errors, 'email')
  const phone = checkPhone(input.phone, errors, 'phone')

  const attendingRaw = input.attending
  if (attendingRaw !== 'yes' && attendingRaw !== 'no')
    errors.attending = 'Tell us whether you will attend on 12 December 2026.'
  const attending = attendingRaw === 'yes' ? true : attendingRaw === 'no' ? false : null

  // Party size and companion only mean anything when the guest is attending.
  let partySize: number | null = null
  let companionName: string | null = null
  if (attending === true) {
    const partyRaw = input.party
    if (partyRaw !== '1' && partyRaw !== '2') errors.party = 'Select how many people will attend.'
    else partySize = partyRaw === '2' ? 2 : 1

    if (partySize === 2) {
      const companion = sanitiseText(input.companion, LIMITS.name)
      if (!companion) errors.companion = 'Enter your companion’s full name.'
      else companionName = companion
    }
  }

  const policyAck = isTrue(input.privacyAck)
  if (!policyAck) errors.privacyAck = 'Please confirm that you have read the Privacy Policy.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    record: {
      kind: 'first-look',
      invitationCode,
      fullName,
      email,
      phone: phone.normalised,
      phoneDisplay: phone.display,
      companionName,
      attending,
      partySize,
      arrivalWindow: null,
      arrivalNotes: null,
      marketingOptIn: isTrue(input.grandOpeningUpdates),
      policyAck,
      conditionsAck: false,
    },
  }
}

/** Founding Guest activation for the Grand Opening stay, 23–25 July 2027. */
export function validateFoundingGuest(input: Record<string, unknown>): ValidationResult {
  const errors: FieldErrors = {}

  const invitationCode = sanitiseText(input.code, LIMITS.code)
  if (!invitationCode)
    errors.code = 'Enter the invitation or reference code shown on your Founding Guest invitation.'

  const fullName = sanitiseText(input.primaryName, LIMITS.name)
  if (!fullName) errors.primaryName = 'Enter the primary guest’s full name.'

  const email = checkEmail(input.email, errors, 'email')
  const phone = checkPhone(input.phone, errors, 'phone')

  const secondName = sanitiseText(input.secondName, LIMITS.name)
  if (!secondName) errors.secondName = 'Enter the second guest’s full name.'

  const attendance = isTrue(input.attendance)
  if (!attendance) errors.attendance = 'Please confirm attendance from 23 to 25 July 2027.'

  const arrival = sanitiseText(input.arrival, LIMITS.arrival)
  if (!arrival) errors.arrival = 'Select your expected arrival time on 23 July 2027.'
  else if (ARRIVAL_OPTIONS.indexOf(arrival) === -1)
    errors.arrival = 'Select an arrival time from the list.'

  const conditionsAck = isTrue(input.conditionsAck)
  if (!conditionsAck)
    errors.conditionsAck = 'Please accept the Founding Guest accommodation conditions.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    record: {
      kind: 'founding-guest',
      invitationCode,
      fullName,
      email,
      phone: phone.normalised,
      phoneDisplay: phone.display,
      companionName: secondName,
      // The Founding Guest stay is for two, confirmed by the attendance tick.
      attending: true,
      partySize: 2,
      arrivalWindow: arrival,
      arrivalNotes: sanitiseMultiline(input.arrivalNotes, LIMITS.notes) || null,
      marketingOptIn: isTrue(input.updates),
      policyAck: false,
      conditionsAck,
    },
  }
}

export function validateRegistration(
  kind: RegistrationKind,
  input: Record<string, unknown>,
): ValidationResult {
  return kind === 'first-look' ? validateFirstLook(input) : validateFoundingGuest(input)
}
