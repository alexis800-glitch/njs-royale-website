import { BOOKING_ENABLED } from '@/lib/booking/config'
import { handleBookingRequest, rateLimit } from '@/lib/booking/service'

// The booking API — preview only.
//
// This is the server-side boundary. Real Aiosell credentials and API calls
// would live behind it and would never be reachable from a browser; today it
// drives the mock. The journey in components/booking talks to this route
// through lib/booking/client.ts and holds no adapter of its own.
//
// It does not exist on production. BOOKING_ENABLED is false there, and this
// handler answers 404 rather than 403, so the route is indistinguishable from
// one that was never deployed.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 16 * 1024

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Nothing here is cacheable, and a cached booking response shared
      // between guests would be a disclosure rather than an optimisation.
      'cache-control': 'no-store',
    },
  })
}

/**
 * A coarse, non-identifying key for the rate limiter. Never logged or stored.
 *
 * PROTOTYPE-ONLY, and weak in two ways worth writing down rather than
 * discovering later:
 *
 *   1. It trusts `x-forwarded-for`. Vercel sets that header itself and
 *      overwrites anything a client sends, so on Vercel it is sound. On any
 *      other host it is client-settable, and a caller could rotate it to get a
 *      fresh bucket every request — so the limiter is only as good as the
 *      platform in front of it.
 *   2. Locally the header is absent and every caller becomes 'unknown', so all
 *      traffic shares one bucket. That is how the browser test suite first
 *      exhausted the limit: hundreds of legitimate requests from one apparent
 *      caller.
 *
 * A real deployment wants a shared limiter keyed on something the client
 * cannot choose.
 */
function callerKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0]?.trim() || 'unknown'
}

export async function POST(request: Request): Promise<Response> {
  if (!BOOKING_ENABLED) return new Response(null, { status: 404 })

  if (!rateLimit(callerKey(request)))
    return json(
      {
        ok: false,
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: 'Too many requests. Please wait a moment and try again.',
          retryable: true,
        },
      },
      429,
    )

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES)
    return json({ ok: false, error: { code: 'INVALID_QUERY', message: 'Request too large.' } }, 413)

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(
      { ok: false, error: { code: 'INVALID_QUERY', message: 'Unrecognised request.' } },
      400,
    )
  }

  try {
    const result = await handleBookingRequest(body)
    // 200 even for a refused booking: an unavailable room is an answer, not a
    // transport failure, and the body carries the typed reason.
    return json(result, 200)
  } catch {
    // Deliberately swallowed. Whatever went wrong, the guest gets a sentence
    // and the client gets a code — never a stack, a hostname or a credential.
    return json(
      {
        ok: false,
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: 'The booking system is temporarily unavailable. Please try again in a moment.',
          retryable: true,
        },
      },
      200,
    )
  }
}
