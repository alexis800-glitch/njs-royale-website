# NJS Royale booking prototype

Provider-independent booking work, built so that Aiosell's documentation becomes
the final connection step rather than the starting point.

Branch: `feat/booking-prototype`. Nothing here is enabled on the public website.

## What exists

| Layer | Where | State |
| --- | --- | --- |
| Data contracts | `lib/booking/types.ts` | Complete |
| Date arithmetic and rules | `lib/booking/dates.ts` | Complete, 14 tests |
| Gates and limits | `lib/booking/config.ts` | Complete |
| Reservation validation | `lib/booking/validate.ts` | Complete, 16 tests |
| Provider interface | `lib/booking/provider.ts` | Complete |
| Payment boundary | `lib/booking/payment.ts` | Interface only, by design |
| Mock adapter | `lib/booking/mock/` | Complete, 19 tests |
| Aiosell adapter | `lib/booking/aiosell/provider.ts` | Stub that refuses every call |
| **Server boundary** | `lib/booking/server.ts`, `lib/booking/service.ts`, `app/api/booking/route.ts` | Complete, 18 tests |
| **Client-safe interface** | `lib/booking/client.ts` | Complete |
| Guest journey | `components/booking/` | Four steps plus confirmation |
| Gated route | `app/booking/page.tsx` | 404 on production |

## The server-side boundary

The journey holds a `BookingClient`, which can do one thing: POST to
`/api/booking`. No adapter, no provider factory and no credential reaches the
browser bundle — verified by grepping the built client chunks for adapter
internals (`decline@example.test`, the reference alphabet, the availability
function, the blocked-function list): **zero hits**, while the server bundle
has them. The booking page's client JavaScript fell from 14.5 kB to 12 kB when
the boundary went in.

`lib/booking/server.ts` holds everything that must not leave the server: the
provider instance, the authoritative copy of every quote and draft, and the
decision about whether a payment succeeded. It throws if it is ever imported
into a browser bundle.

### Two things a client cannot say

The client-safe interface is deliberately **not** the same shape as
`BookingProvider`, and the difference is the security property:

```
BookingProvider.confirm(draft: BookingDraft, payment: PaymentOutcome)
BookingClient.confirm(draftRef: string, intent: ConfirmIntent)
```

- **It cannot set the rate.** `hold` takes a quote *reference*; the server reads
  the rate from its own stored copy. Tested: a `hold` carrying a forged quote at
  ₦1 still holds the Presidential Suite at ₦6,000,000.
- **It cannot assert that payment succeeded.** `confirm` takes an *intent*, not
  an outcome; the server runs the payment itself. Tested: a `confirm` posting
  `payment: {status: 'authorised'}` alongside a declined simulation still fails
  with `PAYMENT_FAILED`.

Neither is forbidden by a check that could be forgotten. Both are absent from
the type.

### The rest of the boundary

- **Server-side validation.** Every payload is revalidated before a provider
  sees it. The arrival rule is enforced here regardless of what the browser did.
- **Reconciliation.** `confirm` requires an idempotency key, generated once per
  draft and reused on retry, so a double-tap or a replayed request returns the
  first reservation instead of creating a second.
- **Error sanitisation.** Exceptions are caught at the edge and reported as a
  typed code with one guest-readable sentence. No stack, hostname or connection
  string can reach a response.
- **Rate limiting.** 60 requests per minute per caller, in memory. The caller
  key is a map key for one window and is never logged or stored.
- **`cache-control: no-store`** on every response.

### Everything stateful here is prototype-only

**None of the state or control below is production-safe. Each needs a durable
equivalent before a single real reservation is taken.** They are listed so that
nobody mistakes a working prototype for a working reservation system.

| Control | How it works now | What a real reservation needs |
| --- | --- | --- |
| Quote store | `Map` in the memory of one server instance, 30-minute TTL | Durable, shared store, or quotes re-fetched from the provider each time |
| Draft store | Same | Same, plus the provider holding the inventory |
| Idempotency keys | `Map` of key → confirmation, per instance, never evicted | Durable store with a retention policy, so a retry minutes or days later is still safe |
| Rate limiting | Per-instance counters | Shared limiter, or edge rate limiting, so limits are not multiplied by instance count |
| Reservations | `Map` in the mock adapter | Aiosell as the authoritative store; we keep no reservation database |
| Payment | Mock, scripted by synthetic email | A contracted processor, server-initiated, with reconciliation |

The failure mode they share: per-instance memory does not survive a cold start
and is not shared between concurrent instances. In a prototype that is
acceptable and visible. In production it would mean a rate limit that does not
limit, an idempotency key that stops being idempotent, and a quote that vanishes
mid-journey.

**No production persistence has been introduced, and none should be until the
architecture is approved.**

### A consequence left visible

Quotes and drafts live in memory on the server instance that issued them, for
30 minutes. That is not a database, deliberately — the brief forbids a
reservation database, and under the recommended architecture Aiosell is the
authoritative store, not us. So a journey that spans a cold start gets
`QUOTE_EXPIRED` on its next call. That is a state the journey already renders,
and the same state a real engine produces when a held quote lapses, so the
prototype exercises it rather than hiding it.

## Pricing presentation

Every amount shown to a guest is labelled a **room subtotal**, never a total or
an amount payable, because the resort has not confirmed the tax and service
position. `taxesAndFees` is `null` rather than `0`, the figure carries the line
*"This is the room subtotal, not the final amount payable. Taxes and service
charges have not yet been confirmed by the resort and will be added."*, and
`isFinalTotal()` in `lib/booking/types.ts` decides the label so nothing reads
the field name and guesses.

No tax percentage, service charge, cancellation term or resort policy is
invented anywhere in this prototype. Where a fact is missing, the UI says "to be
confirmed".

## The three gates

1. **`BOOKING_ENABLED`** is `process.env.VERCEL_ENV !== 'production'`. The route
   calls `notFound()` when it is false, so the public site has no booking page
   and no environment variable can give it one. Verified end to end: built and
   served with `VERCEL_ENV=production`, `/booking` returns 404 while `/` and
   `/first-look` return 200.
2. **`EARLIEST_ARRIVAL = '2027-07-23'`.** Guest-room arrivals never precede the
   date guest-room operations commence. Enforced in `validateStayQuery`, which
   the UI and the adapter both call, and additionally offered as `min` on the
   arrival input. The `min` is convenience; the validator is the rule.
3. **`RESERVATIONS_OPEN_FROM = '2026-12-19'`.** `bookingWindow()` reports
   `not-open-yet` until Phase One opens, and the page says so.

No payment processor is selected, referenced or implemented. `NO_PAYMENT_PROVIDER`
is the default and refuses everything.

## The preview is not access-protected

Checked on 17 November 2026: this Vercel project has `passwordProtection`,
`ssoProtection` and `trustedIps` all **disabled**, so any preview deployment URL
is reachable by anyone who holds it. The brief asked for a protected staging
preview, and it is not protected.

The prototype is therefore safe by its content rather than by its access
control — synthetic availability, no payment path, no reservation created, no
guest data posted anywhere, `noindex, nofollow`, and absent from the sitemap.
That is adequate for this prototype and would not be adequate for anything
handling real guest or payment data.

**Recommended before wider circulation:** enable Vercel Authentication for
preview deployments. That is a project settings change rather than a code
change, and it has not been made — changing it was not authorised.

## Running it

```bash
npm test          # 127 unit tests, 67 of them booking
npm run typecheck
npm run build
npm run test:e2e  # 38 browser tests, desktop and mobile
npm run dev       # then open /booking
```

`npm run test:e2e` builds nothing: it starts `next start` with
`VERCEL_ENV=preview` on port 3210, runs Chromium at 1440x900 and at an iPhone 13
viewport with touch, and tears the server down. Run `npm run build` first.
Screenshots land in `e2e/screenshots/`, which is git-ignored.

`/booking?provider=aiosell` runs the same journey against the Aiosell stub, so
the unconfigured-provider failure state can be seen without changing any code.
That is the demonstration of the seam: the components do not change, only the
adapter behind them.

## Room data

Categories and rates come from `lib/accommodation.ts` — the resort's own eleven
categories and published opening rates, unchanged.

**Availability is synthetic** and derived from a hash of category and arrival
date, so a given query always gives the same answer and a sold-out category is
reproducible.

Where the resort has not confirmed a fact, the prototype returns `null` and the
UI says "to be confirmed". It does not invent a plausible value. This applies to
occupancy per room, room size, the taxes and service position, the cancellation
policy and the refund position. Each null is an item on the list below.

## What is still needed from Aiosell

Nine integration functions cannot be written without written answers. The
machine-readable form is `BLOCKED_PENDING_AIOSELL` in
`lib/booking/aiosell/provider.ts`, which the prototype page renders and the
tests assert on. In full, with the underlying commercial questions in
`docs/aiosell-booking-readiness.md` (PR #28):

1. **Availability and inventory** — read on demand from an Aiosell endpoint, or
   pushed to us and mirrored? Whether a local mirror is authorised at all is
   open question 26 of the readiness document.
2. **Rates, taxes and service** — whether rates are authoritative in Aiosell or
   in our catalogue, and what the tax and service position is. Every total in
   the prototype is exclusive of taxes because this is unknown.
3. **Holding inventory** — can Aiosell hold a room before payment, and for how
   long? The prototype reports `inventoryHeld: false` because nothing is held.
4. **Creating a reservation** — production API access, documentation and
   contractual permission. The July 2026 sandbox push was accepted and returned
   no booking id.
5. **Modifying a reservation** — supported in place, or cancel and rebook? Not
   modelled, and the mock does not claim the capability.
6. **Cancellation and refunds** — the mechanism and who owns the policy.
7. **Confirmation and reconciliation** — webhook or poll, and what constitutes
   proof a reservation landed. HTTP 200 with no booking id is not proof.
8. **Payment** — whether payment is ours to take or Aiosell's, NGN settlement to
   a Nigerian account, what the reported 5% covers, and duplicate-payment
   prevention.
9. **White-label limits** — the supported level of branding, if any part of the
   journey must run on an Aiosell-hosted page.

## What was deliberately not done

- No reservation database. The mock holds drafts in a `Map` for the lifetime of
  the process, which is not persistence and must not become it.
- No API route behind the journey. Guest details stay in component state and are
  never posted anywhere.
- No change to the legacy `feature/aiosell-phase1` and `feature/aiosell-phase2`
  branches.
- No Aiosell endpoint, field name, authentication scheme or behaviour invented.
- No dependency added. The whole prototype is built on what the project already
  had.

## Verified end to end over HTTP

The real route, served from a production build with `VERCEL_ENV=preview`, driven
with curl:

| Step | Result |
| --- | --- |
| `search` | 9 categories, cheapest ₦750,000 for 3 nights |
| `quote` | ₦750,000, `taxesAndFees: null` |
| `hold` with a forged ₦1 rate in the body | ₦750,000 held — forgery ignored |
| `confirm` declined, with a forged authorised payment | `PAYMENT_FAILED` |
| `confirm` authorised | `NJS-20261117-CSWP6S`, `providerReference: null` |
| `confirm` again, same idempotency key | same reference, no second booking |
| arrival `2027-07-22` | `INVALID_QUERY`, "Guest rooms open on 23 July 2027" |
| `provider: aiosell` | `PROVIDER_NOT_CONFIGURED` |
| `GET /api/booking` | 405 |
| malformed JSON | 400 |
| every response | `cache-control: no-store` |

And with `VERCEL_ENV=production`: `POST /api/booking` → **404 with an empty
body**, `GET /booking` → **404**, while `/`, `/first-look` and
`/api/registrations` are unaffected.

## Not yet verified

**Nobody has clicked through the journey in a browser.** The logic is unit
tested, the HTTP path is verified end to end, and the server-rendered first step
has been inspected — but no real pointer has touched a radio button, and no
phone has rendered step 2. Mobile layout in particular is asserted only by the
Tailwind breakpoints in the markup.
