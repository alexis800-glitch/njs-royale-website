# NJS Royale × Aiosell — Booking Integration Readiness

> **Status: ASSESSMENT ONLY.** No booking code is added by this document. No
> production change, no deployment, no booking functionality is activated.
> Prepared 16 November 2026.
>
> **NJS position, 16 November 2026.** NJS supports developing an NJS-branded
> booking experience connected to Aiosell **in principle**, and explicitly
> states that the API route is **not approved, contractually or technically**,
> until Aiosell confirms the ten items in §11.0. The recommendation in §5 is a
> recommendation, not a decision. No implementation is authorised.
>
> **The existing `feature/aiosell-phase1` and `feature/aiosell-phase2` branches
> are to remain untouched** until a separate modernisation and integration plan
> is approved.
>
> **Credentials policy (unchanged):** no usernames, passwords, tokens or API
> secrets may appear in this repository. They live only in `.env.local`
> (gitignored) and in Vercel environment variables.

---

## 0.0 Evidence standard

Every substantive claim below carries one of three labels. They are not
decoration: the difference between them decides how much weight a claim can bear
in a commercial negotiation.

| Label | Meaning |
|---|---|
| **[MEASURED]** | Observed directly on 16 November 2026 by inspecting the artefact named, and reproducible. |
| **[RECORD]** | Taken from this repository's own commits and documents, written by the earlier integration work. Accurate as a record of what was done and said; **not re-verified in November 2026.** |
| **[INFERENCE]** | Reasoning from the above, or from general knowledge. **May be wrong. Must be confirmed with Aiosell before it is relied on.** |

Where a label is absent, the statement is descriptive of this repository and can
be checked by reading the file named.

**The single most important caveat.** Every [MEASURED] finding about Aiosell's
hosted booking engine comes from **one** property's public page — the sample
Aiosell themselves shared (`octave-hotel-sarjapur-rd`), which is on their
default theme. It establishes what their standard engine does. It does **not**
establish what an NJS-specific or higher-tier configuration might do. That is
precisely why Question 6 in Section 11 asks them to confirm the limits in
writing.

---

## 0. Read this first — the decision that is actually blocking

This is not a greenfield assessment. Substantial Aiosell work already exists in
this repository, and a reservation push to Aiosell's sandbox **has already
succeeded**.

What is blocking is not engineering. It is a commercial and brand decision that
has been open since **15 July 2026**, recorded as Open Question 15 in
`docs/aiosell-integration-plan.md` on `feature/aiosell-phase2`:

> Aiosell confirmed two paths: (A) the hotel uses **Aiosell's booking engine**
> connected to the custom website (Aiosell handles payments), or (B) our
> **custom booking engine connects as an OTA**. *The hotel must choose.*

The brief that prompted this document states the objective as a guest
experiencing **"one coherent luxury hospitality brand."** That objective
decides Question 15, and this document shows why, with measurements rather than
opinion.

**Recommendation: Option B.** Option A cannot carry the NJS visual identity.
Section 4 gives the measured reason.

---

## 1. Audit of the existing website

### 1.1 Architecture

| Property | Finding |
|---|---|
| Framework | Next.js **15.5.28** (pinned exactly), App Router, React 18 |
| Styling | Tailwind CSS 3.4 with a custom token set |
| Rendering | Static-first. **36 routes prerendered**; the only dynamic route is `POST /api/registrations` |
| Bundle | Home page 53 kB, 168 kB first-load JS; 103 kB shared |
| Database | `pg` 8.23 against Postgres, used only by the registrations feature |
| Hosting | Vercel, with response headers and a report-only CSP already in place |
| Motion | `framer-motion` 11, used for section reveals throughout |

The site is a **marketing site with one transactional feature** (registrations).
It is fast, static and clean. Adding a booking engine must not compromise that:
the booking journey should be additive routes, not a rewrite.

### 1.2 Design system — what the booking journey must match

From `tailwind.config.ts` and `app/layout.tsx`:

| Token | Value | Role |
|---|---|---|
| `navy` | `#0A1628` | Primary ground |
| `navyDark` | `#060E1A` | Recessed panels |
| `gold` | `#C9A84C` | Accent, rules, primary CTA |
| `sand` | `#F5F0E8` | Light sections |
| Display face | **Cormorant Garamond** (`--font-cormorant`) | Headings, prices, dates |
| Body face | **Inter** (`--font-inter`) | Body, labels, UI |

House conventions observed across components: uppercase eyebrow labels at
`10–11px` with `3–4px` letter-spacing in gold; square corners (no border radius
anywhere); hairline `gold/25`–`gold/50` borders; generous vertical rhythm
(`py-28`/`py-32`); CTAs as solid gold-on-navy or outlined white, uppercase,
`0.08em` tracking, `min-h-[44px]`.

**These conventions are the thing at stake in the Option A / Option B decision.**

### 1.3 Where booking would connect

| Surface | File | Current state |
|---|---|---|
| Navbar CTA (desktop + mobile) | `components/Navbar.tsx` | Labelled "Reserve", links to `/#enquire` |
| Nav items | `components/Navbar.tsx` | 10 anchors; no booking entry |
| Primary CTA section | `components/BookCTA.tsx` | `#enquire` — phone and email only. States *"Online booking is not yet live."* |
| Room catalogue | `components/Rooms.tsx` + `lib/accommodation.ts` | 11 categories, each with a stable `id`, an `openingRate` in NGN and `availabilityStatus: 'enquire'` |
| Phase dates | `lib/opening.ts` | Single source of truth for both phase dates |

**`lib/accommodation.ts` is already the booking catalogue in embryo.** It has
stable identifiers and published opening rates from ₦250,000 (Royale Room,
Standard) to ₦2,000,000 (Presidential Suite). What it lacks is a mapping to
Aiosell's `roomCode` and `rateplanCode` values — which is Question 7 below, and
still unanswered by Aiosell.

### 1.4 Precedent for the integration boundary

The registrations feature is the model to copy. It already demonstrates the
separation a booking boundary needs:

```
components/registration/fields.tsx          presentation
components/registration/useRegistrationSubmit.ts   client transport
app/api/registrations/route.ts              server entry
lib/registrations/validate.ts               re-validation server-side
lib/registrations/normalise.ts              canonicalisation
lib/registrations/service.ts                orchestration
lib/registrations/store.ts                  persistence
lib/registrations/honeypot.ts / ipHash.ts   abuse controls
```

Also already solved and reusable: **consent gating**
(`components/consent/ConsentProvider.tsx`, `lib/meta/consent.ts`) and
**server-side conversion tracking** (`lib/meta/capi.ts`, with 60 passing tests).
A booking funnel does not need new analytics plumbing — it needs new events on
the existing plumbing.

### 1.5 Mobile responsiveness

Sound baseline. Tap targets meet 44px minimum, the mobile menu is a dedicated
full-screen panel, type scales with `clamp()`, and sections stack cleanly. A
booking flow must hold this standard — which, as Section 4 shows, Aiosell's
hosted page does not.

---

## 2. What already exists for Aiosell

| Location | Contents | State |
|---|---|---|
| `docs/aiosell-integration-plan.md` (on `main`) | Original planning document, 6 July 2026 | Superseded by the branch version |
| `origin/feature/aiosell-phase1` | Inbound webhook receiver, Drizzle + Neon schema, seed | Implemented, verified 10 July 2026 |
| `origin/feature/aiosell-phase2` | Outbound reservation push, availability validation, FETCH reconciliation, dev routes, admin debug | **Sandbox push proven 14 July 2026** |

### 2.1 The proven result

**[RECORD]** — from the commits and the plan document on
`feature/aiosell-phase2`. This result was **not reproduced in November 2026**;
the sandbox credentials are from July 2026 and may no longer be valid
(Question 14).

Booking `NJS-20260714-FU4VDF` was accepted by Aiosell with **HTTP 200 in one
attempt**, using endpoint partner path `sample-ota` and payload
`hotelCode: sandbox-ota`. Final state `paid` / `synced`. No `cmBookingId` was
returned.

This is the single most important fact in this document: **the hard part was
demonstrated working.** Option C is not a proposal, it was a working capability
in July 2026 — against the sandbox, on a codebase 88 commits behind `main`, with
no payment step and single-room bookings only. Treat it as strong evidence of
feasibility, not as a system ready to switch on.

### 2.2 Branch health — needs attention

Both branches are **88 commits behind `main` and 5 ahead**. They predate the
Next 15 migration, the security headers work and the CSP. `feature/aiosell-phase2`
also changes `package.json` (+22 lines: Drizzle, Neon driver, tooling) and
rewrites `package-lock.json`.

Rebasing them onto current `main` is a prerequisite for any further Aiosell work
and should be treated as its own gated task, with the lockfile regenerated
rather than merged.

### 2.3 Aiosell's answers already on record (July 2026)

Confirmed: Basic Auth is supported in both directions; `cmBookingId` is
generated by Aiosell; a duplicate `bookingId` is **rejected**, so retries cannot
double-book; auth failures return **HTTP 400**, not 401; the reservations FETCH
channel is **intentionally disabled** — reservations are push-only; `tcs`/`tds`
may be `0` in sandbox; the production partner ID **will differ** from sandbox;
onboarding is *webhook tested → reservation push demonstrated → Aiosell adds us
as a partner under a small contract* (the first two are done).

---

## 3. Integration approaches, in the order the brief requested

### Option A — Aiosell's branded / white-label booking engine

**[RECORD] Supported.** Aiosell confirmed in writing on 16 July 2026 that the
engine can be white-labelled to our domain and branding, and quoted *"the payment
gateway charge will be 5%"*. We have never been shown a white-labelled example,
so what that branding achieves in practice is **unverified**.

Measured limits are in Section 4. The 5% remains unexplained and is Question 1
below.

### Option B — Aiosell's embedded booking widget

**[INFERENCE] from absence of evidence — not a finding that it does not exist.**
Aiosell's public marketing describes white-labelling and URL masking, not an
embed. No widget or iframe snippet appears in their
published documentation, and none was offered in the July correspondence. The
hosted page is an Angular single-page application that sets
`robots: noindex, nofollow` — a shape designed to be navigated to, not embedded.

We have not asked them directly, and a widget may simply be undocumented.
**Treat as unavailable for planning purposes until Aiosell states otherwise in
writing**, but ask rather than assume. It is Question 5 below. Note that even if a widget existed, it would inherit the same
styling ceiling measured in Section 4, so it would not solve the brand problem.

### Option C — Aiosell booking APIs with an NJS-designed frontend

**[RECORD] Supported, permitted, and already built against the sandbox.** This
is the OTA / Channel Manager model: the NJS website registers as a private sales channel alongside
Booking.com and Expedia.

- Aiosell pushes inventory, rates and restrictions to one endpoint we host; we
  mirror them.
- The booking UI reads **only** the local mirror, never Aiosell in real time.
- Confirmed bookings are pushed to Aiosell, which decrements availability across
  every other channel.

Aiosell named the onboarding path and we have completed its two technical
prerequisites. What remains is commercial: the partner contract.

### Option D — Branded transition to Aiosell's hosted page

The fallback. The guest completes dates and room selection on the NJS site, then
is handed to Aiosell's page with the stay pre-filled. Visual continuity breaks at
the handover; Section 4 measures how badly.

---

## 4. The customization ceiling, measured

**[MEASURED]** unless marked otherwise. Assessed by fetching Aiosell's live
sample engine (`be.aiosell.com/book/octave-hotel-sarjapur-rd`, the example
Aiosell themselves shared) and its stylesheet on 16 November 2026, and reading
the served HTML and CSS.

**Scope of the measurement:** one property, on Aiosell's default theme. These
figures describe their standard engine. Whether a different tier, a paid
white-label add-on, or a bespoke arrangement lifts any of these limits is
**unknown** and is Question 6.

### 4.1 Theming surface: three CSS custom properties

The engine's entire stylesheet (94,517 bytes) declares **three** theme variables:

| Variable | Default | Times used |
|---|---|---|
| `--theme-color` | `#186814` (green) | 11 |
| `--theme-secondary` | `#fff` | 2 |
| `--theme-shade-3` | `#fff` | 1 |

**Fourteen usages in total.** That is the whole brand surface: one accent colour
and two near-whites. Everything else is Bootstrap 5.1.3 and Angular Material
defaults.

### 4.2 Typography cannot be changed

**22 declarations** hard-code `font-family: Roboto, Helvetica Neue, sans-serif`.

Cormorant Garamond — the face that carries the NJS identity on every heading,
rate and date — **cannot be applied**. Inter appears once, in a single rule.

A booking page set in Roboto is not a continuation of the NJS website. It is a
different company's software wearing an NJS-coloured button.

### 4.3 Other measured findings

| Finding | Evidence | Consequence |
|---|---|---|
| Client-rendered Angular SPA | `<app-root>` + runtime/polyfills/main bundles | No server-side theming hook; content invisible without JS |
| `noindex, nofollow` | `<meta name="robots">` | The booking funnel contributes nothing to SEO |
| Generic document title | `<title>Direct Booking</title>` | Browser tab and bookmarks are unbranded |
| Pinch-zoom disabled | `maximum-scale=1.0, user-scalable=no` | Accessibility regression against the current site |
| Payment: **Razorpay** + **Stripe** | `checkout.razorpay.com`, `js.stripe.com` | **No Paystack.** Razorpay is India-only. See 4.4 |
| Layout control | Single `--container` variable | Page structure and journey order are fixed |

### 4.4 The payment question is serious for a Nigerian property

**[MEASURED]** The sample engine's HTML loads exactly two payment scripts:
`checkout.razorpay.com/v1/checkout.js` and `js.stripe.com/v3/`. No Paystack
script is present.

**[INFERENCE] — and this is the inference most likely to be wrong, so do not
act on it without an answer to Questions 2 and 7.** Razorpay serves India, not
Nigeria. If the same two processors are all that is available to an NJS
property, settlement of NGN to a Nigerian bank account would rest on Stripe
alone, whose support for Nigerian entities is limited. But payment providers are
very commonly configured per property and per region, so the absence of Paystack
on an Indian hotel's page is **weak evidence** about what a Nigerian property
would be offered. It is a question to ask, not a finding to rely on.

This directly compounds the unexplained **5%**. On the published opening rates, a
two-night Royale Suite (Ocean View) at ₦575,000 is ₦1,150,000 — **₦57,500 in
fees**. A two-night Presidential Suite is ₦4,000,000 — **₦200,000**. Paystack's
standard local-card pricing is materially below 5% and capped.

**[RECORD]** The 5% itself is Aiosell's own figure, quoted to us in writing on
16 July 2026 and recorded in the Open Questions. Its scope has never been
explained.

**Do not accept the 5% figure until Questions 1 and 2 are answered.**

### 4.5 Closest achievable match under Option A or D

If Option A is chosen in spite of the above, the most that can be done:

1. Set `--theme-color` to NJS gold `#C9A84C`, `--theme-secondary` / `--theme-shade-3` to `#FFFDF7`.
2. Supply the NJS crest as the engine logo.
3. White-label the URL to an NJS-owned host (`book.njsbeachresort.com`) so the address bar stays on brand.
4. Upload NJS room photography and the approved category names and policies.
5. Carry the handover on our side: an NJS-styled interstitial that sets expectation before the guest leaves.

Realistic outcome: **brand-adjacent, not brand-continuous.** Navy, Cormorant
Garamond, the square-cornered hairline-bordered card language and the vertical
rhythm are all unavailable. Gold on Bootstrap/Roboto reads as a vendor page with
our colour applied.

---

## 5. Recommendation

**Adopt Option C** — Aiosell as the authoritative reservation system behind an
NJS-designed frontend — and keep Option D as a documented contingency.

| | Option A / D (Aiosell-hosted) | **Option C (NJS frontend)** |
|---|---|---|
| Visual continuity | 1 accent colour, Roboto | **Complete** |
| Typography | Roboto, fixed | **Cormorant + Inter** |
| Mobile standard | Zoom disabled | **Current site standard** |
| SEO | `noindex` | **Indexable** |
| Analytics | Cross-domain, degraded | **First-party, existing CAPI** |
| Payments | Razorpay / Stripe, 5% unexplained | **Paystack, NGN native** |
| Date gating to 23 Jul 2027 | Depends on Aiosell restrictions | **Enforced by us, absolutely** |
| Build effort | Low | **Already demonstrated** |
| Operational burden | Aiosell carries it | We carry payments + support |
| Commercial | 5% (scope unclear) | Partner contract (terms unseen) |

Option C is the only option that satisfies the stated objective **on the
evidence currently available**. It is also, in this repository, the one with a
recorded HTTP 200.

**This recommendation is conditional, not a decision.** It rests on [MEASURED]
findings from a single sample property and on [RECORD] correspondence from July
2026. Questions 1–8 in Section 11 can each change it — in particular, a
satisfactory answer on NGN settlement plus a genuinely deeper customisation tier
would make Option A viable again, and an unacceptable partner contract would
make Option C impossible regardless of its technical merits.

Its honest costs: we take on payment handling, PCI scope via Paystack's hosted
checkout, refund operations and first-line booking support; and Aiosell requires
a partner contract whose terms we have not seen.

### 5.1 On "do not build a competing reservation database"

The brief forbids a competing reservation database, and Option C involves a
Postgres mirror. These do not conflict, and the distinction matters:

- **Aiosell remains authoritative.** Availability, rates and restrictions
  originate at Aiosell and are *pushed to us*. We never invent them.
- **The mirror is a read cache**, not a system of record. It exists so the
  booking UI can answer instantly and so a brief Aiosell outage cannot take the
  booking page down.
- **Writes go one way.** A confirmed booking is pushed to Aiosell, which
  decrements inventory everywhere. We do not hold inventory Aiosell does not
  know about.
- This mirror-first design is **Aiosell's own documented OTA model**, not a
  workaround. Every OTA that connects to them works this way.

The invariants already recorded on `feature/aiosell-phase2` enforce exactly
this, and should be preserved verbatim.

---

## 6. The integration boundary

One module, one configuration object, one swap point — so that the booking
provider can be replaced without touching the marketing site.

```
lib/booking/
  provider.ts        BookingProvider interface — the ONLY contract the UI knows
  config.ts          feature flag, phase gates, currency, earliest arrival
  aiosell/           Option C adapter (exists on feature/aiosell-phase2)
  hosted/            Option D adapter — builds a deep link, no local inventory
  mock/              synthetic-data adapter for prototype and tests
```

```ts
// The entire surface the booking UI is allowed to depend on.
export interface BookingProvider {
  search(q: StayQuery): Promise<RoomOffer[]>
  quote(sel: Selection): Promise<Quote>
  hold(sel: Selection, guest: GuestDetails): Promise<BookingDraft>
  confirm(draft: BookingDraft, payment: PaymentResult): Promise<Confirmation>
  cancel(ref: BookingReference): Promise<CancellationResult>
}
```

Rules that make the boundary real:

1. **No component imports anything from `lib/booking/aiosell/`.** The UI depends
   on `provider.ts` only. The adapter is chosen once, server-side, from config.
2. **Every provider call is server-side.** No Aiosell credential, hotel code or
   partner ID reaches the browser — a hard requirement from the brief and
   already the rule on `feature/aiosell-phase2`.
3. **The marketing site is untouched** except for the entry points in §6.1.
4. **The mock adapter is the default** until a provider is approved, so the
   prototype cannot accidentally transact.

### 6.1 Entry points (the only changes to existing components)

| Component | Change | Gate |
|---|---|---|
| `components/Navbar.tsx` | "Reserve" points at `/reserve` instead of `/#enquire` | `BOOKING_ENABLED` |
| `components/BookCTA.tsx` | Add a "Check Availability" CTA above the telephone fallback | `BOOKING_ENABLED` |
| `components/Rooms.tsx` | Per-category "Check Availability" passing the category `id` | `BOOKING_ENABLED` |

With the flag off, all three render exactly as they do today. That is what keeps
the prototype invisible to the public.

### 6.2 Initiating the journey

A single typed query object, URL-encodable so a stay survives a refresh, a share
and the handover in Option D:

```
/reserve?arrive=2027-07-24&depart=2027-07-27&adults=2&children=0&category=royale-suite-ocean
```

Under Option C it seeds the search. Under Option D the same object is mapped to
Aiosell's hosted-page parameters — **whose names we do not know** (Question 4).

---

## 7. Proposed guest booking journey

Five steps, each rendered in NJS styling, each reachable by keyboard, each
holding state in the URL.

| Step | Guest sees | Behind it |
|---|---|---|
| 1 Dates & guests | Arrival, departure, adults, children. Calendar opens on 23 July 2027 and refuses anything earlier. | Mirror queried for the month's availability |
| 2 Rooms | The 11 NJS categories in house styling, with nightly rate, total, and unavailable ones shown as unavailable rather than hidden | Mirror read; stop-sell and minimum-stay applied |
| 3 Guest details | Name, email, phone, address, special requests | Same validation discipline as registrations |
| 4 Payment | NJS-styled summary, then Paystack hosted checkout | **Local booking row written *before* any push** |
| 5 Confirmation | NJS reference `NJS-YYYYMMDD-XXXXXX`, full stay summary, emailed copy | Push to Aiosell; `synced` on success |

### 7.1 The states that are usually neglected

| State | Treatment |
|---|---|
| Loading | Gold hairline progress on navy; never a spinner on a blank page. Skeleton rows keep layout stable |
| No availability | Named explicitly ("No rooms available for 24–27 July"), with the nearest alternative dates offered and the telephone line as a fallback |
| Room taken during the journey | Caught at payment initiation by a fresh mirror re-check; the guest is returned to step 2 with the clash named, **never after payment** |
| Payment failed | Booking preserved as `pending_payment`, retry offered, nothing pushed to Aiosell |
| Payment succeeded, Aiosell push failed | **The guest is confirmed regardless.** Status `sync_failed`, retried with the same `bookingId`; after N attempts an operator alert. A paid booking is never lost |
| Cancellation | Push `cancel` first, then refund per policy. Never refund before Aiosell has released the inventory |
| Session expiry | Stay query survives in the URL; nothing silently resets |

### 7.2 The invariant worth repeating

**The local booking row is written before any call to Aiosell, and a failed push
never deletes it.** This is already implemented and verified on
`feature/aiosell-phase2` (local record 23:48:07 UTC, push 23:48:10 UTC).

---

## 8. The phased opening — hard constraints

From `lib/opening.ts`:

- **19 December 2026** — Phase One opens. Advance room reservations intended to
  become available.
- **23 July 2027** — guest-room operations commence.

Three gates, enforced independently so that no single failure can open bookings
early:

```ts
export const BOOKING_ENABLED        = false          // master switch, default off
export const RESERVATIONS_OPEN_FROM = '2026-12-19'   // when guests may book
export const EARLIEST_ARRIVAL       = '2027-07-23'   // what they may book
```

1. **Client** — the date picker cannot select before `EARLIEST_ARRIVAL`.
2. **Server** — every provider call re-validates it and rejects earlier arrivals
   with a typed error, independently of the client.
3. **Inventory** — Aiosell should load no room inventory before 23 July 2027, so
   the mirror cannot physically offer an earlier night.

Layer 2 is the one that matters: layers 1 and 3 are conveniences, layer 3
depends on Aiosell, and only layer 2 is wholly ours.

**Scope separation.** Room reservations only. Daycation, restaurant,
recreational-activity and private-event bookings stay on their current paths and
must not be routed through Aiosell unless Aiosell confirms it supports them
(Question 9).

---

## 9. Analytics and conversion tracking

Build on what exists — `lib/meta/capi.ts` and the consent provider — and add
booking funnel events. No new vendor.

| Event | Fired | Payload |
|---|---|---|
| `booking_search` | Step 1 submitted | Dates, nights, party size. **No identity** |
| `booking_room_viewed` | Step 2 rendered | Category ids, availability count |
| `booking_selected` | Room chosen | Category id, nights, value, currency |
| `booking_started` | Step 3 submitted | Opaque draft id only |
| `booking_confirmed` | Confirmation | NJS reference, value, currency |

Rules, consistent with the existing implementation:

- Guest name, email, phone and address **never** enter a client-side analytics
  payload. The existing CAPI module already hashes identifiers server-side; the
  booking funnel reuses that path.
- Every event is **consent-gated** through `ConsentProvider`.
- The NJS booking reference is a non-reversible key, safe as an event id.
- Conversion value is the room total. Under Option A or D, attribution breaks at
  the domain boundary and the confirmed-booking event is not reliably ours —
  another cost of the hosted path.

---

## 10. Security

| Area | Requirement |
|---|---|
| Credentials | `AIOSELL_*`, `PAYSTACK_SECRET_KEY`, `DATABASE_URL` server-side only. **No `NEXT_PUBLIC_` prefix on any of them.** Never committed |
| Inbound webhook | Basic Auth enforced **at the moment of registration** with Aiosell, with the Vercel Protection path exception applied in the same change, so the endpoint is never briefly public |
| Logging | Authorization headers, passwords and connection strings never written to `sync_logs`, `webhook_events` or console. (A connection string leaked into runtime logs on 10 July 2026 and the credential had to be rotated. Treat every log write as potentially public) |
| Payment webhooks | Signature-verified before any state change; replays idempotent |
| Idempotency | The NJS reference is the key end to end. Aiosell rejects duplicates, so retries cannot double-book |
| PII | Minimum necessary; the admin debug view masks guest names and emails |
| Payment data | Card details never touch NJS infrastructure — Paystack hosted checkout only |
| CSP | The report-only CSP must be extended for Paystack **before** the booking routes are enabled |

---

## 11. Information required from Aiosell

Ordered by what blocks what. Items 1–8 block any production decision.

Several of these ask Aiosell to confirm or correct something we measured or
inferred ourselves. That is deliberate: where our evidence is one sample page or
a chain of reasoning, their written answer is what turns it into fact.

### 11.0 The ten confirmations required before approval

These were set by NJS on 16 November 2026 as the conditions for authorising the
API route. Each maps to the numbered questions that follow. **None is
currently satisfied.**

| # | Required confirmation | Questions | Status |
|---|---|---|---|
| 1 | Sandbox workflow matches what the guest-facing site needs | 23 | ☐ Not asked |
| 2 | Production API access, documentation, contractual permission | 3, 8 | ☐ Open since Jul 2026 |
| 3 | Availability, inventory and rate synchronisation | 11, 13, 10 | ☐ Partly open |
| 4 | Reservation creation, modification, cancellation | 17, 18, 24 | ☐ Partly open |
| 5 | Booking confirmation and reconciliation | 19 | ☐ Open — FETCH disabled |
| 6 | NGN payments and settlement to a Nigerian account | 2 | ☐ Not asked |
| 7 | Exact charges and the meaning of the 5% | 1 | ☐ Quoted, never explained |
| 8 | Refunds, failed payments, duplicate-payment prevention | 18, 25 | ☐ Not asked |
| 9 | Supported level of white-label customisation | 4, 6 | ☐ Measured, unconfirmed |
| 10 | Whether a database mirror is authorised, and on what terms | 26 | ☐ Not asked |

**Item 10 deserves emphasis.** The mirror is central to the recommended
architecture, and it has never been put to Aiosell in writing as a question of
authorisation — only treated as implied by their OTA model. If they decline it,
or attach retention or security conditions we cannot meet, the architecture
changes. Ask before building.

### Commercial — blocks the Option A/C decision

1. **The 5% charge.** Is it payment-gateway processing, Aiosell commission, or
   both? Is it levied on the room total only, or also on taxes and extras? Is it
   refunded when a guest cancels? Please give the figure as a worked example on
   a ₦1,150,000 two-night booking.
2. **Payment processing in Nigeria.** The hosted engine loads Razorpay and
   Stripe. Razorpay does not serve Nigeria. **Is Paystack supported?** If not,
   which processor settles NGN to a Nigerian bank account, and at what rate?
3. **Partner contract.** Please send the agreement, fees and term for being
   added as a partner under the OTA route.

### Technical — blocks the booking engine build

4. **Booking engine URL and a demonstration.** Our booking engine URL, plus a
   **white-labelled** live example. The sample shared previously
   (`octave-hotel-sarjapur-rd`) shows the default design, so it cannot tell us
   what branding actually achieves.
5. **Embed / widget support.** Does an embeddable widget or iframe exist? If so,
   please send the snippet and its styling options. We have found no published
   evidence of one.
6. **Customization limits, in writing.** We measured three CSS variables
   (`--theme-color`, `--theme-secondary`, `--theme-shade-3`) and typography
   fixed to Roboto. Please confirm, and state whether a custom stylesheet,
   custom webfont (specifically **Cormorant Garamond**), or custom CSS injection
   is possible at any tier.
7. **Deep-link parameters.** The exact query parameters the hosted page accepts
   for check-in, check-out, adults, children, room and rate plan, so a stay
   selected on our site arrives pre-filled.
8. **Production endpoint and partner ID.** The production partner path and
   `PARTNER_ID`, and how our receiving base URL is registered. *(Carried over,
   still open since July 2026.)*

### Operational — blocks go-live, not the decision

9. **Scope beyond rooms.** Does Aiosell handle Daycation passes, restaurant
   reservations, activities or private events? If not, they stay on our side.
10. **Advance-booking window.** We must sell from 19 December 2026 for arrivals
    from 23 July 2027 — a 7-month lead. Confirm `maximumAdvanceReservation`
    supports this and that inventory can be loaded that far ahead.
11. **Master data.** How are `roomCode` and `rateplanCode` provisioned for our
    11 categories, and is there an API to list them? *(Open since July 2026.)*
12. **NGN and tax fields.** Final production handling of `tcs` / `tds` for a
    Nigerian property, and how Nigerian VAT should be represented.
13. **Initial sync.** On go-live, does Aiosell push a full 365-day snapshot, or
    do we FETCH to seed? How far ahead do updates extend?
14. **Sandbox refresh.** Our sandbox credentials date from July 2026. Please
    confirm they remain valid, and the sandbox reset policy.
15. **Rate limits and SLA.** Request caps, push latency after a change, and
    retry/backoff behaviour when our endpoint is unreachable.
16. **Error contract.** Status codes and error body shapes. We observed auth
    failures returning HTTP 400 rather than 401.
17. **Modification scope.** Can `modify` change dates and rooms, or is the
    pattern cancel-and-rebook?
18. **Cancellation and refunds.** Who initiates the refund under Option A, and
    on what timeline?
19. **Reservation verification.** With the reservations FETCH channel
    intentionally disabled, how do we verify reservation state in production?
20. **Children pricing.** How are child ages and extra-bed rates represented?
21. **`bookedOn` timezone.** No timezone field is documented. We send
    Africa/Lagos. Please confirm.
22. **Webhooks to us for reservation status.** Is there a push for bookings made
    on *other* channels that affect our mirror beyond inventory?

### Required by NJS on 16 November 2026 — not previously asked

23. **Sandbox-to-production workflow parity.** *(Blocking.)* The sandbox
    integration we built and tested in July 2026 covered single-room bookings
    with no payment step. Does the production workflow differ in any way from
    what we exercised — in payload, sequence, required fields, or permitted
    actions? Specifically: are **multi-room** bookings on a single reservation
    supported, and is the payload shape the same? Our guest-facing site must
    support a family taking two rooms on one reservation, which the sandbox
    work never exercised.
24. **Reservation lifecycle, end to end.** *(Blocking.)* Beyond the `modify`
    scope question above, please confirm the full supported lifecycle for a
    booking originating on our website: creation, amendment of dates, rooms,
    guest names and occupancy, partial cancellation of one room within a
    multi-room booking, and full cancellation. Which of these are supported via
    API, and which require the Aiosell dashboard?
25. **Duplicate-payment prevention.** *(Blocking.)* We understand a duplicate
    `bookingId` is rejected at your end. Separately: if a guest's card is
    charged but our push fails, or the guest submits twice and two payments
    settle, what is the supported path to void or refund the second payment —
    and does Aiosell play any part in it, or is it entirely ours to handle with
    the payment processor?
26. **Is a local mirror authorised?** *(Blocking.)* Your OTA model requires us to
    receive pushed inventory, rate and restriction data and to serve our booking
    UI from it. Please confirm **in writing** that storing this data locally is
    authorised, and state any conditions: permitted retention period, whether
    data must be purged when the partnership ends, required security controls
    (encryption at rest, access logging), whether guest personal data from
    reservations may be retained on our side and for how long, and the required
    reconciliation frequency to prevent the mirror drifting from your records.

---

## 12. Staged implementation plan

Every stage ends at an approval gate. Nothing proceeds without sign-off.

| Stage | Work | Exit gate |
|---|---|---|
| **0. Current** | This assessment; mockup for review | ☐ **Decision on Option C vs A** |
| **1. Confirmations** | Put the ten required confirmations (§11.0) to Aiosell in writing; review the partner contract | ☐ **All ten answered in writing.** Nothing proceeds on a verbal or partial answer |
| **2. Branch health** | **FROZEN — requires its own approval.** Rebasing `feature/aiosell-phase1/2` onto `main`, regenerating the lockfile and re-running sandbox tests is a separate plan NJS has not yet authorised. The branches stay untouched until then | ☐ Separate modernisation plan approved first |
| **3. Boundary** | `lib/booking/` with the provider interface, config gates and the **mock adapter only**. `BOOKING_ENABLED = false` | ☐ Flag off in production; mock passes tests |
| **4. UI** | The five-step journey in NJS styling against the mock adapter. Preview deployment, protected | ☐ Design approved; accessibility and mobile pass |
| **5. Live data** | Wire the Aiosell adapter. Register the webhook **with Basic Auth enabled in the same change**. Seed the mirror | ☐ Mirror matches Aiosell; no unauthenticated window |
| **6. Payments** | Paystack hosted checkout, test mode. Extend the CSP | ☐ Test transactions reconcile; CSP clean |
| **7. End-to-end** | Full rehearsal in sandbox: book, modify, cancel, failed push, refund | ☐ Sandbox checklist items 8–18 complete |
| **8. Soft launch** | Enable for a small invited group; monitor | ☐ Real bookings reconcile correctly |
| **9. Public** | `BOOKING_ENABLED = true` | ☐ Explicit written approval |

**Stage 3 must not begin before the Stage 0 and Stage 1 gates both pass**,
because the adapter that gets built depends entirely on the integration model,
and the integration model depends on answers we do not have. Stage 2 is frozen
independently.

### Prerequisite dates

**[INFERENCE] — an estimate, not a plan with committed resource.**
Stages 1–7 would need to complete before **19 December 2026** if advance
reservations are to open on that date — approximately five weeks from now, of which Stage 1 is
not in our control. If that proves too tight, the honest fallback is to open
advance reservations by enquiry on 19 December and switch on online booking when
Stage 9 passes, rather than rushing a payment flow.

---

*Prepared 16 November 2026. Assessment only — no booking functionality is
built, enabled or deployed by this document. Supersedes nothing; complements
`docs/aiosell-integration-plan.md` on `feature/aiosell-phase2`, which remains
the technical record of the channel-manager work.*
