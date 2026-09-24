// The spam honeypot's field name, and the rule that keeps it safe.
//
// A honeypot only works if humans never fill it. The first version called itself
// `company` and was labelled "Company (leave blank)" — and browsers filled it for
// real guests, because address autofill and password managers match on exactly
// those words and ignore `autocomplete="off"`. Every guest who used autofill was
// refused. The field therefore has to be named something no heuristic recognises.
//
// The name is kept here, away from React, so the rule can be tested directly.

/** Name and id of the honeypot input. Deliberately meaningless. */
export const HONEYPOT_FIELD = 'njs-form-token'

/** Label text. Says what to do without naming anything autofill looks for. */
export const HONEYPOT_LABEL = 'Leave this field empty.'

/**
 * Substrings that browser autofill and password managers match on when deciding
 * what a field is for. Anything containing one of these is a magnet for autofill
 * and must never be used for the honeypot.
 */
export const AUTOFILL_TOKENS = [
  'company',
  'organization',
  'organisation',
  'business',
  'address',
  'street',
  'city',
  'postal',
  'postcode',
  'zip',
  'country',
  'county',
  'state',
  'name',
  'email',
  'mail',
  'tel',
  'phone',
  'mobile',
  'user',
  'login',
  'password',
  'card',
  'cc-',
  'birth',
  'title',
  'honorific',
]

/** True if a field name, id or label would attract autofill. */
export function attractsAutofill(value: string): boolean {
  const lower = value.toLowerCase()
  return AUTOFILL_TOKENS.some((token) => lower.indexOf(token) !== -1)
}
