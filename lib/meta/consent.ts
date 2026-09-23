// Server-side check of the marketing consent the browser reports.
//
// The browser is the only place a person can give consent, so it is also the only
// place the answer can come from. What the server refuses to do is take a bare
// "true" on trust: the request must carry the whole consent record the banner
// wrote, at the current version, with a decision time that makes sense. A crafted
// request that simply sets a flag does not produce a Conversions API event.

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
