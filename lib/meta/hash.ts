// SHA-256 hashing for Meta Conversions API user data.
//
// Meta requires identifiers to be normalised first and then hashed, so that the
// raw email address or telephone number never leaves our server. Hashing an empty
// value would send a constant hash that matches nobody, so empty input returns
// undefined and the field is simply omitted.

import { createHash } from 'node:crypto'

/** Lowercase hex SHA-256 of an already-normalised value. */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

/** Hash a normalised identifier, or omit it entirely when there is nothing to hash. */
export function hashIdentifier(normalised: string | null | undefined): string | undefined {
  if (!normalised) return undefined
  return sha256Hex(normalised)
}
