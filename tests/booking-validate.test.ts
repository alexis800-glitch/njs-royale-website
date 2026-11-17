import test from 'node:test'
import assert from 'node:assert/strict'
import { EARLIEST_ARRIVAL, LIMITS, RESERVATIONS_OPEN_FROM, bookingWindow, earliestSelectableArrival } from '../lib/booking/config.ts'
import { partyFits, validateGuestDetails, validateStayQuery } from '../lib/booking/validate.ts'
import type { StayQuery } from '../lib/booking/types.ts'

const GOOD: StayQuery = {
  arrival: '2027-07-24',
  departure: '2027-07-27',
  adults: 2,
  children: 0,
  rooms: 1,
}

// ---------------------------------------------------------------------------
// The date rules — the restrictions that matter most
// ---------------------------------------------------------------------------

test('the earliest arrival is the day guest-room operations commence', () => {
  assert.equal(EARLIEST_ARRIVAL, '2027-07-23')
  assert.equal(RESERVATIONS_OPEN_FROM, '2026-12-19')
})

test('an arrival on 23 July 2027 is accepted', () => {
  const r = validateStayQuery({ ...GOOD, arrival: '2027-07-23', departure: '2027-07-24' })
  assert.equal(r.ok, true)
})

test('an arrival before 23 July 2027 is refused, however close', () => {
  for (const arrival of ['2027-07-22', '2027-07-01', '2026-12-19', '2026-11-17', '2020-01-01']) {
    const r = validateStayQuery({ ...GOOD, arrival, departure: '2027-08-01' })
    assert.equal(r.ok, false, `expected ${arrival} to be refused`)
    if (!r.ok) {
      assert.match(r.errors.arrival, /23 July 2027/)
    }
  }
})

test('a stay must be at least one night', () => {
  const sameDay = validateStayQuery({ ...GOOD, arrival: '2027-07-24', departure: '2027-07-24' })
  assert.equal(sameDay.ok, false)
  if (!sameDay.ok) assert.match(sameDay.errors.departure, /at least one night/)

  const reversed = validateStayQuery({ ...GOOD, arrival: '2027-07-27', departure: '2027-07-24' })
  assert.equal(reversed.ok, false)
})

test('a stay longer than the online limit is refused with a route to the resort', () => {
  const r = validateStayQuery({ ...GOOD, arrival: '2027-07-23', departure: '2027-09-23' })
  assert.equal(r.ok, false)
  if (!r.ok) assert.match(r.errors.departure, /contact the resort/i)
})

test('a malformed date is refused rather than coerced', () => {
  const r = validateStayQuery({ ...GOOD, arrival: '2027-02-30' })
  assert.equal(r.ok, false)
  if (!r.ok) assert.ok(r.errors.arrival)
})

test('missing dates each get their own message', () => {
  const r = validateStayQuery({ adults: 2, children: 0, rooms: 1 })
  assert.equal(r.ok, false)
  if (!r.ok) {
    assert.ok(r.errors.arrival)
    assert.ok(r.errors.departure)
    // Not also a confusing "departure must be after arrival" when neither is set.
    assert.doesNotMatch(r.errors.departure, /after your arrival/)
  }
})

// ---------------------------------------------------------------------------
// Party size
// ---------------------------------------------------------------------------

test('party counts must be whole numbers inside the published limits', () => {
  const cases: Array<[Partial<StayQuery>, string]> = [
    [{ adults: 0 }, 'adults'],
    [{ adults: LIMITS.maxAdults + 1 }, 'adults'],
    [{ adults: 2.5 }, 'adults'],
    [{ adults: NaN }, 'adults'],
    [{ children: -1 }, 'children'],
    [{ children: LIMITS.maxChildren + 1 }, 'children'],
    [{ rooms: 0 }, 'rooms'],
    [{ rooms: LIMITS.maxRooms + 1 }, 'rooms'],
  ]
  for (const [patch, field] of cases) {
    const r = validateStayQuery({ ...GOOD, ...patch })
    assert.equal(r.ok, false, `expected ${JSON.stringify(patch)} to be refused`)
    if (!r.ok) assert.ok(r.errors[field], `expected an error on ${field}`)
  }
})

test('a valid query comes back normalised and complete', () => {
  const r = validateStayQuery(GOOD)
  assert.equal(r.ok, true)
  if (r.ok) assert.deepEqual(r.value, GOOD)
})

test('partyFits admits any party while occupancy is unconfirmed', () => {
  // Every catalogue category has null occupancy today. Refusing a booking on a
  // limit the resort has not given would be inventing policy.
  assert.equal(partyFits({ adults: 8, children: 6, rooms: 1 }, null), true)
})

test('partyFits enforces occupancy once a real number exists', () => {
  assert.equal(partyFits({ adults: 2, children: 0, rooms: 1 }, 2), true)
  assert.equal(partyFits({ adults: 3, children: 0, rooms: 1 }, 2), false)
  assert.equal(partyFits({ adults: 3, children: 1, rooms: 2 }, 2), true)
  assert.equal(partyFits({ adults: 2, children: 1, rooms: 1 }, 2), false)
})

// ---------------------------------------------------------------------------
// The booking window
// ---------------------------------------------------------------------------

test('advance reservations are not open before 19 December 2026', () => {
  assert.equal(bookingWindow('2026-11-17'), 'not-open-yet')
  assert.equal(bookingWindow('2026-12-18'), 'not-open-yet')
  assert.equal(bookingWindow('2026-12-19'), 'open')
  assert.equal(bookingWindow('2027-01-01'), 'open')
})

test('the arrival field never offers a date in the past', () => {
  assert.equal(earliestSelectableArrival('2026-11-17'), '2027-07-23')
  assert.equal(earliestSelectableArrival('2027-07-23'), '2027-07-23')
  // Once the opening has passed, today becomes the floor.
  assert.equal(earliestSelectableArrival('2027-09-01'), '2027-09-01')
})

// ---------------------------------------------------------------------------
// Guest details
// ---------------------------------------------------------------------------

test('guest details are normalised the way registrations are', () => {
  const r = validateGuestDetails({
    firstName: '  Adaeze ',
    lastName: 'Okonkwo',
    email: '  ADAEZE@Example.Test ',
    phone: '0803 123 4567',
    specialRequests: '  A quiet room, please.  ',
  })
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.value.firstName, 'Adaeze')
    assert.equal(r.value.email, 'adaeze@example.test')
    assert.equal(r.value.phoneDisplay, '0803 123 4567')
    assert.match(r.value.phone, /^\d+$/)
    assert.equal(r.value.specialRequests, 'A quiet room, please.')
  }
})

test('an empty special request becomes null, not an empty string', () => {
  const r = validateGuestDetails({
    firstName: 'A',
    lastName: 'B',
    email: 'a@b.test',
    phone: '08031234567',
    specialRequests: '   ',
  })
  assert.equal(r.ok, true)
  if (r.ok) assert.equal(r.value.specialRequests, null)
})

test('each missing or malformed guest field gets its own message', () => {
  const r = validateGuestDetails({ email: 'not-an-email', phone: 'abc' })
  assert.equal(r.ok, false)
  if (!r.ok) {
    assert.ok(r.errors.firstName)
    assert.ok(r.errors.lastName)
    assert.match(r.errors.email, /name@example\.com/)
    assert.ok(r.errors.phone)
  }
})
