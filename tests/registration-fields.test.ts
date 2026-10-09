import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  normaliseEmail,
  normalisePhone,
  sanitiseMultiline,
  sanitiseText,
} from '../lib/registrations/normalise.ts'
import {
  ARRIVAL_OPTIONS,
  canonicalArrivalWindow,
  validateFirstLook,
  validateFoundingGuest,
} from '../lib/registrations/validate.ts'

// ── Normalisation ─────────────────────────────────────────────────────────────

test('email is trimmed and lowercased, and nothing else', () => {
  assert.equal(normaliseEmail('  Ada.Lovelace@Example.COM '), 'ada.lovelace@example.com')
  // Gmail dots and + suffixes are preserved: it is the address we actually hold.
  assert.equal(normaliseEmail('a.b+njs@gmail.com'), 'a.b+njs@gmail.com')
  assert.equal(normaliseEmail(undefined), '')
  assert.equal(normaliseEmail(42), '')
})

test('phone normalises to digits with a country code', () => {
  // Local Nigerian form gains the country code.
  assert.equal(normalisePhone('0803 123 4567'), '2348031234567')
  assert.equal(normalisePhone('0803-123-4567'), '2348031234567')
  // Already international, in three different notations: one result.
  assert.equal(normalisePhone('+234 803 123 4567'), '2348031234567')
  assert.equal(normalisePhone('00234 803 123 4567'), '2348031234567')
  assert.equal(normalisePhone('234 803 123 4567'), '2348031234567')
  // A foreign number keeps its own country code.
  assert.equal(normalisePhone('+44 7700 900123'), '447700900123')
  assert.equal(normalisePhone(''), '')
  assert.equal(normalisePhone('   '), '')
})

test('phone normalisation is stable: normalising twice changes nothing', () => {
  const once = normalisePhone('0803 123 4567')
  assert.equal(normalisePhone(once), once)
})

test('text is stripped of control characters and collapsed', () => {
  assert.equal(sanitiseText('  Ada   Lovelace  '), 'Ada Lovelace')
  assert.equal(sanitiseText('Ada\u0000\u001FLovelace'), 'Ada Lovelace')
  assert.equal(sanitiseText('x'.repeat(600)).length, 500)
  // Apostrophes and ampersands are left intact; they are parts of real names.
  assert.equal(sanitiseText("O'Brien & Sons"), "O'Brien & Sons")
})

test('multiline text keeps its line breaks but loses control characters', () => {
  assert.equal(sanitiseMultiline('one\r\n\r\n\r\n  two  '), 'one\n\ntwo')
  assert.equal(sanitiseMultiline('a\u0007b'), 'a b')
})

// ── First Look validation ─────────────────────────────────────────────────────

const validFirstLook = {
  code: 'NJS-001',
  fullName: 'Ada Lovelace',
  email: '  Ada@Example.com ',
  phone: '0803 123 4567',
  attending: 'yes',
  party: '2',
  companion: 'Charles Babbage',
  grandOpeningUpdates: true,
  privacyAck: true,
}

test('a complete First Look registration validates and is normalised', () => {
  const result = validateFirstLook(validFirstLook)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.record.kind, 'first-look')
  assert.equal(result.record.email, 'ada@example.com')
  assert.equal(result.record.phone, '2348031234567')
  assert.equal(result.record.phoneDisplay, '0803 123 4567')
  assert.equal(result.record.attending, true)
  assert.equal(result.record.partySize, 2)
  assert.equal(result.record.companionName, 'Charles Babbage')
  assert.equal(result.record.marketingOptIn, true)
})

test('First Look: every required field is enforced', () => {
  const result = validateFirstLook({})
  assert.equal(result.ok, false)
  if (result.ok) return
  for (const field of ['code', 'fullName', 'email', 'phone', 'attending', 'privacyAck']) {
    assert.ok(result.errors[field], `expected an error for ${field}`)
  }
})

test('First Look: a malformed email is rejected', () => {
  const result = validateFirstLook({ ...validFirstLook, email: 'ada@example' })
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.match(result.errors.email, /name@example\.com/)
})

test('First Look: a companion name is required only when two are attending', () => {
  const two = validateFirstLook({ ...validFirstLook, companion: '' })
  assert.equal(two.ok, false)

  const one = validateFirstLook({ ...validFirstLook, party: '1', companion: '' })
  assert.equal(one.ok, true)
  if (!one.ok) return
  assert.equal(one.record.partySize, 1)
  assert.equal(one.record.companionName, null)
})

test('First Look: declining to attend clears party and companion', () => {
  const result = validateFirstLook({ ...validFirstLook, attending: 'no' })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.record.attending, false)
  assert.equal(result.record.partySize, null)
  assert.equal(result.record.companionName, null)
})

test('First Look: the privacy acknowledgement must be a real true', () => {
  // A string "true" from a crafted request is not a tick.
  const result = validateFirstLook({ ...validFirstLook, privacyAck: 'true' })
  assert.equal(result.ok, false)
})

// ── Founding Guest validation ─────────────────────────────────────────────────

const validFoundingGuest = {
  code: 'NJS-FG-001',
  primaryName: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+2348031234567',
  secondName: 'Charles Babbage',
  attendance: true,
  arrival: 'Afternoon (12:00 noon to 4:00 p.m.)',
  arrivalNotes: 'Arriving from Abuja.',
  conditionsAck: true,
  updates: false,
}

test('a complete Founding Guest activation validates', () => {
  const result = validateFoundingGuest(validFoundingGuest)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.record.kind, 'founding-guest')
  assert.equal(result.record.phone, '2348031234567')
  assert.equal(result.record.partySize, 2)
  assert.equal(result.record.companionName, 'Charles Babbage')
  assert.equal(result.record.conditionsAck, true)
  assert.equal(result.record.arrivalNotes, 'Arriving from Abuja.')
})

test('Founding Guest: an arrival time outside the offered list is refused', () => {
  const result = validateFoundingGuest({ ...validFoundingGuest, arrival: 'Whenever I like' })
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.ok(result.errors.arrival)
})

// ── Arrival window compatibility ──────────────────────────────────────────────
//
// In October 2026 two arrival windows were reworded to remove en dashes. The
// wording a visitor sees changed; the value stored in arrival_window did not.
// These tests pin both halves of that contract.

/** The four values arrival_window has always held, and must keep holding. */
const CANONICAL_WINDOWS = [
  'Morning (before 12:00 noon)',
  'Afternoon (12:00 noon \u2013 4:00 p.m.)',
  'Early evening (4:00 p.m. \u2013 7:00 p.m.)',
  'Later in the evening (after 7:00 p.m.)',
]

const LEGACY_AFTERNOON = 'Afternoon (12:00 noon \u2013 4:00 p.m.)'
const CURRENT_AFTERNOON = 'Afternoon (12:00 noon to 4:00 p.m.)'
const LEGACY_EVENING = 'Early evening (4:00 p.m. \u2013 7:00 p.m.)'
const CURRENT_EVENING = 'Early evening (4:00 p.m. to 7:00 p.m.)'

test('arrival windows shown to visitors contain no dashes', () => {
  for (const option of ARRIVAL_OPTIONS) {
    assert.ok(!option.includes('\u2013'), `en dash in offered option: ${option}`)
    assert.ok(!option.includes('\u2014'), `em dash in offered option: ${option}`)
  }
})

test('a current submission is accepted and stored in canonical form', () => {
  const result = validateFoundingGuest({ ...validFoundingGuest, arrival: CURRENT_AFTERNOON })
  assert.equal(result.ok, true)
  if (!result.ok) return
  // The visitor saw "to"; the database keeps the original en dash.
  assert.equal(result.record.arrivalWindow, LEGACY_AFTERNOON)
})

test('a legacy submission from a stale page is accepted, not rejected', () => {
  // The exact failure this guards: a visitor loaded the form before the
  // rewording and submits afterwards.
  for (const legacy of [LEGACY_AFTERNOON, LEGACY_EVENING]) {
    const result = validateFoundingGuest({ ...validFoundingGuest, arrival: legacy })
    assert.equal(result.ok, true, `legacy wording was refused: ${legacy}`)
    if (!result.ok) return
    assert.equal(result.record.arrivalWindow, legacy)
  }
})

test('every offered window is accepted by the server', () => {
  for (const option of ARRIVAL_OPTIONS) {
    const result = validateFoundingGuest({ ...validFoundingGuest, arrival: option })
    assert.equal(result.ok, true, `offered option was refused: ${option}`)
  }
})

test('historical data consistency: both wordings store byte-identical values', () => {
  const pairs = [
    [CURRENT_AFTERNOON, LEGACY_AFTERNOON],
    [CURRENT_EVENING, LEGACY_EVENING],
  ]
  for (const [current, legacy] of pairs) {
    assert.equal(canonicalArrivalWindow(current), canonicalArrivalWindow(legacy))
  }
  // Nothing can introduce a second spelling into the column.
  const stored = ARRIVAL_OPTIONS.map((o) => canonicalArrivalWindow(o))
  assert.deepEqual(stored, CANONICAL_WINDOWS)
  for (const value of stored) {
    assert.ok(CANONICAL_WINDOWS.includes(value as string), `uncanonical value stored: ${value}`)
  }
})

test('normalisation is stable: a canonical value normalises to itself', () => {
  for (const value of CANONICAL_WINDOWS) {
    assert.equal(canonicalArrivalWindow(value), value)
  }
})

test('invalid arrival windows are refused', () => {
  const rejected = [
    'Whenever I like',
    '',
    '   ',
    // An em dash where the legacy value had an en dash: close, but not offered.
    'Afternoon (12:00 noon \u2014 4:00 p.m.)',
    // A plain hyphen, likewise never an offered value.
    'Afternoon (12:00 noon - 4:00 p.m.)',
    'afternoon (12:00 noon to 4:00 p.m.)',
    // Inherited property names must not resolve through the lookup.
    'constructor',
    'toString',
    '__proto__',
  ]
  for (const arrival of rejected) {
    assert.equal(canonicalArrivalWindow(arrival), null, `wrongly accepted: ${arrival}`)
    const result = validateFoundingGuest({ ...validFoundingGuest, arrival })
    assert.equal(result.ok, false, `wrongly accepted: ${arrival}`)
    if (result.ok) return
    assert.ok(result.errors.arrival)
  }
})

test('a missing or non-string arrival window is refused', () => {
  for (const arrival of [undefined, null, 42, {}, []]) {
    const result = validateFoundingGuest({ ...validFoundingGuest, arrival })
    assert.equal(result.ok, false, `wrongly accepted: ${String(arrival)}`)
  }
})

test('the form offers exactly the windows the server validates', () => {
  // The form keeps its own copy of the list for client-side validation. If the
  // two drift apart, a visitor is offered something the server will refuse.
  const source = readFileSync(new URL('../components/FoundingGuestForm.tsx', import.meta.url), 'utf8')
  const block = source.match(/const ARRIVAL_OPTIONS = \[([^\]]*)\]/)
  assert.ok(block, 'could not find ARRIVAL_OPTIONS in FoundingGuestForm.tsx')
  const offered = (block[1].match(/'[^']*'/g) ?? []).map((quoted) => quoted.slice(1, -1))
  assert.deepEqual(offered, ARRIVAL_OPTIONS)
})

test('Founding Guest: attendance and conditions must both be accepted', () => {
  const noAttendance = validateFoundingGuest({ ...validFoundingGuest, attendance: false })
  assert.equal(noAttendance.ok, false)

  const noConditions = validateFoundingGuest({ ...validFoundingGuest, conditionsAck: false })
  assert.equal(noConditions.ok, false)
})

test('Founding Guest: empty notes are stored as null, not an empty string', () => {
  const result = validateFoundingGuest({ ...validFoundingGuest, arrivalNotes: '   ' })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.record.arrivalNotes, null)
})

test('over-long input is truncated rather than rejected outright', () => {
  const result = validateFirstLook({ ...validFirstLook, fullName: 'A'.repeat(400) })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.record.fullName.length, 120)
})
