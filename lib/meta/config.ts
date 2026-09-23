// Meta Pixel configuration and the rules for where tracking may run at all.
//
// Phase 1 is browser-side only: consent, the Pixel and PageView. No Conversions
// API calls and no /api/meta/* route yet, because production has no successful
// form submission to report. When that workflow lands, the browser and server
// events must share one event_id, and both must require marketing consent:
//   CompleteRegistration — successful First Look / Founding Guest registrations
//   Lead                 — a future general hotel enquiry form

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
