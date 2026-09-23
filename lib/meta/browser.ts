// Browser half of a deduplicated CompleteRegistration.
//
// The event id comes from the server, which has already stored the registration
// and sent the matching Conversions API event under the same id. Meta sees both
// copies and counts one registration.
//
// This only ever runs when the server confirmed a stored registration and the
// visitor has granted marketing consent; without consent the Pixel is not loaded
// at all and `window.fbq` does not exist.

import { META_PIXEL_ID } from './config'

export function trackCompleteRegistration(eventId: string): boolean {
  if (!META_PIXEL_ID || !eventId) return false
  if (typeof window === 'undefined') return false

  const fbq = window.fbq
  if (typeof fbq !== 'function') return false

  try {
    fbq('track', 'CompleteRegistration', {}, { eventID: eventId })
    return true
  } catch {
    // Tracking must never break a completed registration.
    return false
  }
}
