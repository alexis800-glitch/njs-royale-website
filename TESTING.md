# Aiosell Integration — Testing Guide (Phase 1: webhook receiver)

Phase 1 covers the inbound webhook receiver only. Reservation push, FETCH
reconciliation, dev routes, and `/admin/debug` arrive in Phase 2 — their test
steps will be added here then.

## Prerequisites

1. `cp .env.example .env.local` and set `DATABASE_URL` to your Neon sandbox
   database (plus `AIOSELL_HOTEL_CODE`). **Never commit `.env.local`.**
2. Apply the schema: `npm run db:migrate`
3. Seed rooms + rate plans: `npm run db:seed`
   (set `AIOSELL_RATEPLAN_SET=support` in `.env.local` and re-run to switch
   to the support-provided code set)
4. Start the app: `npm run dev`

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
