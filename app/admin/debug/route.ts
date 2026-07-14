import { timingSafeEqual } from 'crypto'
import { desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { bookings, syncLogs, webhookEvents } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

/**
 * Diagnostics view — NOT a PII browser. Guest identifiers are masked; raw
 * payloads are never rendered (they live in the DB tables for approved
 * inspection). Implemented as a route handler rather than a page so it can
 * issue a real 401 Basic Auth challenge and noindex headers without a
 * site-wide middleware.
 *
 * Access: 404 in Production unless ADMIN_DEBUG_ENABLED=true; always
 * requires Basic Auth against ADMIN_DEBUG_PASSWORD (fails closed if unset).
 */

function maskName(first: string, last: string): string {
  const m = (s: string) => (s ? `${s[0]}***` : '')
  return `${m(first)} ${m(last)}`.trim()
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local[0] ?? ''}***@${domain[0] ?? ''}***`
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function authorized(req: Request): boolean {
  const expected = process.env.ADMIN_DEBUG_PASSWORD
  if (!expected) return false // fail closed
  const header = req.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return false
  let decoded: string
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  } catch {
    return false
  }
  const password = decoded.slice(decoded.indexOf(':') + 1)
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: Request) {
  if (process.env.VERCEL_ENV === 'production' && process.env.ADMIN_DEBUG_ENABLED !== 'true') {
    return new Response(null, { status: 404 })
  }
  if (!authorized(req)) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="NJS Aiosell Debug"',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }

  const db = getDb()
  const [events, logs, bookingRows] = await Promise.all([
    db.select().from(webhookEvents).orderBy(desc(webhookEvents.id)).limit(20),
    db.select().from(syncLogs).orderBy(desc(syncLogs.id)).limit(20),
    db.select().from(bookings).orderBy(desc(bookings.id)).limit(10),
  ])

  const eventRows = events
    .map(
      (e) => `<tr><td>${e.id}</td><td>${esc(e.eventType)}</td><td>${esc(
        e.receivedAt.toISOString()
      )}</td><td>${e.processed ? 'yes' : 'no'}</td><td>${esc(
        (e.processingError ?? '').slice(0, 160)
      )}</td></tr>`
    )
    .join('')

  const logRows = logs
    .map(
      (l) => `<tr><td>${l.id}</td><td>${esc(l.operation)}</td><td>${esc(
        l.bookingId ?? '—'
      )}</td><td>${l.attempt}</td><td>${l.httpStatus ?? '—'}</td><td>${
        l.success ? 'yes' : 'no'
      }</td><td>${esc((l.error ?? '').slice(0, 160))}</td><td>${esc(
        l.createdAt.toISOString()
      )}</td></tr>`
    )
    .join('')

  const bookingRowsHtml = bookingRows
    .map(
      (b) => `<tr><td>${esc(b.bookingId)}</td><td>${esc(
        maskName(b.guestFirstName, b.guestLastName)
      )}</td><td>${esc(maskEmail(b.guestEmail))}</td><td>${esc(b.checkin)} → ${esc(
        b.checkout
      )}</td><td>${esc(b.status)}</td><td>${esc(b.syncStatus)}</td><td>${esc(
        b.cmBookingId ?? '—'
      )}</td><td>${b.pushAttempts}</td></tr>`
    )
    .join('')

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>NJS × Aiosell — Debug</title>
<style>
body{font-family:ui-monospace,Consolas,monospace;font-size:13px;margin:2rem;color:#14213d}
h1{font-size:16px}h2{font-size:14px;margin-top:2rem}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #cbd5e1;padding:4px 8px;text-align:left;vertical-align:top}
th{background:#f1f5f9}
</style></head><body>
<h1>NJS Royale × Aiosell — integration debug</h1>
<p>Environment: ${esc(process.env.VERCEL_ENV ?? 'local')} · Generated: ${esc(
    new Date().toISOString()
  )}</p>
<h2>Last 20 inbound webhook events</h2>
<table><tr><th>id</th><th>type</th><th>received</th><th>processed</th><th>error</th></tr>${
    eventRows || '<tr><td colspan="5">none</td></tr>'
  }</table>
<h2>Last 20 outbound sync attempts</h2>
<table><tr><th>id</th><th>op</th><th>booking</th><th>attempt</th><th>http</th><th>ok</th><th>error</th><th>at</th></tr>${
    logRows || '<tr><td colspan="8">none</td></tr>'
  }</table>
<h2>Last 10 bookings (guest identifiers masked)</h2>
<table><tr><th>booking</th><th>guest</th><th>email</th><th>stay</th><th>status</th><th>sync</th><th>cmBookingId</th><th>push attempts</th></tr>${
    bookingRowsHtml || '<tr><td colspan="8">none</td></tr>'
  }</table>
</body></html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    },
  })
}
