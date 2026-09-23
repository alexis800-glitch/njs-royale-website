import test from 'node:test'
import assert from 'node:assert/strict'

import { hashIdentifier, sha256Hex } from '../lib/meta/hash.ts'
import { buildEvent, buildUserData, sendCompleteRegistration } from '../lib/meta/capi.ts'
import { hasValidMarketingConsent } from '../lib/meta/consent.ts'
import { CONSENT_VERSION, META_PIXEL_ID } from '../lib/meta/config.ts'

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

const EMAIL = 'ada@example.com'
const PHONE = '2348031234567'
// Independently known SHA-256 values for the normalised identifiers used here.
const EMAIL_SHA256 = sha256Hex(EMAIL)
const PHONE_SHA256 = sha256Hex(PHONE)

// ── Hashing ───────────────────────────────────────────────────────────────────

test('sha256Hex matches the published test vector', () => {
  assert.equal(
    sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})

test('a hashed identifier is 64 lowercase hex characters and is not the input', () => {
  const hashed = hashIdentifier(EMAIL)
  assert.match(hashed ?? '', /^[0-9a-f]{64}$/)
  assert.notEqual(hashed, EMAIL)
})

test('an absent identifier is omitted rather than hashed as an empty string', () => {
  assert.equal(hashIdentifier(''), undefined)
  assert.equal(hashIdentifier(null), undefined)
  assert.equal(hashIdentifier(undefined), undefined)
  // The hash of "" is a real, constant value; sending it would match nobody.
  assert.notEqual(hashIdentifier(''), sha256Hex(''))
})

// ── What is sent to Meta ──────────────────────────────────────────────────────

test('user data carries hashed identifiers, never the raw ones', () => {
  const userData = buildUserData({
    email: EMAIL,
    phone: PHONE,
    fbp: 'fb.1.1700000000000.1234567890',
    fbc: 'fb.1.1700000000000.abc123',
    clientIpAddress: '102.89.1.1',
    clientUserAgent: 'Mozilla/5.0',
  })

  assert.deepEqual(userData.em, [EMAIL_SHA256])
  assert.deepEqual(userData.ph, [PHONE_SHA256])
  assert.equal(userData.fbp, 'fb.1.1700000000000.1234567890')
  assert.equal(userData.fbc, 'fb.1.1700000000000.abc123')
  assert.equal(userData.client_ip_address, '102.89.1.1')
  assert.equal(userData.client_user_agent, 'Mozilla/5.0')

  const serialised = JSON.stringify(userData)
  assert.ok(!serialised.includes(EMAIL), 'raw email must not appear')
  assert.ok(!serialised.includes(PHONE), 'raw telephone must not appear')
})

test('missing cookies and identifiers are left out entirely', () => {
  const userData = buildUserData({ email: null, phone: null, fbp: null, fbc: null })
  assert.deepEqual(Object.keys(userData), [])
})

test('the event carries only the fields Meta needs', () => {
  const event = buildEvent({
    eventId: '11111111-2222-4333-8444-555555555555',
    eventTime: 1_700_000_000,
    eventSourceUrl: 'https://example.vercel.app/first-look',
    identifiers: { email: EMAIL, phone: PHONE },
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

test('invitation codes, names and notes never reach Meta', () => {
  const event = buildEvent({
    eventId: 'abc',
    eventTime: 1,
    eventSourceUrl: 'https://example.test/founding-guest',
    identifiers: { email: EMAIL, phone: PHONE },
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
  identifiers: { email: EMAIL, phone: PHONE },
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
