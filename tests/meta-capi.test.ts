import test from 'node:test'
import assert from 'node:assert/strict'

import { buildEvent, buildUserData, sendCompleteRegistration } from '../lib/meta/capi.ts'
import { hasValidMarketingConsent } from '../lib/meta/consent.ts'
import { CONSENT_VERSION, META_PIXEL_ID } from '../lib/meta/config.ts'
import { createHash } from 'node:crypto'

// The Pixel ID is read once, when lib/meta/config is first loaded, so it has to be
// in the environment before this file is imported. `npm test` sets it; this check
// makes the reason obvious if the suite is started some other way.
test('the suite is running with a Pixel ID configured', () => {
  assert.equal(
    META_PIXEL_ID,
    '1030394620034055',
    'run these tests with NEXT_PUBLIC_META_PIXEL_ID set (npm test does this)',
  )
})

// Values that must never reach Meta, in any form.
const EMAIL = 'ada@example.com'
const PHONE = '2348031234567'
const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex')

const IDENTIFIERS = {
  fbp: 'fb.1.1700000000000.1234567890',
  fbc: 'fb.1.1700000000000.abc123',
  clientIpAddress: '102.89.1.1',
  clientUserAgent: 'Mozilla/5.0',
}

// ── No contact details reach Meta ─────────────────────────────────────────────

test('user data carries cookies, IP and user agent — and nothing else', () => {
  const userData = buildUserData(IDENTIFIERS)

  assert.deepEqual(Object.keys(userData).sort(), [
    'client_ip_address',
    'client_user_agent',
    'fbc',
    'fbp',
  ])
  assert.equal(userData.fbp, IDENTIFIERS.fbp)
  assert.equal(userData.fbc, IDENTIFIERS.fbc)
  assert.equal(userData.client_ip_address, '102.89.1.1')
  assert.equal(userData.client_user_agent, 'Mozilla/5.0')
})

test('there is no em and no ph, hashed or otherwise', () => {
  // The decisive regression test for the review finding: nothing in a
  // registration proves the person owns the address they typed, so we send no
  // contact details at all rather than hashes of someone else's.
  const event = buildEvent({
    eventId: '11111111-2222-4333-8444-555555555555',
    eventTime: 1_700_000_000,
    eventSourceUrl: 'https://example.vercel.app/first-look',
    identifiers: IDENTIFIERS,
  })
  const userData = event.user_data as Record<string, unknown>

  assert.equal('em' in userData, false, 'no hashed email field')
  assert.equal('ph' in userData, false, 'no hashed telephone field')

  const serialised = JSON.stringify(event)
  assert.ok(!serialised.includes(EMAIL), 'no raw email')
  assert.ok(!serialised.includes(PHONE), 'no raw telephone')
  assert.ok(!serialised.includes(sha256(EMAIL)), 'no hashed email')
  assert.ok(!serialised.includes(sha256(PHONE)), 'no hashed telephone')

  // Nothing hash-shaped at all, so a future identifier cannot slip in unnoticed.
  assert.ok(!/[0-9a-f]{64}/.test(serialised), 'no SHA-256-shaped value anywhere')
})

test('missing cookies and identifiers are left out entirely', () => {
  assert.deepEqual(Object.keys(buildUserData({ fbp: null, fbc: null })), [])
})

test('the event carries only the fields Meta needs', () => {
  const event = buildEvent({
    eventId: '11111111-2222-4333-8444-555555555555',
    eventTime: 1_700_000_000,
    eventSourceUrl: 'https://example.vercel.app/first-look',
    identifiers: IDENTIFIERS,
  })

  assert.equal(event.event_name, 'CompleteRegistration')
  assert.equal(event.action_source, 'website')
  assert.equal(event.event_id, '11111111-2222-4333-8444-555555555555')
  assert.equal(event.event_time, 1_700_000_000)
  assert.equal(event.event_source_url, 'https://example.vercel.app/first-look')
  assert.deepEqual(Object.keys(event).sort(), [
    'action_source',
    'event_id',
    'event_name',
    'event_source_url',
    'event_time',
    'user_data',
  ])
})

test('invitation codes, names and notes never reach Meta either', () => {
  const event = buildEvent({
    eventId: 'abc',
    eventTime: 1,
    eventSourceUrl: 'https://example.test/founding-guest',
    identifiers: IDENTIFIERS,
  })
  const serialised = JSON.stringify(event)
  for (const secret of ['NJS-FG-001', 'Ada Lovelace', 'Charles Babbage', 'Arriving from Abuja']) {
    assert.ok(!serialised.includes(secret), `${secret} must not be sent to Meta`)
  }
})

// ── Sending ───────────────────────────────────────────────────────────────────

type Captured = { url: string; init: RequestInit }

function captureFetch(response: Partial<Response> = { ok: true, status: 200 }) {
  const calls: Captured[] = []
  const impl = (async (url: unknown, init: unknown) => {
    calls.push({ url: String(url), init: init as RequestInit })
    return response as Response
  }) as unknown as typeof fetch
  return { calls, impl }
}

const event = {
  eventId: '11111111-2222-4333-8444-555555555555',
  eventTime: 1_700_000_000,
  eventSourceUrl: 'https://example.vercel.app/first-look',
  identifiers: IDENTIFIERS,
}

test('the access token is sent in the body, never in the URL', async () => {
  process.env.META_CAPI_ACCESS_TOKEN = 'test-token-value'
  delete process.env.META_CAPI_TEST_EVENT_CODE
  const { calls, impl } = captureFetch()

  const outcome = await sendCompleteRegistration(event, impl)

  assert.equal(outcome.status, 'sent')
  assert.equal(calls.length, 1)
  assert.ok(!calls[0].url.includes('test-token-value'), 'token must not be in the URL')
  assert.ok(!calls[0].url.includes('access_token'), 'no token parameter in the URL')
  assert.ok(calls[0].url.includes('/1030394620034055/events'))

  const body = JSON.parse(String(calls[0].init.body))
  assert.equal(body.access_token, 'test-token-value')
  assert.equal(body.data.length, 1)

  // The payload actually put on the wire carries no contact details.
  const wire = String(calls[0].init.body)
  assert.ok(!wire.includes(EMAIL) && !wire.includes(PHONE), 'no raw contact details on the wire')
  assert.ok(!wire.includes(sha256(EMAIL)) && !wire.includes(sha256(PHONE)), 'no hashes on the wire')
  assert.equal('em' in body.data[0].user_data, false)
  assert.equal('ph' in body.data[0].user_data, false)
})

test('the test event code is used only when it is configured', async () => {
  process.env.META_CAPI_ACCESS_TOKEN = 'test-token-value'

  delete process.env.META_CAPI_TEST_EVENT_CODE
  const absent = captureFetch()
  await sendCompleteRegistration(event, absent.impl)
  const withoutCode = JSON.parse(String(absent.calls[0].init.body))
  assert.ok(
    !('test_event_code' in withoutCode),
    'Production, with no code configured, must send a normal event',
  )

  process.env.META_CAPI_TEST_EVENT_CODE = 'TESTCODE123'
  const present = captureFetch()
  await sendCompleteRegistration(event, present.impl)
  const withCode = JSON.parse(String(present.calls[0].init.body))
  assert.equal(withCode.test_event_code, 'TESTCODE123')

  delete process.env.META_CAPI_TEST_EVENT_CODE
})

test('no token configured means nothing is sent', async () => {
  delete process.env.META_CAPI_ACCESS_TOKEN
  const { calls, impl } = captureFetch()
  const outcome = await sendCompleteRegistration(event, impl)
  assert.deepEqual(outcome, { status: 'skipped', category: 'no_access_token' })
  assert.equal(calls.length, 0)
})

test('an HTTP error and a network failure are reported, not thrown', async () => {
  process.env.META_CAPI_ACCESS_TOKEN = 'test-token-value'

  const failing = captureFetch({ ok: false, status: 400 })
  assert.deepEqual(await sendCompleteRegistration(event, failing.impl), {
    status: 'failed',
    category: 'http_400',
  })

  const throwing = (async () => {
    throw new Error('connect ECONNREFUSED')
  }) as unknown as typeof fetch
  assert.deepEqual(await sendCompleteRegistration(event, throwing), {
    status: 'failed',
    category: 'network_error',
  })

  const timingOut = (async () => {
    const error = new Error('timed out')
    error.name = 'TimeoutError'
    throw error
  }) as unknown as typeof fetch
  assert.deepEqual(await sendCompleteRegistration(event, timingOut), {
    status: 'failed',
    category: 'timeout',
  })
})

// ── Server-side consent ───────────────────────────────────────────────────────

test('only a complete, current, plausibly-timed grant counts as consent', () => {
  const now = Date.parse('2026-09-23T12:00:00.000Z')
  const granted = { marketing: true, version: CONSENT_VERSION, decidedAt: '2026-09-23T11:00:00.000Z' }
  assert.equal(hasValidMarketingConsent(granted, now), true)

  // A bare flag, which is what a crafted request would send.
  assert.equal(hasValidMarketingConsent({ marketing: true }, now), false)
  assert.equal(hasValidMarketingConsent(true, now), false)
  assert.equal(hasValidMarketingConsent('granted', now), false)
  assert.equal(hasValidMarketingConsent(null, now), false)
  assert.equal(hasValidMarketingConsent(undefined, now), false)

  // Declined, or from a consent version we no longer honour.
  assert.equal(hasValidMarketingConsent({ ...granted, marketing: false }, now), false)
  assert.equal(hasValidMarketingConsent({ ...granted, version: CONSENT_VERSION + 1 }, now), false)
  assert.equal(hasValidMarketingConsent({ ...granted, version: '1' }, now), false)

  // Nonsense or impossible decision times.
  assert.equal(hasValidMarketingConsent({ ...granted, decidedAt: 'yesterday' }, now), false)
  assert.equal(hasValidMarketingConsent({ ...granted, decidedAt: '2027-01-01T00:00:00Z' }, now), false)
  assert.equal(hasValidMarketingConsent({ ...granted, decidedAt: '2000-01-01T00:00:00Z' }, now), false)
})
