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
| Guest journey | `components/booking/` | Four steps plus confirmation |
| Gated route | `app/booking/page.tsx` | 404 on production |

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
npm test          # 109 tests, 49 of them booking
npm run typecheck
npm run build
npm run dev       # then open /booking
```

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

## Not yet verified

The interactive journey has been typechecked, built, and its logic covered by
unit tests, and the server-rendered first step has been inspected. Nobody has
clicked through all four steps in a browser. That is what the preview deployment
is for.
