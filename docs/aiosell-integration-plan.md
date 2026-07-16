# NJS Royale × Aiosell — Channel Manager Integration Plan

> **Status: Phase 1 implemented and verified (2026-07-10). Phase 2 (outbound
> reservation push, FETCH reconciliation, dev routes, admin debug) approved
> 2026-07-11 — sandbox scope only. Production booking logic remains gated on
> the blocking Open Questions in §7.**
>
> **Sandbox push PROVEN WORKING (2026-07-14): booking
> `NJS-20260714-FU4VDF` was accepted with HTTP 200 using endpoint partner
> path `/push/sample-ota` and payload `hotelCode: sandbox-ota`. This is the
> proven configuration of record — do not change it without a written
> Aiosell instruction that names the endpoint path explicitly.**
>
> **Identifier disambiguation (2026-07-16).** Aiosell's message "You need
> to use only sandbox-ota partner id" is ambiguous and conflicts with the
> proven endpoint path. Four identifiers must not be conflated:
> 1. **Endpoint partner/channel ID** (URL path segment) — proven working:
>    `sample-ota`.
> 2. **Payload `hotelCode`** — proven working: `sandbox-ota` (this also
>    resolves the §7 Q7a docs-vs-support conflict empirically).
> 3. **Dashboard property identifier** — unknown / TBC.
> 4. Aiosell did **NOT** explicitly instruct changing the endpoint from
>    `/push/sample-ota` to `/push/sandbox-ota`; their wording most
>    plausibly refers to the hotel code (identifier 2). Clarification
>    requested before any endpoint change.
>
> **Reservations FETCH (2026-07-16): intentionally unsupported by Aiosell
> and no longer required for reconciliation** — reservations are push-only;
> the push response plus `sync_logs` is the verification mechanism.
>
> **Credentials policy:** No usernames, passwords, tokens, or API secrets may
> ever appear in this repository — not in this document, not in code, not in
> commits, not in `sync_logs` or any other log table. Sandbox and production
> credentials live only in `.env.local` (gitignored) and in Vercel
> environment variables.

Reference: Aiosell REST API Documentation — OTA/Booking Engine to Channel
Manager (support.aiosell.com knowledge base), plus written answers from
Aiosell (2026-07-10).

---

## 1. Integration model in plain English

In Aiosell's model, the NJS Royale website acts as an **"OTA"** — a private
sales channel alongside Booking.com, Expedia, etc.

- **Aiosell → website (push):** rate changes, availability changes, and
  booking restrictions are POSTed by Aiosell to the single endpoint **we
  host** and register with them. We mirror this data into our own database
  (the "Neon mirror"). Availability is **always read from this local
  mirror — never from Aiosell in real time.**
- **Website → Aiosell (push):** guest bookings are POSTed to Aiosell with
  `action: "book"` (also `"modify"` / `"cancel"`). Aiosell then decrements
  availability across all other channels.
- **Website → Aiosell (pull):** a FETCH API returns current inventory and
  rates (and reservations — schema undocumented, see §6a) on demand — used
  for reconciliation so a missed push can never permanently corrupt our
  mirror.

### Core invariants (non-negotiable)

1. **Mirror-first reads.** Availability, restrictions, and rates are read
   from the Neon mirror only.
2. **Local booking first.** The local booking row is created and persisted
   **before** any push to Aiosell. A failed push must never delete or lose a
   local booking.
3. **NJS reference is primary.** The guest-facing NJS booking reference
   (`NJS-{YYYYMMDD}-{6 alphanumeric}`) is generated locally and used as the
   Aiosell `bookingId` and as the idempotency key.
4. **`cmBookingId` is secondary only.** It is **omitted unconditionally on
   new bookings** (Aiosell confirmed 2026-07-10 that their CM generates it).
   The value Aiosell returns is stored as a secondary reference only. An
   earlier draft's fallback — "send our bookingId as cmBookingId if omission
   is rejected" — is **rejected**: it would conflate the two identifiers.
5. **Payment before production push.** In production, a reservation is
   pushed to Aiosell **only after payment is confirmed** (`status = paid`).
   The push service enforces this structurally. (Sandbox test bookings are
   created directly at `paid`, since payment integration is out of scope.)

---

## 2. Endpoint map

### 2.1 Inbound — endpoint we expose (Aiosell calls us)

> **Correction (2026-07-10, implemented in Phase 1):** an earlier draft of
> this plan specified four separate inbound routes. Per the official Aiosell
> OTA docs, Aiosell POSTs **all four update types to the single base URL**
> registered with them, so we expose **one** receiver and discriminate by
> payload shape.

**`POST /api/aiosell/webhook`** — must respond
`{ "success": true, "message": "..." }` and be idempotent (pure upserts), so
replays are harmless. Every call is written to `webhook_events` (raw payload
+ headers) before processing; processing failures are recorded there and
still acknowledged with HTTP 200.

Payload-shape discrimination:

| Shape | Type | Action |
|---|---|---|
| `updates[].rooms[]`, no `restrictions` key | inventory | Upsert availability per (roomCode, date) |
| `updates[].rooms[]` with `restrictions {}` | inventory_restrictions | Upsert room-level restrictions per (roomCode, date) — payload also carries `available`, so inventory is upserted too |
| `updates[].rates[]` with a `rate` field | rates | Upsert nightly rate per (rateplanCode, date) |
| `updates[].rates[]` with `restrictions {}`, no rate | rate_restrictions | Upsert rateplan-level restrictions per (rateplanCode, date) |

Date ranges (`startDate` → `endDate`) are expanded **inclusively**, one row
per day. Room and rateplan codes are matched case-insensitively; unknown
codes are skipped and logged, never a 500.

Restriction object fields (both restriction endpoints):
`stopSell` (bool), `minimumStay` (int), `maximumStay`, `closeOnArrival` (bool),
`closeOnDeparture` (bool), `minimumAdvanceReservation`,
`maximumAdvanceReservation`, `exactStayArrival`, `minimumStayArrival`,
`maximumStayArrival` (nullable unless set).

Security on inbound endpoints: **Aiosell confirmed (2026-07-10) that Basic
Auth is supported** on the webhook. Not enforced in the Phase 1/2 sandbox
receiver — enforcement must be configured **together with** the Vercel
Protection path exception at the moment the endpoint is registered with
Aiosell, so the path is never exposed unauthenticated. Credentials via
environment variables only, plus `hotelCode` validation (currently
log-and-process; tighten to hard reject before production).

### 2.2 Outbound — endpoints we call

| Aiosell endpoint | Purpose |
|---|---|
| `POST {AIOSELL_BASE_URL}/api/v2/cm/push/{AIOSELL_PARTNER_ID}` *(sandbox partner path PROVEN `sample-ota` on 2026-07-14 with payload `hotelCode: sandbox-ota`; Aiosell's 2026-07-16 "use only sandbox-ota partner id" is unconfirmed for the endpoint path — see header disambiguation; production partner ID WILL change, exact value TBC)* | Send reservation: `action` = `book` / `modify` / `cancel` |
| `POST {AIOSELL_BASE_URL}/api/v2/cm/data/{AIOSELL_PARTNER_ID}` | FETCH `{ "type": "inventory" \| "rates" \| "reservation", "hotelCode": ... }` — **reservation FETCH is disabled by Aiosell (2026-07-16, intentional — do not use); inventory/rates FETCH retained for reconciliation** |

All outbound calls use HTTP Basic Auth (`AIOSELL_USERNAME` /
`AIOSELL_PASSWORD` from environment variables). The Authorization header is
**never** written to `sync_logs` or console output.

### 2.3 Reservation payload (website → Aiosell)

Root fields: `action`, `hotelCode`, `channel`, `bookingId` (**our NJS
reference — idempotency key**), `bookedOn` (`YYYY-MM-DD HH:MM:SS`, Africa/
Lagos local time — timezone semantics to be confirmed with Aiosell, §7 Q14),
`checkin`, `checkout` (`YYYY-MM-DD`), `segment`, `specialRequests`, `pah`
(bool).

- `cmBookingId` is **not sent** on new bookings (see invariant 4).
- `amount {}`: `amountAfterTax`, `amountBeforeTax`, `tax`, `currency`,
  `commission`, `tcs`, `tds`. Sandbox uses `tax/tcs/tds/commission = 0`
  (Aiosell confirmed 0 is acceptable for sandbox); production NGN tax
  handling is a blocking open question (§7 Q6) — no tax rule is invented.
- `guest {}`: `firstName`, `lastName`, `email`, `phone`,
  `address { line1, city, state, country, zipCode }`
- `rooms []`: `roomCode`, `rateplanCode`, `guestName`,
  `occupancy { adults, children }`, `prices [] { date, sellRate }` — one
  entry per night (checkout date excluded), derived from the `daily_rates`
  mirror, and summing consistently with the `amount` fields.

Cancel requires only: `action`, `hotelCode`, `channel`, `bookingId`.

Success responses: `{ "success": true, "message": "Reservation Updated /
Modified / Cancelled Successfully" }`. Any `cmBookingId` found in a response
is stored on the booking as the secondary reference. The **error contract is
undocumented** — every non-success response is captured verbatim (redacted)
in `sync_logs` and documented as evidence accumulates.

Observed evidence (2026-07-11, first controlled sandbox booking):
**authentication failures return HTTP 400 — not 401 — with body
`{ "message": "Authentication Required!", "success": false }`.** The failure
occurs **before hotel-code validation**, so it provides no evidence either
way on the SANDBOX-OTA vs sandbox-pms question (§7 Q7a).

Resolution (2026-07-14): a subsequent controlled push **succeeded with
HTTP 200** — booking `NJS-20260714-FU4VDF`, endpoint partner path
`sample-ota`, payload `hotelCode: sandbox-ota`. This is the proven
configuration of record. The exact cause of the 2026-07-11 rejection was
never confirmed by Aiosell; their 2026-07-15 "channel is disabled" remark
referred to the reservations FETCH channel, not the push.

**Verified against database records (2026-07-16)** — booking row +
`sync_logs` id 3 for `NJS-20260714-FU4VDF`:

- `sync_logs`: operation `book`, attempt **1**, `http_status` **200**,
  `success: true`, `error: null`; request payload `hotelCode:
  "sandbox-ota"`, `channel: "NJSResortWebsite"` (logged 2026-07-13
  23:48 UTC = 2026-07-14 00:48 Africa/Lagos, matching the booking
  reference date).
- Booking row: `status = paid`, `sync_status = synced`,
  `push_attempts = 1`, `last_push_error = null`.
- **No `cmBookingId` was returned** — the response body contains none and
  `cm_booking_id` remains **NULL** (secondary reference simply absent; the
  NJS reference is the only identifier, consistent with invariant 3).
- Observed success-response shape (differs from the docs' plain-string
  message): `{ "success": true, "message": [ { "action": "book",
  "hotelId": "sandbox-ota", "bookingId": "NJS-20260714-FU4VDF" } ] }` —
  `message` is an **array of objects**, and Aiosell labels the property
  identifier **`hotelId`**, echoing our payload `hotelCode`. This supports
  reading their "use only sandbox-ota partner id" (2026-07-16) as the
  hotel identifier, not the endpoint path.
- The endpoint URL is by design not persisted in `sync_logs`; the
  `sample-ota` partner path is attested by the environment configuration,
  which has remained on `sample-ota` since the successful test.

Duplicate `bookingId`: Aiosell confirmed a duplicate is **rejected**, so
retries with the same `bookingId` cannot double-book.

---

## 3. Database schema — as implemented (Drizzle + Neon Postgres)

Phase 1 tables (migration `0000`, live in the Neon sandbox):

```
rooms                one row per room type
  id serial PK, room_code text UNIQUE, name, active bool, timestamps

rate_plans           one row per rate plan, FK to rooms
  id serial PK, rateplan_code text UNIQUE, room_id FK, label,
  active bool, timestamps
  -- BOTH code sets are seeded (docs: EXECUTIVE-S-101…, support:
  -- executive-s-ep…); AIOSELL_RATEPLAN_SET picks the active set.

daily_rates          nightly rate mirror
  id, rate_plan_id FK, date, rate numeric(12,2), currency default 'NGN',
  updated_at, UNIQUE(rate_plan_id, date)

daily_inventory      availability mirror
  id, room_id FK, date, available int, updated_at, UNIQUE(room_id, date)

room_restrictions    room-level restrictions mirror
  id, room_id FK, date, stop_sell, minimum_stay, maximum_stay,
  close_on_arrival, close_on_departure, minimum_stay_arrival,
  maximum_stay_arrival, exact_stay_arrival, minimum_advance_reservation,
  maximum_advance_reservation, updated_at, UNIQUE(room_id, date)

rateplan_restrictions  same columns, keyed on rate_plan_id,
  UNIQUE(rate_plan_id, date)

bookings             local reservation record (single-room — see limitation)
  id serial PK,
  booking_id text UNIQUE      -- NJS-{YYYYMMDD}-{6 alnum}; guest-facing
                              -- confirmation, Aiosell bookingId,
                              -- idempotency key
  cm_booking_id text NULL     -- secondary Aiosell reference only
  guest_* (name/email/phone/address), checkin, checkout,
  room_id FK, rate_plan_id FK, adults, children,
  amount_before_tax, tax, amount_after_tax, currency default 'NGN',
  special_requests,
  status text                 -- business lifecycle:
                              --   pending_payment | paid | cancelled
  sync_status text            -- Aiosell mirror state (Phase 2):
                              --   not_pushed | sync_pending | synced |
                              --   sync_failed
  push_attempts int, last_push_error text, aiosell_response jsonb,
  nightly_prices jsonb        -- [{ date, sellRate }]
  timestamps

webhook_events       inbound audit log (raw payload persisted pre-parse)
  id, event_type, raw_payload jsonb, headers jsonb, processed bool,
  processing_error text, received_at
```

Phase 2 additions (migration `0001`):

```
sync_logs            outbound audit log — EVERY call we make to Aiosell
  id serial PK,
  booking_id text NULL        -- NJS reference; NULL for FETCH operations
  operation text              -- book | modify | cancel | fetch_inventory |
                              --   fetch_rates | fetch_reservations
  attempt int,
  request_payload jsonb       -- Authorization header NEVER included
  response_payload jsonb      -- redacted
  http_status int NULL        -- NULL on network-level failure
  success bool, error text NULL, created_at
```

`bookings` state model (Phase 2 rework): the Phase 1 `push_status` column is
**dropped** and replaced by the two-axis model above. The two axes together
distinguish all required states — including "cancelled locally but the
cancel push failed" (`status = cancelled`, `sync_status = sync_failed`).
The push service refuses to push any booking whose `status` is not `paid`
(book/modify) or `cancelled` (cancel) — this is how invariant 5 is enforced
in code rather than by convention.

### Known limitation — single-room bookings (sandbox scope)

The implemented `bookings` table models **one room / one rate plan per
booking**, although Aiosell's payload technically carries a `rooms[]` array.
This is a deliberate sandbox simplification. Multi-room bookings, separate
guest records, and payment records are part of the future production design
below and require a schema extension before production launch.

### Future production design (not implemented — reference only)

Retained from the original plan for the production build-out: normalized
`guests` table; `reservations` with multi-room `reservation_rooms` and
per-night `reservation_room_prices`; `payments` (Paystack/Stripe provider
refs, signature-verified webhooks); richer reservation status including
refund states. This design is **not** part of Phase 2 and must be
re-approved before implementation.

---

## 4. Booking flow

Production flow (target — payment integration itself is out of scope until
separately approved):

```
GUEST                    WEBSITE / DB                           AIOSELL
  |                            |                                   |
  |  (background, continuous)  |<-- POST inventory/rates/restrictions
  |                            |    upsert Neon mirror              |
  |                            |                                   |
  |-- search dates ----------->|                                   |
  |                            | read LOCAL mirror only            |
  |<- rooms, rates, rules -----|  (inventory, stopSell, minStay)   |
  |                            |                                   |
  |-- select room, guest info->|                                   |
  |                            | create booking row                |
  |                            |   status = pending_payment        |
  |                            |   sync_status = not_pushed        |
  |                            |   booking_id = NJS-…  (generated) |
  |                            | RE-CHECK mirror availability      |
  |                            |                                   |
  |-- pay ------------------->|                                   |
  |                            |<-- payment confirmed              |
  |                            |   status = paid                   |
  |                            |                                   |
  |                            | sync_status = sync_pending        |
  |                            |-- POST action:"book" ------------>|
  |                            |   (bookingId = NJS ref,           |
  |                            |    cmBookingId omitted)           |
  |                            |<-- {success:true, cmBookingId?} --|
  |                            |   store cm_booking_id (secondary) |
  |                            |   sync_status = synced            |
  |                            |<-- inventory push (updated) ------|
```

Sandbox flow (Phase 2): identical from "create booking row" onward, except
the dev test-booking route creates the row directly at `status = paid`
(payments out of scope) **after validating the Neon mirror** for inventory,
stop-sell, minimum stay, and the presence of a rate for every night.

### Failure handling

| Scenario | Handling |
|---|---|
| Duplicate booking | `booking_id` UNIQUE constraint locally; Aiosell rejects duplicate `bookingId` (confirmed). Retries always reuse the same `bookingId`. |
| Aiosell push to us fails / site briefly down | Inbound pushes are idempotent upserts; recovery via FETCH reconciliation (on-demand in Phase 2; scheduled cron deferred, see §5). All received calls audited in `webhook_events`. |
| Payment confirmed, Aiosell "book" push fails | Guest keeps their NJS confirmation. Short immediate retries only (serverless-safe — no long sleeps); on exhaustion `sync_status = sync_failed`, booking preserved, every attempt in `sync_logs`. Manual retry via protected dev route; scheduled retry job deferred. **Invariant: never lose a paid booking.** |
| Aiosell accepted, payment failed | Structurally prevented — the push service refuses bookings not in `paid`. (Compensating action if flow ever changes: `action:"cancel"`.) |
| Inventory mismatch | (1) mirror re-check at booking creation, (2) FETCH reconcile, (3) optional admin-set sell buffer (production, TBC). |
| Cancellation / modification | Cancel: `status = cancelled` locally first, then push `action:"cancel"`; a failed cancel push shows as `cancelled` + `sync_failed` for manual retry. Modify: re-validate the mirror for the new dates before pushing `action:"modify"` with the same `bookingId`. |

---

## 5. Architecture

- **Frontend:** existing Next.js site; no public booking UI in Phase 2. Any
  future booking UI reads only the local mirror.
- **API routes (Vercel functions):**
  - `app/api/aiosell/webhook` — single inbound receiver (§2.1), Phase 1.
  - `app/api/dev/*` — Phase 2 development routes (below).
  - `app/admin/debug` — Phase 2 debug view (below).
- **Outbound services:** `lib/aiosell/aiosellClient.ts` (Basic Auth fetch
  wrapper + redaction + `sync_logs` writer), `lib/aiosell/pushReservation.ts`
  (book/modify/cancel), `lib/aiosell/fetchSync.ts` (FETCH reconciliation),
  `lib/aiosell/availability.ts` (mirror validation),
  `lib/aiosell/bookingRef.ts` (NJS reference generator).
- **Retry design:** at most short immediate retries inside a request (a few
  seconds total — **no long blocking sleeps inside Vercel functions**), then
  persist `sync_failed` and rely on the manual retry route. A scheduled
  cron retry + nightly FETCH reconciliation is **documented but deferred**
  until separately approved.
- **Dev routes (Phase 2):** `POST /api/dev/test-booking`,
  `POST /api/dev/modify-booking/[bookingId]`,
  `POST /api/dev/cancel-booking/[bookingId]`,
  `POST /api/dev/retry-push/[bookingId]`, `POST /api/dev/fetch-sync`.
  Guarded by a **header-based** secret (`x-dev-secret` must equal
  `DEV_SECRET`; never a query parameter — query strings leak into access
  logs) and **hard-disabled when `VERCEL_ENV === 'production'`**.
- **Admin debug (Phase 2):** `/admin/debug`, server-rendered by a route
  handler; HTTP Basic Auth challenge (`ADMIN_DEBUG_PASSWORD`);
  `X-Robots-Tag: noindex`; returns 404 in production unless
  `ADMIN_DEBUG_ENABLED=true`. Shows webhook health, sync attempts, and
  booking states with guest names/emails **masked** — it is a diagnostics
  view, not a PII browser.
- **Database:** Neon Postgres with Drizzle ORM (implemented). Plain
  Postgres, portable to Supabase later (swap driver; add RLS + service-role
  hygiene at that point). All database access is server-side only.
- **Payments:** out of scope until separately approved. Paystack primary
  (NGN native), Stripe optional — future design only.
- **Environment variables (Vercel + `.env.local` only, never committed):**
  `DATABASE_URL`, `AIOSELL_BASE_URL`, `AIOSELL_PARTNER_ID`,
  `AIOSELL_HOTEL_CODE`, `AIOSELL_USERNAME`, `AIOSELL_PASSWORD`,
  `AIOSELL_CHANNEL_NAME`, `AIOSELL_RATEPLAN_SET`, `DEV_SECRET`,
  `ADMIN_DEBUG_PASSWORD`, `ADMIN_DEBUG_ENABLED`.
- **Logging hygiene:** Authorization headers, passwords, and connection
  strings are never logged or stored in `sync_logs` / `webhook_events`.
  (Lesson learned 2026-07-10: an invalid-URL error path echoed a full
  connection string into runtime logs; the credential was rotated. Treat
  every log write as potentially public.)
- **Phasing:** the marketing site stays static; the booking engine remains a
  future module so the concept site's simplicity is preserved.

---

## 6. Sandbox testing checklist

Sandbox host: `live.aiosell.com`. Proven working (2026-07-14): endpoint
partner path `sample-ota`, payload `hotelCode: sandbox-ota` (resolves the
§7 Q7a docs-vs-support conflict empirically).
Sandbox credentials: **in `.env.local` only — never in this repo.**
Full curl-level detail lives in `TESTING.md`.

Phase 1 — completed 2026-07-10 (local Neon + Vercel preview):

1. [x] Single inbound receiver stood up; all 4 payload types processed
2. [x] Rates push → `daily_rates` rows match payload (ranges expanded per day)
3. [x] Inventory push → `daily_inventory` rows correct
4. [x] Inventory + rate restrictions → `stopSell` / `minimumStay` land correctly
5. [x] Replay same push twice → idempotent, no duplicates

Phase 2 — pending (gated on migration approval, then push approval):

6. [ ] Test booking created locally (mirror-validated) BEFORE any push
7. [x] `action:"book"` push → **SUCCEEDED 2026-07-14, DB-verified
   2026-07-16**: booking `NJS-20260714-FU4VDF` accepted with HTTP 200 in
   exactly **1 attempt** (endpoint partner path `sample-ota`, payload
   `hotelCode: sandbox-ota`); final state `status = paid`,
   `sync_status = synced`. **No `cmBookingId` was returned;
   `cm_booking_id` remains NULL** (see §2.3 verified evidence). History:
   the first attempt (2026-07-11) was rejected HTTP 400 "Authentication
   Required!"; exactly one attempt (4xx = definitive, no retry), local
   booking preserved as `paid`/`sync_failed`; the exact cause of that
   rejection was never confirmed by Aiosell.
8. [ ] Reservation visible in the Aiosell sandbox dashboard
9. [ ] Aiosell pushes decremented inventory back after the booking
10. [ ] Duplicate `bookingId` push → capture actual rejection response
11. [ ] Failed push (simulated) → booking preserved, `sync_failed`, manual retry succeeds
12. [ ] `action:"modify"` (date change) → observe scope of modify support
13. [ ] `action:"cancel"` → cancelled in sandbox, inventory restored
14. [ ] Invalid payload (unknown `roomCode`) → record actual error shape
15. [ ] FETCH inventory/rates → mirror updated through existing mappers
16. [~] FETCH reservations → **DROPPED 2026-07-16**: Aiosell disabled the
    reservations FETCH channel intentionally and instructed not to use it;
    push-only for reservations (§6a)
17. [ ] Inventory / stop-sell / minimum-stay enforcement rejects violating test bookings
18. [ ] `sync_logs` rows contain no Authorization header or secrets

### 6a. Reservations FETCH — intentionally unsupported (2026-07-16)

Aiosell confirmed the reservations FETCH channel is turned off
intentionally and instructed us not to use it: reservations are push-only
("reservation in"). **Reservation FETCH is no longer required for
reconciliation.** The earlier plan to capture its response schema is
dropped. `fetchSync.ts` keeps the code path but it must not be called;
reservation-state verification relies on push responses + `sync_logs`
(Aiosell has not named an alternative verification mechanism — treat the
push response as authoritative).

---

## 7. Open Questions for Aiosell — status

> **Gate: production booking logic must not be built until the remaining
> blocking items below (5 final value, 6 production handling, 7) are
> confirmed in writing by Aiosell.**
> Items marked **Answered** were confirmed by Aiosell on 2026-07-10.

1. **Authentication** — **Answered: Basic Auth is supported.** Webhook
   verification is not yet enforced — it must be enabled together with the
   Vercel Protection path exception at endpoint-registration time.
   **Re-opened 2026-07-11, resolved empirically 2026-07-14:** a successful
   push (HTTP 200, booking `NJS-20260714-FU4VDF`) proved the working
   configuration: endpoint partner path `sample-ota`, payload
   `hotelCode: sandbox-ota`. Aiosell's 2026-07-15 "channel is disabled"
   remark referred to the reservations FETCH channel (intentionally off),
   not the push. Aiosell's 2026-07-16 "use only sandbox-ota partner id" is
   ambiguous — it conflicts with the proven endpoint path and most
   plausibly refers to the hotel code; they did NOT explicitly instruct
   changing the endpoint from `/push/sample-ota` to `/push/sandbox-ota`.
   **The proven configuration stays until Aiosell confirms otherwise in
   writing, naming the endpoint path explicitly.**
2. **`cmBookingId`** — **Answered: generated by Aiosell/CM.** We omit it
   **unconditionally** on new bookings and store the returned value as a
   secondary reference only. The earlier "send bookingId as cmBookingId"
   fallback is rejected. **Observed 2026-07-14 (DB-verified 2026-07-16):
   the successful sandbox push returned NO `cmBookingId`** —
   `cm_booking_id` remains NULL on `NJS-20260714-FU4VDF`. The field is
   therefore optional in practice; our NJS reference is the working
   identifier.
3. **Idempotency** — **Answered: a duplicate `bookingId` is rejected**, so
   retries with the same `bookingId` cannot double-book. (Actual rejection
   response shape still to be captured — checklist item 10.)
4. **Error contract** — HTTP status codes and error body shapes? What
   retry/backoff does Aiosell apply when pushing to us and our endpoint is
   unreachable? *(Phase 2 captures observed shapes in `sync_logs`.)*
   **First observation (2026-07-11): auth failures use HTTP 400 with
   `success: false`, rather than 401.**
5. **Production endpoint + partner ID** — **Partially answered: the
   production partner ID WILL change from the sandbox value (proven
   `sample-ota` in the endpoint path).** Onboarding path confirmed
   2026-07-16: once the rates/inventory webhook is developed and tested
   (done — Phase 1) and a reservation push is demonstrated (done —
   2026-07-14, `NJS-20260714-FU4VDF`), Aiosell adds us as a partner with
   **a small contract**. Exact production partner ID and how our receiving
   base URL is registered still TBC. *(Blocking.)*
6. **Currency / NGN** — **Partially answered: `tcs` / `tds` can be 0 for
   sandbox.** Final production handling for a Nigerian property (VAT /
   consumption tax representation, full NGN support) still to confirm.
   *(Blocking.)*
7. **Master data** — how are `roomCode` and `rateplanCode` values provisioned
   and communicated? Is there an API to list them? *(Blocking.)*
   7a. **Hotel code conflict** — **Resolved empirically 2026-07-14:
   `sandbox-ota`** (payload `hotelCode`) was accepted on the successful
   push — neither the docs' `SANDBOX-OTA` nor support's `sandbox-pms` as
   written. Aiosell's 2026-07-16 "use only sandbox-ota partner id" is
   consistent with this reading (hotel code, not endpoint path).
8. **Initial sync** — on go-live, does Aiosell push a full 365-day snapshot,
   or do we FETCH to seed the mirror? How far ahead do updates extend?
9. **`pah` flag** — exact pay-at-hotel semantics and effects.
10. **FETCH API** — **Partially answered 2026-07-16: the reservations FETCH
    channel is disabled intentionally — do not use it.** Full response
    schemas for `type: inventory | rates` still to capture. *(Phase 2
    captures these.)*
11. **Modification scope** — can `modify` change dates/rooms, or is the
    pattern cancel + rebook? *(Checklist item 12 tests a date change.)*
12. **Rate limits / SLA** — request caps, push latency after a change,
    sandbox reset policy.
13. **Children pricing** — how are child ages / extra-bed rates represented?
14. **`bookedOn` timezone** — docs show `YYYY-MM-DD HH:MM:SS` local time
    with no timezone field. We send Africa/Lagos time; please confirm.
15. **Integration model decision (new, 2026-07-15)** — Aiosell confirmed
    two paths: (A) the hotel uses **Aiosell's booking engine** connected to
    the custom website (Aiosell handles payments), or (B) our **custom
    booking engine connects as an OTA** — the architecture this plan
    implements. The hotel must choose.
    **Option A partially answered 2026-07-16:** their booking engine CAN be
    white-labelled to our domain and branding; "the payment gateway charge
    will be 5%". **The 5% is unclarified — before presenting it to the
    hotel, Aiosell must confirm:** (a) is it payment-gateway processing
    only, Aiosell commission, or both combined; (b) is it charged on the
    room total only, or also on taxes and extras; (c) is it refunded when
    a guest booking is cancelled. (If 5% of the whole booking value: a
    ₦600,000 two-night booking costs ₦30,000 in fees.) Depth of
    customisation (fonts, room photos, guest journey) and a white-labelled
    example still unseen — the shared sample
    `be.aiosell.com/book/octave-hotel-sarjapur-rd` shows the default design.
    **Option B onboarding answered 2026-07-16:** develop and test the
    rates/inventory webhook (done — Phase 1), demonstrate a successful
    reservation push, then Aiosell adds us as a partner with a small
    contract. Note: Phase 1 (rates/inventory mirror) remains useful under
    both options.
16. **Reconciliation method (new, 2026-07-16)** — **Answered: do not use
    reservation FETCH** (channel disabled intentionally); reservations are
    push-only. No alternative verification mechanism was named — the push
    response is treated as authoritative, with `sync_logs` as our audit
    trail. Historical note: sandbox rejected plural `"reservations"` FETCH
    type with 400 "Invalid type"; singular `"reservation"` fix (2026-07-14)
    is now moot for reservations.

---

*Prepared 2026-07-06. Revised 2026-07-10: Phase 1 implemented (single
webhook receiver, Neon + Drizzle); Aiosell answers incorporated. Revised
2026-07-11: aligned to implemented schema; Phase 2 design approved (sync_logs,
two-axis booking state, outbound client, dev routes, admin debug); core
invariants and single-room limitation documented; multi-room/payments design
moved to future-production section. Revised 2026-07-16: recorded and
DB-verified the PROVEN sandbox push success of 2026-07-14
(`NJS-20260714-FU4VDF`, HTTP 200, 1 attempt, `paid`/`synced`, no
`cmBookingId` returned — `cm_booking_id` NULL; endpoint partner path
`sample-ota`, payload `hotelCode: sandbox-ota`);
disambiguated Aiosell's "use only sandbox-ota partner id" (refers to hotel
code, not the endpoint path — no explicit endpoint-change instruction was
given); reservations FETCH marked intentionally unsupported and no longer
required for reconciliation; Option A white-label confirmed but the 5%
charge needs clarification (scope, base, refunds); Option B onboarding path
confirmed (webhook + push demonstrated → partner + small contract);
integration-model decision (§7 Q15) pending with the hotel.*
