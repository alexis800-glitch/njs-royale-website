// Meta Pixel configuration and the rules for where tracking may run at all.
//
// Two events exist, and both require marketing consent:
//   PageView             — browser only, on every trackable route
//   CompleteRegistration — browser Pixel and Conversions API, sharing one
//                          event_id so Meta deduplicates them, and sent only
//                          after a First Look or Founding Guest registration has
//                          been stored (see lib/registrations/service.ts)
// `Lead` is deliberately unused. It is reserved for a future general enquiry
// form, so that enquiries and registrations stay countable apart.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''

// Consent record version. Bumping it invalidates stored choices and asks again,
// which is what we must do if the purposes or recipients ever change.
export const CONSENT_VERSION = 1
export const CONSENT_STORAGE_KEY = 'njs-consent-v1'

// Cookies the Pixel sets in the browser. Removed when consent is withdrawn.
export const META_COOKIES = ['_fbp', '_fbc'] as const

// Routes that must never be tracked: print/proof artwork and internal drafts.
// Matched against the pathname; `?final=1` (the distribution-file export mode)
// is excluded as well.
const UNTRACKED_PATH_PATTERNS = [
  /^\/first-look\/proofs(\/|$)/,
  /\/proofs?(\/|$)/,
  /\/print(\/|$)/,
  /\/preview-only(\/|$)/,
]

/**
 * Whether a route may be tracked. Everything is denied unless a Pixel ID is
 * configured, so a missing environment variable silently disables tracking
 * rather than half-loading it.
 */
export function isTrackableRoute(pathname: string, search?: string | URLSearchParams | null): boolean {
  if (!META_PIXEL_ID) return false
  if (!pathname) return false
  if (UNTRACKED_PATH_PATTERNS.some((re) => re.test(pathname))) return false

  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search instanceof URLSearchParams ? search : null
  if (params?.get('final') === '1') return false

  return true
}
