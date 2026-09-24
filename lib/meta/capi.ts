// Meta Conversions API — the server half of a deduplicated CompleteRegistration.
//
// The browser Pixel and this module send the same event with the same event_id, so
// Meta counts one registration rather than two.
//
// NO CONTACT DETAILS ARE SENT, hashed or otherwise. This is deliberate and should
// not be undone without the decision being retaken.
//
// Nothing in a registration proves that the person filling the form owns the email
// address and telephone number they typed. Someone can enter a third party's
// details, assert consent, and — if we sent them — cause the SHA-256 of that
// person's email and telephone to reach Meta, who can match a hash back to the
// person. Hashing protects the values in transit and at rest; it does not make
// that person's participation consensual. So we send none of it, and Meta matches
// on the browser's own Meta cookies, the IP address and the user agent instead.
// The cost is match quality; the benefit is that no one can be reported to Meta
// because somebody else typed their address.
//
// Invitation codes, names, companion names, arrival times and notes are likewise
// never sent: we store those, Meta does not need them.
//
// This module never throws at its caller and never blocks a registration: a Meta
// failure is reported back as a category, logged without personal data, and
// discarded. The access token is read from the environment, is never returned,
// logged, or included in a URL, and never reaches the browser.

import { META_PIXEL_ID } from './config.ts'

const GRAPH_VERSION = 'v21.0'

/** Meta must never delay a registration; the request is abandoned after this. */
const REQUEST_TIMEOUT_MS = 2000

// Deliberately has no email or telephone field: see the note at the top of this
// file. The type is the guard — you cannot pass contact details to this module.
export type CapiIdentifiers = {
  /** Meta browser cookies, when the visitor's browser has them. */
  fbp?: string | null
  fbc?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
}

export type CapiEvent = {
  eventId: string
  /** Seconds since the epoch, as Meta requires. */
  eventTime: number
  /** Verified on our side — never a URL supplied by the browser. */
  eventSourceUrl: string
  identifiers: CapiIdentifiers
}

export type CapiOutcome = {
  status: 'sent' | 'skipped' | 'failed'
  /** Coarse reason, safe to log: never contains personal data or a token. */
  category: string
}

type MetaPayload = {
  data: Array<Record<string, unknown>>
  access_token: string
  test_event_code?: string
}

/**
 * Build the `user_data` object.
 *
 * Absent identifiers are omitted rather than sent empty. There is no `em` and no
 * `ph`: contact details are never sent to Meta, hashed or otherwise.
 */
export function buildUserData(identifiers: CapiIdentifiers): Record<string, unknown> {
  const userData: Record<string, unknown> = {}

  if (identifiers.fbp) userData.fbp = identifiers.fbp
  if (identifiers.fbc) userData.fbc = identifiers.fbc
  if (identifiers.clientIpAddress) userData.client_ip_address = identifiers.clientIpAddress
  if (identifiers.clientUserAgent) userData.client_user_agent = identifiers.clientUserAgent

  return userData
}

/** The single event object sent to Meta, matching the browser Pixel event exactly. */
export function buildEvent(event: CapiEvent): Record<string, unknown> {
  return {
    event_name: 'CompleteRegistration',
    event_time: event.eventTime,
    event_id: event.eventId,
    action_source: 'website',
    event_source_url: event.eventSourceUrl,
    user_data: buildUserData(event.identifiers),
  }
}

/**
 * Send one CompleteRegistration event.
 *
 * Returns an outcome instead of throwing. The caller has already stored the
 * registration by this point, so nothing here may turn a successful registration
 * into a failure for the guest.
 */
export async function sendCompleteRegistration(
  event: CapiEvent,
  fetchImpl: typeof fetch = fetch,
): Promise<CapiOutcome> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE

  if (!META_PIXEL_ID) return { status: 'skipped', category: 'no_pixel_id' }
  if (!accessToken) return { status: 'skipped', category: 'no_access_token' }

  const payload: MetaPayload = {
    data: [buildEvent(event)],
    // Sent in the body, never in the query string, so the token cannot appear in
    // a URL that some proxy or log might retain.
    access_token: accessToken,
  }
  // Optional and Preview-only: when the variable is unset, Production behaves
  // normally and the event counts as a live conversion.
  if (testEventCode) payload.test_event_code = testEventCode

  try {
    const response = await fetchImpl(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      // The status alone is enough to diagnose; the body can echo our payload.
      return { status: 'failed', category: `http_${response.status}` }
    }
    return { status: 'sent', category: 'ok' }
  } catch (error) {
    const name = error instanceof Error ? error.name : 'unknown'
    return { status: 'failed', category: name === 'TimeoutError' ? 'timeout' : 'network_error' }
  }
}
