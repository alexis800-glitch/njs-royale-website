// Calendar arithmetic for the booking journey.
//
// Every date that crosses a boundary in this subsystem is an ISO calendar date
// string, 'YYYY-MM-DD', and never a Date object. A hotel night is a calendar
// fact, not an instant: a guest arriving on 23 July 2027 arrives on that date
// whether they are booking from Lagos, London or Los Angeles. Passing Date
// objects around invites a timezone to shift a stay by a night, which is the
// classic hotel-booking bug, so the contracts in types.ts use strings and the
// helpers below do the arithmetic in UTC where a Date is unavoidable.
//
// ISO dates also sort and compare correctly as plain strings, which is why
// compareIso is a string comparison and not a parse.

export type IsoDate = string

const ISO_SHAPE = /^\d{4}-\d{2}-\d{2}$/

/**
 * True for a well-formed ISO date that is also a real calendar date.
 *
 * The shape test alone accepts '2027-02-31' and '2027-13-01'; the round-trip
 * through UTC rejects them, because Date normalises 31 February to 3 March and
 * the result no longer matches the input.
 */
export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_SHAPE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  )
}

/** Negative when a is earlier, 0 when equal, positive when a is later. */
export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Nights between arrival and departure.
 *
 * Returns 0 — never a negative number — for a same-day or reversed stay, and 0
 * for anything that is not a pair of valid dates. Callers treat 0 as "not a
 * stay"; validate.ts turns that into the message a guest reads.
 */
export function nightsBetween(arrival: IsoDate, departure: IsoDate): number {
  if (!isIsoDate(arrival) || !isIsoDate(departure)) return 0
  const ms = Date.parse(`${departure}T00:00:00Z`) - Date.parse(`${arrival}T00:00:00Z`)
  const nights = Math.round(ms / 86_400_000)
  return nights > 0 ? nights : 0
}

/** The ISO date `days` after `iso`. Negative values step backwards. */
export function addDays(iso: IsoDate, days: number): IsoDate {
  if (!isIsoDate(iso)) throw new TypeError(`addDays: not an ISO date: ${String(iso)}`)
  const base = Date.parse(`${iso}T00:00:00Z`)
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Today as an ISO date, in UTC.
 *
 * Takes the clock as an argument so tests can fix it. Nigeria is UTC+1 and
 * never observes daylight saving, so UTC can read one date behind local time
 * for the first hour of the day. That is deliberately tolerated here: it can
 * only ever make the earliest selectable arrival more conservative by a day,
 * never less, and no date restriction in this subsystem is relaxed by it.
 */
export function todayIso(now: Date = new Date()): IsoDate {
  return now.toISOString().slice(0, 10)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** '2027-07-23' -> '23 July 2027'. House style: no ordinal suffix, no comma. */
export function formatLongDate(iso: IsoDate): string {
  if (!isIsoDate(iso)) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** '2027-07-23' -> '23 Jul 2027', for tight spaces such as the stay summary. */
export function formatShortDate(iso: IsoDate): string {
  if (!isIsoDate(iso)) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`
}
