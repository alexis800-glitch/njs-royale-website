import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normaliseEmail,
  normalisePhone,
  sanitiseMultiline,
  sanitiseText,
} from '../lib/registrations/normalise.ts'
import { validateFirstLook, validateFoundingGuest } from '../lib/registrations/validate.ts'

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
  arrival: 'Afternoon (12:00 noon – 4:00 p.m.)',
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
