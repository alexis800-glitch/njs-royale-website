import { randomBytes } from 'crypto'

// Unambiguous uppercase alphanumerics — no O/0/I/1/L confusion on a
// reference guests will read out over the phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Current date/time parts in Africa/Lagos, independent of server TZ. */
export function lagosDateTimeParts(d: Date = new Date()): { date: string; time: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    // Intl can render midnight as "24" — Aiosell expects 00-23.
    time: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}:${parts.second}`,
  }
}

/** `bookedOn` timestamp for Aiosell payloads: YYYY-MM-DD HH:mm:ss, Africa/Lagos. */
export function formatBookedOn(d: Date = new Date()): string {
  const { date, time } = lagosDateTimeParts(d)
  return `${date} ${time}`
}

/**
 * Generates the guest-facing NJS booking reference: NJS-{YYYYMMDD}-{6 chars}.
 * This is the Aiosell bookingId AND the idempotency key — it is generated
 * exactly once per booking and never regenerated on retries.
 */
export function generateBookingRef(d: Date = new Date()): string {
  const { date } = lagosDateTimeParts(d)
  const bytes = randomBytes(6)
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += ALPHABET[bytes[i] % ALPHABET.length]
  return `NJS-${date.replaceAll('-', '')}-${suffix}`
}
