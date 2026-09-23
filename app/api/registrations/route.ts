import { randomUUID } from 'node:crypto'
import { sendCompleteRegistration } from '@/lib/meta/capi'
import { handleRegistration } from '@/lib/registrations/service'
import { connectionString, hashIp, postgresStore } from '@/lib/registrations/store'

// Registration endpoint for /first-look and /founding-guest.
//
// Nothing here is cached and nothing runs at the edge: the handler needs Node for
// Postgres and for SHA-256 hashing, and every request must be evaluated fresh.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** A registration is a few hundred bytes. Anything larger is refused unread. */
const MAX_BODY_BYTES = 8 * 1024

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

/**
 * Same-origin only. A registration is submitted by our own page; a request from
 * anywhere else is either a mistake or a forgery, and is refused before the body
 * is parsed.
 */
function isSameOrigin(request: Request, host: string | null): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return false

  const origin = request.headers.get('origin')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/** First address in the forwarding chain: the client Vercel saw. */
function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip')
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim())
  }
  return null
}

export async function POST(request: Request) {
  const host = request.headers.get('host')

  if (!isSameOrigin(request, host)) {
    return json(403, { ok: false, errors: {}, message: 'This request could not be accepted.' })
  }

  if (request.headers.get('content-type')?.includes('application/json') !== true) {
    return json(415, { ok: false, errors: {}, message: 'This request could not be accepted.' })
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json(413, { ok: false, errors: {}, message: 'That registration was too large to accept.' })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return json(400, { ok: false, errors: {}, message: 'That registration could not be read.' })
  }
  // Checked again after reading: content-length can lie or be absent.
  if (raw.length > MAX_BODY_BYTES) {
    return json(413, { ok: false, errors: {}, message: 'That registration was too large to accept.' })
  }

  let payload: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    payload = parsed as Record<string, unknown>
  } catch {
    return json(400, { ok: false, errors: {}, message: 'That registration could not be read.' })
  }

  // Without a database there is nowhere to put the registration, and a success
  // message would be a lie. Say so plainly instead.
  if (!connectionString()) {
    console.error(JSON.stringify({ event: 'registration_failed', category: 'no_database_configured' }))
    return json(503, {
      ok: false,
      errors: {},
      message:
        'Registration is temporarily unavailable. Please try again shortly, or call us on 0707 533 4158.',
    })
  }

  const proto = request.headers.get('x-forwarded-proto') ?? 'https'

  // Defence in depth: whatever goes wrong below, the guest gets a JSON answer and
  // a telephone number, never an unhandled crash with an empty body.
  let result
  try {
    result = await handleRegistration(
      {
        kind: payload.kind,
        submissionId: payload.submissionId,
        fields: payload.fields,
        consent: payload.consent,
        honeypot: payload.honeypot,
        renderedAt: payload.renderedAt,
      },
      {
        origin: `${proto}://${host}`,
        ip: clientIp(request),
        userAgent: request.headers.get('user-agent'),
        fbp: readCookie(request, '_fbp'),
        fbc: readCookie(request, '_fbc'),
        now: Date.now(),
      },
      {
        store: postgresStore,
        sendMeta: sendCompleteRegistration,
        newEventId: () => randomUUID(),
        hashIp,
        // Operational fields only: never a name, email, telephone, hash or token.
        log: (entry) => console.log(JSON.stringify(entry)),
      },
    )
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'registration_failed',
        category: error instanceof Error ? error.name : 'unknown',
      }),
    )
    return json(503, {
      ok: false,
      errors: {},
      message:
        'We could not save your registration just now. Please try again, or call us on 0707 533 4158.',
    })
  }

  return json(result.status, result.body)
}
