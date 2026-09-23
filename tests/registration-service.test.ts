import test from 'node:test'
import assert from 'node:assert/strict'

import type { CapiEvent, CapiOutcome } from '../lib/meta/capi.ts'
import type { LogEntry, RequestContext, ServiceDeps } from '../lib/registrations/service.ts'
import { RATE_LIMIT_MAX, handleRegistration } from '../lib/registrations/service.ts'
import type { SaveInput, SavedRegistration } from '../lib/registrations/store.ts'
import { CONSENT_VERSION } from '../lib/meta/config.ts'
import { errorCategory } from '../lib/registrations/errors.ts'
import { AUTOFILL_TOKENS, HONEYPOT_FIELD, HONEYPOT_LABEL, attractsAutofill } from '../lib/registrations/honeypot.ts'

// The whole point of these tests: Meta is downstream of storage, and consent is
// checked on the server. Nothing below talks to Postgres or to Meta.

const NOW = Date.parse('2026-09-23T12:00:00.000Z')
const SUBMISSION_ID = '11111111-2222-4333-8444-555555555555'

const GRANTED = { marketing: true, version: CONSENT_VERSION, decidedAt: '2026-09-23T11:00:00.000Z' }
const DENIED = { marketing: false, version: CONSENT_VERSION, decidedAt: '2026-09-23T11:00:00.000Z' }

const FIELDS = {
  code: 'NJS-001',
  fullName: 'Ada Lovelace',
  email: 'Ada@Example.com',
  phone: '0803 123 4567',
  attending: 'yes',
  party: '2',
  companion: 'Charles Babbage',
  grandOpeningUpdates: true,
  privacyAck: true,
}

const CONTEXT: RequestContext = {
  origin: 'https://njs-preview.vercel.app',
  ip: '102.89.1.1',
  userAgent: 'Mozilla/5.0',
  fbp: 'fb.1.1700000000000.1234567890',
  fbc: null,
  now: NOW,
}

function makeStore(options: { failSave?: boolean; recentCount?: number; failRateLimit?: boolean } = {}) {
  const rows: SaveInput[] = []
  const bySubmission = new Map<string, { id: string; createdAt: Date }>()
  const metaOutcomes: Array<{ id: string; status: string }> = []

  const store = {
    rows,
    metaOutcomes,
    async save(input: SaveInput): Promise<SavedRegistration> {
      if (options.failSave) throw new Error('connection terminated unexpectedly')
      const existing = bySubmission.get(input.submissionId)
      if (existing) return { ...existing, duplicate: true }
      const saved = { id: `row-${rows.length + 1}`, createdAt: new Date(NOW) }
      bySubmission.set(input.submissionId, saved)
      rows.push(input)
      return { ...saved, duplicate: false }
    },
    async countRecentByIpHash(): Promise<number> {
      if (options.failRateLimit) throw new Error('relation "registrations" does not exist')
      return options.recentCount ?? 0
    },
    async recordMetaOutcome(id: string, status: string): Promise<void> {
      metaOutcomes.push({ id, status })
    },
  }
  return store
}

function makeDeps(
  store: ReturnType<typeof makeStore>,
  metaOutcome: CapiOutcome = { status: 'sent', category: 'ok' },
) {
  const metaEvents: CapiEvent[] = []
  const logs: LogEntry[] = []
  const deps: ServiceDeps & { metaEvents: CapiEvent[]; logs: LogEntry[] } = {
    store,
    metaEvents,
    logs,
    async sendMeta(event: CapiEvent) {
      metaEvents.push(event)
      return metaOutcome
    },
    newEventId: () => 'event-id-fixed',
    hashIp: (ip) => (ip ? `hash(${ip})` : null),
    log: (entry) => logs.push(entry),
  }
  return deps
}

const request = (overrides: Record<string, unknown> = {}) => ({
  kind: 'first-look',
  submissionId: SUBMISSION_ID,
  fields: FIELDS,
  consent: GRANTED,
  formToken: '',
  renderedAt: NOW - 30_000,
  ...overrides,
})

// ── The happy path ────────────────────────────────────────────────────────────

test('a valid registration is stored, and browser and server share one event id', async () => {
  const store = makeStore()
  const deps = makeDeps(store)

  const response = await handleRegistration(request(), CONTEXT, deps)

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)

  // Durably stored, normalised, with the consent that was in force.
  assert.equal(store.rows.length, 1)
  assert.equal(store.rows[0].record.email, 'ada@example.com')
  assert.equal(store.rows[0].record.phone, '2348031234567')
  assert.equal(store.rows[0].consentMarketing, true)
  assert.equal(store.rows[0].ipHash, 'hash(102.89.1.1)')
  assert.equal(store.rows[0].sourcePath, '/first-look')

  // Exactly one server event, with the id the browser is told to use.
  assert.equal(deps.metaEvents.length, 1)
  assert.equal(deps.metaEvents[0].eventId, 'event-id-fixed')
  assert.equal(response.body.eventId, 'event-id-fixed')
  assert.equal(response.body.trackBrowserEvent, true)
  assert.equal(deps.metaEvents[0].eventId, response.body.eventId)

  // The source URL is built here, never taken from the browser.
  assert.equal(deps.metaEvents[0].eventSourceUrl, 'https://njs-preview.vercel.app/first-look')
  assert.equal(deps.metaEvents[0].identifiers.fbp, 'fb.1.1700000000000.1234567890')
  assert.equal(deps.metaEvents[0].eventTime, Math.floor(NOW / 1000))

  assert.deepEqual(store.metaOutcomes, [{ id: 'row-1', status: 'sent' }])
})

test('a Founding Guest activation reports its own source URL', async () => {
  const store = makeStore()
  const deps = makeDeps(store)
  const response = await handleRegistration(
    request({
      kind: 'founding-guest',
      fields: {
        code: 'NJS-FG-001',
        primaryName: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+2348031234567',
        secondName: 'Charles Babbage',
        attendance: true,
        arrival: 'Afternoon (12:00 noon – 4:00 p.m.)',
        conditionsAck: true,
      },
    }),
    CONTEXT,
    deps,
  )

  assert.equal(response.status, 200)
  assert.equal(deps.metaEvents[0].eventSourceUrl, 'https://njs-preview.vercel.app/founding-guest')
  // No query string can be smuggled in, so `?final=1` can never be a source URL.
  assert.ok(!deps.metaEvents[0].eventSourceUrl.includes('?'))
})

// ── Consent ───────────────────────────────────────────────────────────────────

test('consent declined: the registration still succeeds and Meta hears nothing', async () => {
  const store = makeStore()
  const deps = makeDeps(store)

  const response = await handleRegistration(request({ consent: DENIED }), CONTEXT, deps)

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  assert.equal(store.rows.length, 1, 'the registration is stored regardless')
  assert.equal(store.rows[0].consentMarketing, false)

  assert.equal(deps.metaEvents.length, 0, 'no Conversions API call')
  assert.equal(response.body.trackBrowserEvent, false, 'no browser event either')
  assert.equal(response.body.eventId, null, 'and no id for one to be fired with')
})

test('a forged consent flag does not produce a Meta event', async () => {
  for (const forged of [true, 'granted', { marketing: true }, { marketing: true, version: 99 }]) {
    const store = makeStore()
    const deps = makeDeps(store)
    const response = await handleRegistration(request({ consent: forged }), CONTEXT, deps)

    assert.equal(response.status, 200, 'the registration itself is unaffected')
    assert.equal(store.rows.length, 1)
    assert.equal(deps.metaEvents.length, 0, `consent ${JSON.stringify(forged)} must not send`)
    assert.equal(response.body.trackBrowserEvent, false)
  }
})

test('no consent record at all means no Meta event', async () => {
  const store = makeStore()
  const deps = makeDeps(store)
  const response = await handleRegistration(request({ consent: undefined }), CONTEXT, deps)
  assert.equal(response.body.ok, true)
  assert.equal(deps.metaEvents.length, 0)
})

// ── Failures ──────────────────────────────────────────────────────────────────

test('validation failure: nothing stored, nothing sent to Meta', async () => {
  const store = makeStore()
  const deps = makeDeps(store)

  const response = await handleRegistration(
    request({ fields: { ...FIELDS, email: 'not-an-email' } }),
    CONTEXT,
    deps,
  )

  assert.equal(response.status, 400)
  assert.equal(response.body.ok, false)
  assert.ok((response.body.errors as Record<string, string>).email)
  assert.equal(store.rows.length, 0)
  assert.equal(deps.metaEvents.length, 0)
})

test('storage failure: the guest is told it failed, and Meta hears nothing', async () => {
  const store = makeStore({ failSave: true })
  const deps = makeDeps(store)

  const response = await handleRegistration(request(), CONTEXT, deps)

  assert.equal(response.status, 503)
  assert.equal(response.body.ok, false)
  assert.match(String(response.body.message), /could not save/i)
  assert.equal(deps.metaEvents.length, 0, 'a registration that was not stored is not a conversion')
})

test('a database error during the rate-limit check is reported, not thrown', async () => {
  // This is the path that produced a bare 500 with an empty body on Preview when
  // the schema was missing: the query ran before anything was wrapped.
  const store = makeStore({ failRateLimit: true })
  const deps = makeDeps(store)

  const response = await handleRegistration(request(), CONTEXT, deps)

  assert.equal(response.status, 503)
  assert.equal(response.body.ok, false)
  assert.match(String(response.body.message), /could not save/i)
  assert.equal(store.rows.length, 0)
  assert.equal(deps.metaEvents.length, 0, 'a registration that was never stored is not a conversion')
  // The failure is logged, without the registration itself.
  const serialised = JSON.stringify(deps.logs)
  assert.ok(serialised.includes('registration_failed'))
  assert.ok(!serialised.includes('Ada Lovelace'))
})

test('a Meta failure still leaves the guest with a successful registration', async () => {
  const store = makeStore()
  const deps = makeDeps(store, { status: 'failed', category: 'timeout' })

  const response = await handleRegistration(request(), CONTEXT, deps)

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  assert.equal(store.rows.length, 1)
  // The browser event still fires: if the server copy was lost it is the only one.
  assert.equal(response.body.trackBrowserEvent, true)
  assert.deepEqual(store.metaOutcomes, [{ id: 'row-1', status: 'failed' }])
})

test('a Meta call that throws cannot break the registration', async () => {
  const store = makeStore()
  const deps = makeDeps(store)
  deps.sendMeta = async () => {
    throw new Error('unexpected')
  }

  const response = await handleRegistration(request(), CONTEXT, deps)

  // The guest is told the truth: their registration was stored.
  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  assert.equal(store.rows.length, 1)
  assert.deepEqual(store.metaOutcomes, [{ id: 'row-1', status: 'failed' }])
})

// ── Repeat submissions and spam ───────────────────────────────────────────────

test('submitting twice stores one registration and sends one conversion', async () => {
  const store = makeStore()
  const deps = makeDeps(store)

  const first = await handleRegistration(request(), CONTEXT, deps)
  const second = await handleRegistration(request(), CONTEXT, deps)

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  assert.equal(second.body.ok, true, 'a double-click is still a success for the guest')
  assert.equal(second.body.duplicate, true)

  assert.equal(store.rows.length, 1, 'one registration')
  assert.equal(deps.metaEvents.length, 1, 'one conversion')
  assert.equal(second.body.trackBrowserEvent, false, 'and no second browser event')
})

test('a filled honeypot is refused outright', async () => {
  const store = makeStore()
  const deps = makeDeps(store)
  const response = await handleRegistration(request({ formToken: 'Acme Ltd' }), CONTEXT, deps)

  assert.equal(response.status, 400)
  assert.equal(store.rows.length, 0)
  assert.equal(deps.metaEvents.length, 0)
})

test('a submission faster than a human is refused', async () => {
  const store = makeStore()
  const deps = makeDeps(store)
  const response = await handleRegistration(request({ renderedAt: NOW - 200 }), CONTEXT, deps)

  assert.equal(response.status, 400)
  assert.equal(store.rows.length, 0)
  assert.equal(deps.metaEvents.length, 0)
})

test('too many registrations from one address are rate limited', async () => {
  const store = makeStore({ recentCount: RATE_LIMIT_MAX })
  const deps = makeDeps(store)
  const response = await handleRegistration(request(), CONTEXT, deps)

  assert.equal(response.status, 429)
  assert.equal(store.rows.length, 0)
  assert.equal(deps.metaEvents.length, 0)
})

test('an unknown form or a malformed submission id is refused', async () => {
  const store = makeStore()
  const deps = makeDeps(store)

  assert.equal((await handleRegistration(request({ kind: 'enquiry' }), CONTEXT, deps)).status, 400)
  assert.equal((await handleRegistration(request({ submissionId: 'abc' }), CONTEXT, deps)).status, 400)
  assert.equal((await handleRegistration(request({ fields: 'nope' }), CONTEXT, deps)).status, 400)
  assert.equal(store.rows.length, 0)
  assert.equal(deps.metaEvents.length, 0)
})

// ── Logging ───────────────────────────────────────────────────────────────────

test('logs carry operational detail only — never personal data or a token', async () => {
  const store = makeStore()
  const deps = makeDeps(store)
  process.env.META_CAPI_ACCESS_TOKEN = 'super-secret-token'

  await handleRegistration(request(), CONTEXT, deps)

  const serialised = JSON.stringify(deps.logs)
  for (const forbidden of [
    'Ada Lovelace',
    'Charles Babbage',
    'ada@example.com',
    'Ada@Example.com',
    '2348031234567',
    '0803 123 4567',
    'NJS-001',
    '102.89.1.1',
    'super-secret-token',
    // The hashed identifiers are personal data too, and are not logged either.
    'hash(102.89.1.1)',
  ]) {
    assert.ok(!serialised.includes(forbidden), `logs must not contain ${forbidden}`)
  }

  const names = deps.logs.map((entry) => entry.event)
  assert.ok(names.includes('registration_stored'))
  assert.ok(names.includes('CompleteRegistration'))
})

test('error categories are machine codes, never messages', () => {
  const pgError = Object.assign(new Error('relation "registrations" does not exist'), {
    code: '42P01',
  })
  assert.equal(errorCategory(pgError), '42P01')

  const dnsError = Object.assign(new Error('getaddrinfo ENOTFOUND db.example.com'), {
    code: 'ENOTFOUND',
  })
  const category = errorCategory(dnsError)
  assert.equal(category, 'ENOTFOUND')
  // The host in the message must never reach a log line.
  assert.ok(!category.includes('db.example.com'))

  assert.equal(errorCategory(new TypeError('boom')), 'TypeError')
  assert.equal(errorCategory('a string'), 'unknown')
  assert.equal(errorCategory(null), 'unknown')
})

// ── The honeypot must never attract autofill ──────────────────────────────────

test('the honeypot name and label give browser autofill nothing to match', () => {
  // Regression: the field was once called "company" and labelled
  // "Company (leave blank)". Browsers filled it for real guests, and every
  // registration made with autofill was refused.
  assert.equal(attractsAutofill('company'), true, 'the old name must be recognised as unsafe')
  assert.equal(attractsAutofill('Company (leave blank)'), true)

  assert.equal(attractsAutofill(HONEYPOT_FIELD), false, `${HONEYPOT_FIELD} must not attract autofill`)
  assert.equal(attractsAutofill(HONEYPOT_LABEL), false, `"${HONEYPOT_LABEL}" must not attract autofill`)

  // Both forms build the id as `${prefix}-${HONEYPOT_FIELD}`.
  for (const prefix of ['fl', 'fg']) {
    assert.equal(attractsAutofill(`${prefix}-${HONEYPOT_FIELD}`), false)
  }

  // And the guard itself has to be meaningful.
  assert.ok(AUTOFILL_TOKENS.length > 10)
  for (const token of ['company', 'email', 'name', 'tel', 'address', 'password']) {
    assert.ok(AUTOFILL_TOKENS.includes(token), `${token} should be treated as an autofill magnet`)
  }
})

test('a filled honeypot is still refused, whatever it is called', async () => {
  const store = makeStore()
  const deps = makeDeps(store)
  const response = await handleRegistration(request({ formToken: 'filled by a bot' }), CONTEXT, deps)

  assert.equal(response.status, 400)
  assert.equal(store.rows.length, 0)
  assert.equal(deps.metaEvents.length, 0)
  const logged = JSON.stringify(deps.logs)
  assert.ok(logged.includes('honeypot'), 'the log still names the reason clearly for maintainers')
})
