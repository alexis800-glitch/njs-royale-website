// Pseudonymising the caller's IP address for rate limiting.
//
// The address itself is never stored. What is stored is a salted SHA-256 hash,
// and the salt is what makes it a pseudonym: without one, a hash of an IPv4
// address can be reversed by running all four billion addresses through SHA-256,
// which takes seconds on a laptop. An unsalted hash is therefore not a
// pseudonym at all — it is the address in a thin disguise.
//
// So when no usable salt is configured we store nothing rather than storing
// something reversible. Rate limiting then has nothing to count and is skipped,
// which is the safe direction to fail: a guest can still register, and the
// honeypot, the timing check and the same-origin rule still stand. The condition
// is reported once per process so it cannot pass unnoticed.

import { createHash } from 'node:crypto'

/** Shorter than this and the salt adds little; treated as if it were absent. */
export const MIN_SALT_LENGTH = 16

let reported = false

function reportOnce(category: string, report: (entry: Record<string, string>) => void) {
  if (reported) return
  reported = true
  report({ event: 'registration_config', category })
}

/** Reset between tests. Not used in application code. */
export function resetSaltReportingForTests() {
  reported = false
}

/**
 * The salted hash of an IP address, or null when it cannot be produced safely.
 *
 * Null means "do not store, and do not rate limit" — never "store it unsalted".
 */
export function hashIp(
  ip: string | null,
  salt: string | undefined = process.env.REGISTRATION_IP_SALT,
  report: (entry: Record<string, string>) => void = (entry) => console.error(JSON.stringify(entry)),
): string | null {
  if (!ip) return null

  if (!salt) {
    reportOnce('missing_ip_salt', report)
    return null
  }
  if (salt.length < MIN_SALT_LENGTH) {
    reportOnce('weak_ip_salt', report)
    return null
  }

  return createHash('sha256').update(`${salt}:${ip}`, 'utf8').digest('hex')
}
