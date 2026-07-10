# NJS Royale × Aiosell — Channel Manager Integration Plan

> **Status: PLANNING ONLY — no production booking logic is to be built until the
> "Open Questions for Aiosell" section below is answered and confirmed.**
>
> **Credentials policy:** No usernames, passwords, tokens, or API secrets may
> ever appear in this repository — not in this document, not in code, not in
> commits. Sandbox and production credentials live only in `.env.local`
> (gitignored) and in Vercel environment variables.

Reference: Aiosell REST API Documentation — OTA/Booking Engine to Channel Manager
(support.aiosell.com knowledge base).

---

## 1. Integration model in plain English

In Aiosell's model, the NJS Royale website acts as an **"OTA"** — a private
sales channel alongside Booking.com, Expedia, etc.

- **Aiosell → website (push):** rate changes, availability changes, and
  booking restrictions are POSTed by Aiosell to endpoints **we host** and
  register with them. We mirror this data into our own database. The booking
  UI reads only from this local mirror — never from Aiosell in real time.
- **Website → Aiosell (push):** guest bookings are POSTed to Aiosell with
  `action: "book"` (also `"modify"` / `"cancel"`). Aiosell then decrements
  availability across all other channels.
- **Website → Aiosell (pull):** a FETCH API returns current inventory, rates,
  and reservations on demand — used for scheduled reconciliation so a missed
  push can never permanently corrupt our mirror.

Aiosell is the source of truth for availability. Payment is taken on our side
(Paystack/Stripe) **before** the reservation is pushed to Aiosell.

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

Security on inbound endpoints: **Aiosell has confirmed Basic Auth is
supported** (2026-07-10). Not enforced in the Phase 1 sandbox receiver —
pending production enforcement/configuration. Credentials via environment
variables only, plus `hotelCode` validation.

### 2.2 Outbound — endpoints we call

| Aiosell endpoint | Purpose |
|---|---|
| `POST https://live.aiosell.com/api/v2/cm/push/sample-ota` *(sandbox partner path — production path TBC)* | Send reservation: `action` = `book` / `modify` / `cancel` |
| `POST https://live.aiosell.com/api/v2/cm/data/{PARTNER_ID}` | FETCH `{ "type": "inventory" \| "rates" \| "reservations", "hotelCode": ... }` for reconciliation |

### 2.3 Reservation payload (website → Aiosell)

Root fields: `action`, `hotelCode`, `channel`, `bookingId` (our unique ref —
idempotency key), `cmBookingId` (ownership TBC), `bookedOn`
(`YYYY-MM-DD HH:MM:SS`), `checkin`, `checkout` (`YYYY-MM-DD`), `segment`,
`specialRequests`, `pah` (bool).

- `amount {}`: `amountAfterTax`, `amountBeforeTax`, `tax`, `currency`,
  `commission`, `tcs`, `tds` (tcs/tds are India-specific — see Open Questions)
- `guest {}`: `firstName`, `lastName`, `email`, `phone`,
  `address { line1, city, state, country, zipCode }`
- `rooms []`: `roomCode`, `rateplanCode`, `guestName`,
  `occupancy { adults, children }`, `prices [] { date, sellRate }` (per night)

Cancel requires only: `action`, `hotelCode`, `channel`, `bookingId`.

Success responses: `{ "success": true, "message": "Reservation Updated /
Modified / Cancelled Successfully" }`. Error contract is **undocumented** —
must be captured in sandbox testing.

---

## 3. Database schema (Supabase/Postgres)

```
room_types
  id uuid PK, room_code text UNIQUE, name, description,
  max_adults int, max_children int, images text[], active bool

rate_plans
  id uuid PK, rateplan_code text UNIQUE, room_code FK→room_types.room_code,
  name, meal_plan, cancellation_policy text, active bool

inventory                      -- one row per room type per date
  id, room_code FK, date date, available int,
  stop_sell bool, min_stay int, max_stay int,
  close_on_arrival bool, close_on_departure bool,
  min_advance int, max_advance int,
  raw_restrictions jsonb,      -- verbatim last payload for audit
  updated_at, UNIQUE(room_code, date)

rates                          -- one row per rate plan per date
  id, rateplan_code FK, room_code, date date, rate numeric(12,2),
  stop_sell bool, min_stay int, close_on_arrival bool,
  close_on_departure bool, raw_restrictions jsonb,
  updated_at, UNIQUE(rateplan_code, date)

guests
  id uuid PK, first_name, last_name, email, phone,
  address_line1, city, state, country, zip_code, created_at

reservations
  id uuid PK,
  booking_id text UNIQUE,      -- our OTA bookingId (idempotency key)
  cm_booking_id text,          -- channel-manager id (ownership TBC)
  status text CHECK IN ('draft','pending_payment','paid',
                        'synced','sync_failed','cancelled','modified'),
  checkin date, checkout date, guest_id FK,
  amount_after_tax numeric, amount_before_tax numeric, tax numeric,
  currency text, special_requests text, pah bool DEFAULT false,
  aiosell_synced_at timestamptz, created_at, updated_at

reservation_rooms
  id, reservation_id FK, room_code, rateplan_code,
  guest_name, adults int, children int

reservation_room_prices
  id, reservation_room_id FK, date date, sell_rate numeric

payments
  id uuid PK, reservation_id FK, provider text ('paystack'|'stripe'),
  provider_ref text UNIQUE, amount numeric, currency,
  status text ('initiated','confirmed','failed','refunded'),
  raw_response jsonb, created_at

sync_logs                      -- every outbound call we make to Aiosell
  id, reservation_id FK NULL, direction text, endpoint, action,
  request_payload jsonb, response jsonb, http_status int,
  success bool, attempt int, created_at

webhook_logs                   -- every inbound call Aiosell makes to us
  id, endpoint text, headers jsonb, payload jsonb,
  processed bool, processing_error text, received_at
```

---

## 4. Booking flow

```
GUEST                    WEBSITE / DB                           AIOSELL
  |                            |                                   |
  |  (background, continuous)  |<-- POST inventory/rates/restrictions
  |                            |    upsert mirror tables            |
  |                            |                                   |
  |-- search dates ----------->|                                   |
  |                            | read LOCAL mirror only            |
  |<- rooms, rates, rules -----|  (enforce minStay/stopSell etc.)  |
  |                            |                                   |
  |-- select room, guest info->|                                   |
  |                            | create reservation                |
  |                            |   status = pending_payment        |
  |                            |   bookingId = NJS-<uuid>          |
  |                            | RE-CHECK availability (fresh)     |
  |                            |                                   |
  |-- pay (Paystack/Stripe) -->|                                   |
  |                            |<-- payment webhook: confirmed     |
  |                            |   verify signature, record payment|
  |                            |   status = paid                   |
  |                            |                                   |
  |                            |-- POST action:"book" ------------>|
  |                            |<-- {success:true} ----------------|
  |                            |   status = synced                 |
  |<- confirmation email ------|                                   |
  |                            |<-- inventory push (updated) ------|
```

### Failure handling

| Scenario | Handling |
|---|---|
| Duplicate booking | `booking_id` UNIQUE constraint; payment-webhook replays and double-submits collapse into one row. Aiosell retries always reuse the same `bookingId`. |
| Aiosell push to us fails / site briefly down | Pushes are idempotent upserts; recovery via scheduled FETCH reconciliation (nightly + after each deploy). All received calls audited in `webhook_logs`. |
| Payment confirmed, Aiosell "book" fails | Guest keeps confirmation. Status `sync_failed` → retry job (exponential backoff, same `bookingId`) → after N failures, admin dashboard alert for manual entry in Aiosell dashboard. Invariant: never lose a paid booking. |
| Aiosell accepted, payment failed | Structurally prevented — we push only after payment confirms. (Compensating action if flow ever changes: `action:"cancel"`.) |
| Inventory mismatch | (1) availability re-check at payment initiation, (2) nightly FETCH reconcile, (3) optional admin-set sell buffer (e.g. never sell last room online). |
| Cancellation / modification | Push `action:"cancel"` first, mark cancelled, then refund per policy. `modify` sends full payload; re-validate new dates before confirming to guest. |

---

## 5. Architecture

- **Frontend:** existing Next.js site; booking UI reads only the local mirror.
- **API routes:** `app/api/aiosell/webhook` (single receiver, see §2.1), `app/api/payments/webhook`
  (signature-verified), internal booking routes. Deployed as Vercel functions.
- **Database:** Phase 1 sandbox uses **Neon Postgres with Drizzle ORM**
  (implemented). The schema is plain Postgres with no Neon-specific features,
  so it is portable to Supabase Postgres later if needed (swap the connection
  string/driver; add RLS + service-role hygiene at that point). All database
  access is server-side only.
- **Payments:** Paystack primary (NGN native), Stripe optional for
  international cards.
- **Jobs:** Vercel Cron (or Supabase pg_cron) for `sync_failed` retries and
  nightly FETCH reconciliation.
- **Admin dashboard:** protected route — reservations with payment/sync
  status, failed-sync queue with manual retry, webhook log viewer.
- **Environment variables (Vercel + `.env.local` only, never committed):**
  `AIOSELL_BASE_URL`, `AIOSELL_HOTEL_CODE`, `AIOSELL_PARTNER_ID`,
  `AIOSELL_INBOUND_SECRET`, `PAYSTACK_SECRET_KEY`, `STRIPE_SECRET_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- **Phasing:** the marketing site stays static; the booking engine is a
  Phase-2 module (new routes in this repo, or a `book.` subdomain app) so the
  concept site's simplicity is preserved.

---

## 6. Sandbox testing checklist

Sandbox host: `live.aiosell.com`, hotel code `SANDBOX-OTA`.
Sandbox credentials: **in `.env.local` only — never in this repo.**

1. [ ] Stand up the 4 inbound endpoints on a preview deployment; register the base URL with Aiosell sandbox
2. [ ] Receive a rates push → `rates` rows match payload (date ranges expanded per day)
3. [ ] Receive an inventory push → `inventory` rows correct
4. [ ] Receive inventory + rate restrictions → `stopSell` / `minimumStay` land correctly AND the booking UI blocks violating searches
5. [ ] Replay the same push twice → idempotent, no duplicates
6. [ ] POST test `action:"book"` to the sandbox partner endpoint → `{"success": true}`
7. [ ] Reservation visible in the Aiosell sandbox dashboard
8. [ ] Aiosell pushes decremented inventory back after the booking
9. [ ] POST `action:"cancel"` for the same `bookingId` → cancelled in sandbox, inventory restored
10. [ ] Send an invalid payload (unknown `roomCode`) → record actual error response shape (undocumented)
11. [ ] Retry `book` with the same `bookingId` → observe dedupe behaviour (evidence for Open Question 3)
12. [ ] FETCH inventory/rates/reservations → capture real response schemas (undocumented)
13. [ ] End-to-end: search → book → pay (Paystack test mode) → auto-push → sandbox dashboard shows booking

---

## 7. Open Questions for Aiosell — status

> **Gate: production booking logic must not be built until the remaining
> blocking items below (5 final value, 6 production handling, 7) are
> confirmed in writing by Aiosell.**
> Items marked **Answered** were confirmed by Aiosell on 2026-07-10.

1. **Authentication** — **Answered: Basic Auth is supported.** Webhook
   verification is not yet enforced in the Phase 1 sandbox receiver —
   pending production enforcement/configuration.
2. **`cmBookingId`** — **Answered: generated by Aiosell/CM.** We omit it on
   new bookings and store the value Aiosell returns.
3. **Idempotency** — **Answered: a duplicate `bookingId` is rejected**, so
   retries with the same `bookingId` cannot double-book.
4. **Error contract** — HTTP status codes and error body shapes? What
   retry/backoff does Aiosell apply when pushing to us and our endpoint is
   unreachable?
5. **Production endpoint + partner ID** — **Partially answered: the
   production partner ID WILL change from `sample-ota`.** Exact value and
   how our receiving base URL is registered still TBC. *(Blocking.)*
6. **Currency / NGN** — **Partially answered: `tcs` / `tds` can be 0 for
   sandbox.** Final production handling for a Nigerian property (and full
   NGN support) still to confirm. *(Blocking.)*
7. **Master data** — how are `roomCode` and `rateplanCode` values provisioned
   and communicated? Is there an API to list them? *(Blocking.)*
8. **Initial sync** — on go-live, does Aiosell push a full 365-day snapshot,
   or do we FETCH to seed the mirror? How far ahead do updates extend?
9. **`pah` flag** — exact pay-at-hotel semantics and effects.
10. **FETCH API** — full response schemas and auth for
    `type: inventory | rates | reservations`.
11. **Modification scope** — can `modify` change dates/rooms, or is the
    pattern cancel + rebook?
12. **Rate limits / SLA** — request caps, push latency after a change,
    sandbox reset policy.
13. **Children pricing** — how are child ages / extra-bed rates represented?

---

*Prepared 2026-07-06. Revised 2026-07-10: Phase 1 implemented (single
webhook receiver, Neon + Drizzle); Aiosell answers incorporated. See gate
above.*
