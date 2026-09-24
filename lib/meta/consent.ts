// The marketing consent record that accompanies a registration.
//
// Consent is given in the browser, so the browser is the only place the answer can
// come from — and this check therefore **cannot authenticate it**. Be clear about
// what it does and does not do.
//
// What it does: reject anything that is not a complete, current, plausibly-timed
// consent record. A missing record, a bare `true`, a record from a superseded
// consent version, a decision timestamp in the future or years in the past — none
// of these produce a Meta event. That is worth having, because it is what stops
// consent being transmitted *accidentally*: a default value, a stale record left
// in a browser, version drift after the purposes change, a client bug.
//
// What it does not do: withstand a forger. Anyone can craft a request whose
// consent record looks exactly right, and no client-supplied signal can fix that
// — including a signed token, because any token the browser can obtain an
// attacker can obtain in the same way. The saving grace is that the only person
// whose data a forger can cause to be sent is the forger's own.

import { CONSENT_VERSION } from './config.ts'

/** Reject a decision timestamp further than this into the future (clock skew). */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000

/** Reject a consent record older than this; it should have been re-asked by then. */
const MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000

export type ConsentClaim = {
  marketing?: unknown
  version?: unknown
  decidedAt?: unknown
}

/**
 * True only for a complete, current, plausibly-timed grant of marketing consent.
 * Everything else — missing, malformed, stale, denied, or from an older consent
 * version — means no Meta event is sent.
 *
 * This is a validity check, not an authenticity one. See the note at the top of
 * this file before describing it as enforcement.
 */
export function hasValidMarketingConsent(claim: unknown, now: number = Date.now()): boolean {
  if (!claim || typeof claim !== 'object') return false
  const record = claim as ConsentClaim

  if (record.marketing !== true) return false
  if (record.version !== CONSENT_VERSION) return false
  if (typeof record.decidedAt !== 'string') return false

  const decided = Date.parse(record.decidedAt)
  if (Number.isNaN(decided)) return false
  if (decided > now + FUTURE_TOLERANCE_MS) return false
  if (decided < now - MAX_AGE_MS) return false

  return true
}
