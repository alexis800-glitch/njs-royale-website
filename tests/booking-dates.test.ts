import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays,
  compareIso,
  formatLongDate,
  formatShortDate,
  isIsoDate,
  nightsBetween,
  todayIso,
} from '../lib/booking/dates.ts'

test('isIsoDate accepts a real calendar date', () => {
  assert.equal(isIsoDate('2027-07-23'), true)
  assert.equal(isIsoDate('2026-12-19'), true)
  assert.equal(isIsoDate('2028-02-29'), true) // 2028 is a leap year
})

test('isIsoDate rejects shapes that are not ISO dates', () => {
  for (const bad of ['', '2027-7-23', '23-07-2027', '2027/07/23', '2027-07-23T00:00:00Z', 'tomorrow']) {
    assert.equal(isIsoDate(bad), false, `expected ${JSON.stringify(bad)} to be rejected`)
  }
})

test('isIsoDate rejects non-strings without throwing', () => {
  for (const bad of [undefined, null, 20270723, {}, [], new Date()]) {
    assert.equal(isIsoDate(bad), false)
  }
})

test('isIsoDate rejects well-shaped dates that do not exist', () => {
  // The shape test alone would accept all of these.
  assert.equal(isIsoDate('2027-02-30'), false)
  assert.equal(isIsoDate('2027-02-29'), false) // 2027 is not a leap year
  assert.equal(isIsoDate('2027-13-01'), false)
  assert.equal(isIsoDate('2027-00-10'), false)
  assert.equal(isIsoDate('2027-04-31'), false)
})

test('nightsBetween counts calendar nights', () => {
  assert.equal(nightsBetween('2027-07-23', '2027-07-24'), 1)
  assert.equal(nightsBetween('2027-07-23', '2027-07-26'), 3)
  assert.equal(nightsBetween('2027-07-28', '2027-08-04'), 7)
})

test('nightsBetween returns 0 rather than a negative for a reversed or same-day stay', () => {
  assert.equal(nightsBetween('2027-07-23', '2027-07-23'), 0)
  assert.equal(nightsBetween('2027-07-26', '2027-07-23'), 0)
})

test('nightsBetween returns 0 for anything that is not a pair of dates', () => {
  assert.equal(nightsBetween('not-a-date', '2027-07-24'), 0)
  assert.equal(nightsBetween('2027-07-23', ''), 0)
})

test('nightsBetween is not thrown off by a month or year boundary', () => {
  assert.equal(nightsBetween('2027-07-31', '2027-08-01'), 1)
  assert.equal(nightsBetween('2027-12-31', '2028-01-01'), 1)
  // Across a leap day.
  assert.equal(nightsBetween('2028-02-28', '2028-03-01'), 2)
})

test('nightsBetween is immune to the DST shifts that break local-time arithmetic', () => {
  // Europe springs forward on 28 March 2027 and falls back on 31 October 2027.
  // A naive local-time subtraction yields 0.958 and 1.042 days here, which
  // rounds correctly by luck but drifts over a longer stay.
  assert.equal(nightsBetween('2027-03-27', '2027-03-29'), 2)
  assert.equal(nightsBetween('2027-10-30', '2027-11-01'), 2)
  // A fortnight spanning the autumn change: 14, not 14.04.
  assert.equal(nightsBetween('2027-10-25', '2027-11-08'), 14)
})

test('compareIso orders dates', () => {
  assert.ok(compareIso('2026-12-19', '2027-07-23') < 0)
  assert.ok(compareIso('2027-07-23', '2026-12-19') > 0)
  assert.equal(compareIso('2027-07-23', '2027-07-23'), 0)
})

test('addDays steps forwards and backwards across boundaries', () => {
  assert.equal(addDays('2027-07-23', 1), '2027-07-24')
  assert.equal(addDays('2027-07-23', 0), '2027-07-23')
  assert.equal(addDays('2027-07-23', -1), '2027-07-22')
  assert.equal(addDays('2027-07-31', 1), '2027-08-01')
  assert.equal(addDays('2027-12-31', 1), '2028-01-01')
  assert.equal(addDays('2028-02-28', 1), '2028-02-29')
})

test('addDays refuses a non-date rather than returning a wrong one', () => {
  assert.throws(() => addDays('nonsense', 1), TypeError)
})

test('todayIso reads the injected clock', () => {
  assert.equal(todayIso(new Date('2026-11-17T09:30:00Z')), '2026-11-17')
})

test('date formatting follows house style', () => {
  assert.equal(formatLongDate('2026-12-19'), '19 December 2026')
  assert.equal(formatLongDate('2027-07-23'), '23 July 2027')
  assert.equal(formatShortDate('2027-07-23'), '23 Jul 2027')
  assert.equal(formatLongDate('rubbish'), '')
})
