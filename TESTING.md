# Aiosell Integration — Testing Guide

Part A covers the Phase 1 inbound webhook receiver. Part B covers the
Phase 2 outbound integration (reservation push, retry, FETCH, dev routes,
`/admin/debug`).

## Prerequisites

1. `cp .env.example .env.local` and set `DATABASE_URL` to your Neon sandbox
   database, `AIOSELL_HOTEL_CODE`, `AIOSELL_USERNAME`/`AIOSELL_PASSWORD`
   (sandbox Basic Auth), `DEV_SECRET`, and `ADMIN_DEBUG_PASSWORD`.
   **Never commit `.env.local`.**
2. Apply the schema: `npm run db:migrate`
3. Seed rooms + rate plans: `npm run db:seed`
   (set `AIOSELL_RATEPLAN_SET=support` in `.env.local` and re-run to switch
   to the support-provided code set)
4. Start the app: `npm run dev`

---

# Part A — Phase 1: inbound webhook receiver

Base URL below is local dev. For a Vercel preview deployment, replace
`http://localhost:3000` with the preview URL.

All four Aiosell push types go to the SAME endpoint —
`POST /api/aiosell/webhook` — and are discriminated by payload shape.

> Windows note: run these in Git Bash. In PowerShell, use `curl.exe` (not the
> `curl` alias) and keep the JSON in a file (`-d '@payload.json'`) to avoid
> quoting issues.

## 1. Inventory push

```bash
curl -s -X POST http://localhost:3000/api/aiosell/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "SANDBOX-OTA",
    "updates": [
      {
        "startDate": "2026-01-24",
        "endDate": "2026-01-26",
        "rooms": [
          { "available": 3, "roomCode": "SUITE" },
          { "available": 20, "roomCode": "EXECUTIVE" }
        ]
      }
    ]
  }'
```

Expected response: `{"success":true,"message":"Inventory Updated Successfully"}`

Expected data: `daily_inventory` has 3 rows per room (24th, 25th, 26th —
range expansion is INCLUSIVE), SUITE available=3, EXECUTIVE available=20.

## 2. Rates push

```bash
curl -s -X POST http://localhost:3000/api/aiosell/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "SANDBOX-OTA",
    "updates": [
      {
        "startDate": "2026-02-22",
        "endDate": "2026-02-24",
        "rates": [
          { "roomCode": "EXECUTIVE", "rate": 1749.0, "rateplanCode": "EXECUTIVE-S-101" },
          { "roomCode": "SUITE", "rate": 2849.0, "rateplanCode": "SUITE-D-101" }
        ]
      }
    ]
  }'
```

Expected response: `{"success":true,"message":"Rates Updated Successfully"}`

Expected data: `daily_rates` has 3 rows per rate plan (Feb 22–24) with the
pushed rate.

## 3. Inventory restrictions push

Rooms carry `available` PLUS a `restrictions` object — both
`daily_inventory` AND `room_restrictions` must update.

```bash
curl -s -X POST http://localhost:3000/api/aiosell/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "SANDBOX-OTA",
    "updates": [
      {
        "startDate": "2026-01-24",
        "endDate": "2026-01-26",
        "rooms": [
          {
            "available": 3,
            "roomCode": "SUITE",
            "restrictions": {
              "stopSell": false,
              "exactStayArrival": null,
              "maximumStayArrival": null,
              "minimumAdvanceReservation": null,
              "minimumStay": 1,
              "closeOnArrival": false,
              "minimumStayArrival": null,
              "maximumStay": null,
              "maximumAdvanceReservation": null,
              "closeOnDeparture": false
            }
          }
        ]
      }
    ]
  }'
```

Expected response: `{"success":true,"message":"Inventory Updated Successfully"}`

Expected data: `room_restrictions` has 3 SUITE rows with `minimum_stay = 1`,
and `daily_inventory` SUITE rows show `available = 3`.

## 4. Rate restrictions push

Rates entries carry `roomCode` + `rateplanCode` + `restrictions` and NO
`rate` field.

```bash
curl -s -X POST http://localhost:3000/api/aiosell/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "SANDBOX-OTA",
    "updates": [
      {
        "startDate": "2026-02-22",
        "endDate": "2026-02-24",
        "rates": [
          {
            "roomCode": "EXECUTIVE",
            "rateplanCode": "EXECUTIVE-S-101",
            "restrictions": {
              "stopSell": true,
              "minimumStay": 2,
              "maximumStay": null,
              "closeOnArrival": false,
              "closeOnDeparture": false,
              "minimumStayArrival": null,
              "maximumStayArrival": null,
              "exactStayArrival": null,
              "minimumAdvanceReservation": null,
              "maximumAdvanceReservation": null
            }
          }
        ]
      }
    ]
  }'
```

Expected response: `{"success":true,"message":"Rates Updated Successfully"}`

Expected data: `rateplan_restrictions` has 3 rows for EXECUTIVE-S-101 with
`stop_sell = true`, `minimum_stay = 2`.

## 5. Range expansion check

Send start/end 3 days apart and confirm 4 rows (inclusive):

```bash
curl -s -X POST http://localhost:3000/api/aiosell/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "SANDBOX-OTA",
    "updates": [
      {
        "startDate": "2026-03-01",
        "endDate": "2026-03-04",
        "rooms": [{ "available": 5, "roomCode": "EXECUTIVE" }]
      }
    ]
  }'
```

Verify in SQL: `SELECT date, available FROM daily_inventory di JOIN rooms r
ON r.id = di.room_id WHERE r.room_code = 'EXECUTIVE' AND date BETWEEN
'2026-03-01' AND '2026-03-04' ORDER BY date;` → 4 rows (Mar 1, 2, 3, 4).

## 6. Behaviour checks

- **Idempotency / replay:** re-send any payload above — row counts must not
  change (pure upserts), only `updated_at` moves.
- **Unknown codes:** send `"roomCode": "PENTHOUSE"` — response is still
  `success: true`, the row is skipped, and the `webhook_events` row records
  the warning in `processing_error`.
- **Case-insensitive codes:** send `"roomCode": "suite"` (lowercase) — must
  match the seeded `SUITE` room.
- **Raw logging:** every request above (including malformed JSON) must appear
  in `webhook_events` with the full payload and headers, `event_type`
  correctly classified.
- **Malformed JSON:** `curl -s -X POST http://localhost:3000/api/aiosell/webhook -H "Content-Type: application/json" -d 'not-json'`
  → still HTTP 200, event stored with `event_type = 'unknown'` and the parse
  error in `processing_error`.

## Inspecting the data

Use Neon's SQL editor, `psql`, or `npx drizzle-kit studio` to inspect
`webhook_events`, `daily_inventory`, `daily_rates`, `room_restrictions`,
and `rateplan_restrictions`.

---

# Part B — Phase 2: outbound integration

All `/api/dev/*` routes require the `x-dev-secret` header (matching
`DEV_SECRET` in `.env.local`) and are hard-disabled in Production. Set a
shell variable first:

```bash
DEV="x-dev-secret: <value of DEV_SECRET>"
```

> ⚠️ Steps B2, B5–B10, and B12 make GENUINE outbound calls to the Aiosell
> sandbox. Do not run them without explicit approval to contact Aiosell.
> Steps B1, B3, B4, B11, and B13 are local/Neon-only.

## Setup: seed bookable mirror data (local only)

The test stay below is 2026-09-10 → 2026-09-12 on SUITE-D-101. Give it
inventory and rates via the webhook (steps A1/A2 style):

```bash
curl -s -X POST http://localhost:3000/api/aiosell/webhook \
  -H "Content-Type: application/json" \
  -d '{"hotelCode":"SANDBOX-OTA","updates":[{"startDate":"2026-09-01","endDate":"2026-09-30","rooms":[{"available":3,"roomCode":"SUITE"},{"available":10,"roomCode":"EXECUTIVE"}]}]}'

curl -s -X POST http://localhost:3000/api/aiosell/webhook \
  -H "Content-Type: application/json" \
  -d '{"hotelCode":"SANDBOX-OTA","updates":[{"startDate":"2026-09-01","endDate":"2026-09-30","rates":[{"roomCode":"SUITE","rate":75000.0,"rateplanCode":"SUITE-D-101"},{"roomCode":"EXECUTIVE","rate":45000.0,"rateplanCode":"EXECUTIVE-S-101"}]}]}'
```

## B1. Local booking exists BEFORE any push (local only)

```bash
curl -s -X POST http://localhost:3000/api/dev/test-booking \
  -H "Content-Type: application/json" -H "$DEV" \
  -d '{"guestFirstName":"Test","guestLastName":"Guest","guestEmail":"test@example.com","guestPhone":"08000000000","checkin":"2026-09-10","checkout":"2026-09-12","rateplanCode":"SUITE-D-101","adults":2,"skipPush":true}'
```

Expected: `{"created":"NJS-…","pushed":false,…}`. In SQL: the booking row
exists with `status='paid'`, `sync_status='not_pushed'`, `push_attempts=0`,
`nightly_prices` holding two nights at the mirrored rate. `sync_logs` has
NO new row (nothing was sent).

## B2. Successful book push (OUTBOUND)

Same command without `skipPush`:

```bash
curl -s -X POST http://localhost:3000/api/dev/test-booking \
  -H "Content-Type: application/json" -H "$DEV" \
  -d '{"guestFirstName":"Test","guestLastName":"Guest","guestEmail":"test@example.com","guestPhone":"08000000000","checkin":"2026-09-10","checkout":"2026-09-12","rateplanCode":"SUITE-D-101","adults":2}'
```

Expected: `pushed:true`, `syncStatus:"synced"`. Verify: booking row has
`sync_status='synced'`; the reservation appears in the Aiosell sandbox
dashboard; the pushed payload (in `sync_logs.request_payload`) contains NO
`cmBookingId` key; `bookingId` is the NJS reference.

## B3. Inventory / stop-sell / minimum-stay / rate enforcement (local only)

Each must be rejected with HTTP 409 **before** any booking row is created
(confirm `bookings` count is unchanged and `sync_logs` gets no row):

```bash
# a) no availability: first push available=0 for a date range, then try to book it
curl -s -X POST http://localhost:3000/api/aiosell/webhook -H "Content-Type: application/json" \
  -d '{"hotelCode":"SANDBOX-OTA","updates":[{"startDate":"2026-10-01","endDate":"2026-10-05","rooms":[{"available":0,"roomCode":"SUITE"}]}]}'
curl -s -X POST http://localhost:3000/api/dev/test-booking -H "Content-Type: application/json" -H "$DEV" \
  -d '{"guestFirstName":"T","guestLastName":"G","guestEmail":"t@e.com","guestPhone":"080","checkin":"2026-10-01","checkout":"2026-10-03","rateplanCode":"SUITE-D-101","adults":2}'
# → 409, reasons include "No availability on 2026-10-01 (available=0)"

# b) stop-sell: push stopSell=true for the stay dates (rate restrictions, A4 style), then book
# → 409, reasons include "Stop-sell (rate plan) on …"

# c) minimum stay: push minimumStay=3 on the arrival date, then book a 2-night stay
# → 409, reasons include "Minimum stay is 3 night(s); requested 2"

# d) missing rates: book dates outside any rates push
# → 409, reasons include "No rate for …"
```

## B4. Dev-route security (local only)

- Omit the `x-dev-secret` header → HTTP 401.
- Wrong secret → HTTP 401.
- Secret in query string only (`?secret=…`) → HTTP 401 (headers only).

## B5. Duplicate bookingId behaviour (OUTBOUND)

Aiosell confirmed duplicates are rejected; capture the actual response.
Retry a booking that is already `synced` — the route refuses (409). To force
a true duplicate, use the retry route after manually setting the synced
booking back to `sync_failed` in SQL, then:

```bash
curl -s -X POST http://localhost:3000/api/dev/retry-push/NJS-XXXXXXXX-XXXXXX \
  -H "Content-Type: application/json" -H "$DEV" -d '{"action":"book"}'
```

Expected: push fails or Aiosell answers idempotently; NO second reservation
in the sandbox dashboard. Document the exact response body (from
`sync_logs.response_payload`) in the plan doc (§7 Q3).

## B6. Stored cmBookingId (OUTBOUND — inspect B2's result)

After B2: `SELECT cm_booking_id FROM bookings WHERE booking_id='NJS-…';`
must hold the Aiosell-generated value if their response carried one, else
NULL — never our own NJS reference.

## B7. Failed push preserves the booking (simulated outbound)

Temporarily set `AIOSELL_BASE_URL=http://127.0.0.1:9` in `.env.local`,
restart dev, create a booking (B2 command). Expected: `pushed:false`,
`syncStatus:"sync_failed"`; the booking row still exists with
`status='paid'`, `last_push_error` set, `push_attempts=3` (short retries
only — 0s/1s/3s); one `sync_logs` row per attempt. Restore
`AIOSELL_BASE_URL` afterwards.

## B8. Manual retry (OUTBOUND)

With the correct `AIOSELL_BASE_URL` restored and dev restarted:

```bash
curl -s -X POST http://localhost:3000/api/dev/retry-push/NJS-XXXXXXXX-XXXXXX \
  -H "Content-Type: application/json" -H "$DEV"
```

Expected: the B7 booking pushes successfully (`syncStatus:"synced"`), same
NJS `bookingId` (idempotency key unchanged across retries).

## B9. Modify (OUTBOUND)

```bash
curl -s -X POST http://localhost:3000/api/dev/modify-booking/NJS-XXXXXXXX-XXXXXX \
  -H "Content-Type: application/json" -H "$DEV" \
  -d '{"checkin":"2026-09-11","checkout":"2026-09-13"}'
```

Expected: mirror re-validated for the new dates first; push uses
`action:"modify"` with the SAME `bookingId`; dashboard shows updated dates.
Document whether modify accepted the date change (plan doc §7 Q11).

## B10. Cancel (OUTBOUND)

```bash
curl -s -X POST http://localhost:3000/api/dev/cancel-booking/NJS-XXXXXXXX-XXXXXX \
  -H "Content-Type: application/json" -H "$DEV"
```

Expected: booking flips to `status='cancelled'` locally FIRST, then the
cancel push runs; dashboard shows the cancellation; watch for Aiosell
pushing restored inventory back to the webhook.

## B11. Admin debug view (local only)

Open `http://localhost:3000/admin/debug` — browser prompts for Basic Auth
(any username, `ADMIN_DEBUG_PASSWORD`). Verify: webhook events, sync
attempts, and bookings render; guest names/emails are MASKED (`T*** G***`,
`t***@e***`); response carries `X-Robots-Tag: noindex`. Wrong/no password →
401. With `VERCEL_ENV=production` and `ADMIN_DEBUG_ENABLED` unset → 404.

## B12. FETCH reconciliation (OUTBOUND)

```bash
curl -s -X POST http://localhost:3000/api/dev/fetch-sync \
  -H "Content-Type: application/json" -H "$DEV" \
  -d '{"type":"inventory","startDate":"2026-09-01","endDate":"2026-09-14"}'
# repeat with "type":"rates", then "type":"reservations"
```

Expected: inventory/rates responses flow through the same mapper as the
webhook (`rowsUpserted` > 0, mirror rows match); `reservations` returns a
`capturedShape` summary only — document the real schema from
`sync_logs.response_payload` in the plan doc (§6a), nothing applied.

## B13. Sync log redaction (local only — inspect after any outbound step)

```sql
SELECT id, operation, request_payload::text || response_payload::text AS blob
FROM sync_logs;
```

No row may contain an Authorization header, password, secret, token, or
connection string. Keys matching those names appear as `"[REDACTED]"`.
