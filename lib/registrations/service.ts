// Registration orchestration: validate, store, then tell Meta.
//
// The order matters and is the whole point of this module. A registration is
// successful when, and only when, the store has committed the row. Meta is told
// afterwards, on a short timeout, and whatever Meta does next cannot change what
// the guest is told.
//
// Dependencies are injected so the branching here can be tested for real: consent
// declined, validation failed, storage failed, Meta failed, submitted twice.

import type { CapiEvent, CapiOutcome } from '../meta/capi.ts'
import { hasValidMarketingConsent } from '../meta/consent.ts'
import { CONSENT_VERSION } from '../meta/config.ts'
import type { FieldErrors, RegistrationKind } from './validate.ts'
import { REGISTRATION_KINDS, validateRegistration } from './validate.ts'
import type { RegistrationStore } from './store.ts'
import { errorCategory } from './errors.ts'

/**
 * Registrations accepted from one IP hash per window before we start refusing.
 *
 * Counted per IP, and an IP is not a person: a household, an office, a hotel
 * lobby or a coach party all share one NAT address, and on the day itself a group
 * of guests registering together would look like one visitor. The limit is set
 * well above any plausible genuine burst, because refusing a real guest is far
 * worse than admitting a few extra rows a spammer would have to work for. The
 * honeypot, the time-to-submit check and the same-origin rule do the real work of
 * stopping automation; this is a backstop against volume.
 */
export const RATE_LIMIT_MAX = 20
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

/** A human takes longer than this to fill the form in; a script does not. */
export const MIN_SUBMIT_MS = 2000

/** The only paths that may appear as a Meta event_source_url for a registration. */
const PATH_BY_KIND: Record<RegistrationKind, string> = {
  'first-look': '/first-look',
  'founding-guest': '/founding-guest',
}

export type RegistrationRequest = {
  kind?: unknown
  submissionId?: unknown
  /** The form fields themselves. */
  fields?: unknown
  /** The consent record the browser holds, echoed back for the server to check. */
  consent?: unknown
  /** The hidden honeypot field (see lib/registrations/honeypot.ts). Humans leave it empty. */
  formToken?: unknown
  /** When the form was rendered, in epoch milliseconds. */
  renderedAt?: unknown
}

export type RequestContext = {
  /** Verified origin of this deployment, e.g. https://njs-royale-website.vercel.app */
  origin: string
  ip: string | null
  userAgent: string | null
  fbp: string | null
  fbc: string | null
  now: number
}

export type LogEntry = {
  event: string
  eventId?: string
  kind?: string
  status?: string
  category?: string
}

export type ServiceDeps = {
  store: RegistrationStore
  sendMeta: (event: CapiEvent) => Promise<CapiOutcome>
  newEventId: () => string
  hashIp: (ip: string | null) => string | null
  /** Operational logging only: event name, ids, status, error category. */
  log?: (entry: LogEntry) => void
}

export type ServiceResponse = {
  status: number
  body: Record<string, unknown>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function badRequest(errors: FieldErrors, message?: string): ServiceResponse {
  return { status: 400, body: { ok: false, errors, message } }
}

/** The store is unreachable. The guest is told the truth and given the telephone number. */
function storageUnavailable(): ServiceResponse {
  return {
    status: 503,
    body: {
      ok: false,
      errors: {},
      message:
        'We could not save your registration just now. Please try again, or call us on 0707 533 4158.',
    },
  }
}

export async function handleRegistration(
  request: RegistrationRequest,
  context: RequestContext,
  deps: ServiceDeps,
): Promise<ServiceResponse> {
  const log = deps.log ?? (() => {})

  // ── Shape checks ────────────────────────────────────────────────────────────
  const kind = request.kind
  if (typeof kind !== 'string' || REGISTRATION_KINDS.indexOf(kind as RegistrationKind) === -1) {
    return badRequest({}, 'Unknown registration form.')
  }
  const registrationKind = kind as RegistrationKind

  const submissionId = request.submissionId
  if (typeof submissionId !== 'string' || !UUID_PATTERN.test(submissionId)) {
    return badRequest({}, 'This form could not be identified. Please reload the page and try again.')
  }

  const fields = request.fields
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return badRequest({}, 'No registration details were received.')
  }

  // ── Spam defences, before anything is stored ────────────────────────────────
  // A filled honeypot is a bot. Nothing is stored and no Meta event is sent; we
  // do not pretend to have accepted it, because a silent discard is exactly what
  // a genuine guest must never get.
  if (typeof request.formToken === 'string' && request.formToken.trim() !== '') {
    log({ event: 'registration_rejected', kind: registrationKind, category: 'honeypot' })
    return badRequest({}, 'This registration could not be accepted. Please try again.')
  }

  if (typeof request.renderedAt === 'number' && Number.isFinite(request.renderedAt)) {
    const elapsed = context.now - request.renderedAt
    if (elapsed >= 0 && elapsed < MIN_SUBMIT_MS) {
      log({ event: 'registration_rejected', kind: registrationKind, category: 'too_fast' })
      return badRequest({}, 'This registration could not be accepted. Please try again.')
    }
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  const validation = validateRegistration(registrationKind, fields as Record<string, unknown>)
  if (!validation.ok) {
    // No Meta event of any kind for a registration that never happened.
    log({ event: 'registration_rejected', kind: registrationKind, category: 'validation' })
    return badRequest(validation.errors)
  }

  // ── Rate limiting ───────────────────────────────────────────────────────────
  const ipHash = deps.hashIp(context.ip)
  if (ipHash) {
    const since = new Date(context.now - RATE_LIMIT_WINDOW_MS)
    let recent: number
    try {
      recent = await deps.store.countRecentByIpHash(ipHash, since)
    } catch (error) {
      // The store is unreachable, so the registration cannot be saved either.
      // Say so plainly rather than letting the error escape as a bare 500.
      log({ event: 'registration_failed', kind: registrationKind, category: errorCategory(error) })
      return storageUnavailable()
    }
    if (recent >= RATE_LIMIT_MAX) {
      log({ event: 'registration_rejected', kind: registrationKind, category: 'rate_limited' })
      return {
        status: 429,
        body: {
          ok: false,
          errors: {},
          message:
            'Several registrations have already been sent from this connection. Please try again later, or call us on 0707 533 4158.',
        },
      }
    }
  }

  // ── Consent ─────────────────────────────────────────────────────────────────
  // Validated, not authenticated: the record is client-supplied and cannot be
  // proven genuine. See lib/meta/consent.ts.
  const marketingConsent = hasValidMarketingConsent(request.consent, context.now)
  const consentRecord = (request.consent ?? {}) as { decidedAt?: unknown }
  const eventId = deps.newEventId()

  // ── Store. Everything after this point is best-effort. ──────────────────────
  let saved
  try {
    saved = await deps.store.save({
      record: validation.record,
      submissionId,
      sourcePath: PATH_BY_KIND[registrationKind],
      ipHash,
      userAgent: context.userAgent,
      consentMarketing: marketingConsent,
      consentVersion: marketingConsent ? CONSENT_VERSION : null,
      consentDecidedAt:
        marketingConsent && typeof consentRecord.decidedAt === 'string'
          ? consentRecord.decidedAt
          : null,
      metaEventId: eventId,
    })
  } catch (error) {
    // Never log the registration itself — only that storing it failed.
    log({ event: 'registration_failed', kind: registrationKind, category: errorCategory(error) })
    return storageUnavailable()
  }

  log({
    event: 'registration_stored',
    kind: registrationKind,
    eventId,
    status: saved.duplicate ? 'duplicate' : 'created',
  })

  // ── Meta, only with consent, and only once per submission ───────────────────
  // A repeat of the same submission must not send a second conversion.
  if (!marketingConsent || saved.duplicate) {
    return {
      status: 200,
      body: { ok: true, eventId: null, trackBrowserEvent: false, duplicate: saved.duplicate },
    }
  }

  // The registration is already stored, so nothing below may throw its way out
  // of this function: the sender is written not to, and this catches it anyway.
  let outcome: CapiOutcome
  try {
    outcome = await deps.sendMeta({
      eventId,
      eventTime: Math.floor(context.now / 1000),
      eventSourceUrl: `${context.origin}${PATH_BY_KIND[registrationKind]}`,
      identifiers: {
        email: validation.record.email,
        phone: validation.record.phone,
        fbp: context.fbp,
        fbc: context.fbc,
        clientIpAddress: context.ip,
        clientUserAgent: context.userAgent,
      },
    })
  } catch (error) {
    outcome = { status: 'failed', category: errorCategory(error) }
  }

  log({
    event: 'CompleteRegistration',
    eventId,
    kind: registrationKind,
    status: outcome.status,
    category: outcome.category,
  })

  try {
    await deps.store.recordMetaOutcome(saved.id, outcome.status)
  } catch {
    // Auditing only. A failed status update cannot affect the guest.
  }

  // The browser event fires whatever Meta said here: if the server call failed,
  // the browser event is the only copy; if it succeeded, they deduplicate.
  return { status: 200, body: { ok: true, eventId, trackBrowserEvent: true, duplicate: false } }
}
