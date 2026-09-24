// Normalisation and sanitisation for registration input.
//
// Framework-free on purpose: this module is imported by the API route, by the
// Meta Conversions API layer and directly by the tests, so it must not depend on
// Next.js, React or the DOM.

/** Longest value we accept in any single field, before per-field limits apply. */
export const MAX_FIELD_LENGTH = 500

/**
 * Strip control characters, collapse runs of whitespace and trim.
 *
 * This is the only cleaning applied to free text. We deliberately do not strip
 * angle brackets or quotes: values are stored as parameters and rendered as text,
 * so escaping them here would corrupt legitimate names ("O'Brien", "Smith & Co")
 * without adding safety.
 */
export function sanitiseText(value: unknown, maxLength = MAX_FIELD_LENGTH): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

/** Multi-line free text: collapse spaces per line but keep the line breaks. */
export function sanitiseMultiline(value: unknown, maxLength = MAX_FIELD_LENGTH): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()
    .slice(0, maxLength)
}

/**
 * Meta's required email normalisation: trim and lowercase, nothing else.
 *
 * We deliberately do not strip Gmail dots or `+` suffixes. Meta's own guidance is
 * to send the address as the person gave it, lowercased — rewriting it would
 * reduce match quality and would no longer be the address we hold.
 */
export function normaliseEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/** Default country calling code for numbers written in local Nigerian form. */
export const DEFAULT_COUNTRY_CODE = '234'

/**
 * Normalise a phone number to digits only, including the country code, which is
 * the form Meta expects before hashing.
 *
 *   0803 123 4567    -> 2348031234567   (local Nigerian form)
 *   +234 803 1234567 -> 2348031234567
 *   00234 803…       -> 2348031234567
 *   +44 7700 900123  -> 447700900123    (already international; left alone)
 *
 * A number that is already international is never rewritten. Only a leading zero,
 * which cannot begin an international number, triggers the Nigerian default.
 */
export function normalisePhone(value: unknown, defaultCountryCode = DEFAULT_COUNTRY_CODE): string {
  if (typeof value !== 'string') return ''
  let digits = value.replace(/\D/g, '')
  if (!digits) return ''

  // International prefix written as 00 (e.g. 00234…).
  if (digits.length > 2 && digits.slice(0, 2) === '00') digits = digits.slice(2)

  // A single leading zero means the number was written in local form.
  if (digits.charAt(0) === '0') digits = defaultCountryCode + digits.replace(/^0+/, '')

  return digits
}
