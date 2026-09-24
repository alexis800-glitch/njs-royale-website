# Registration + Meta Conversions API — Preview verification record

Branch `feat/registration-meta-capi`. Preview only; nothing in this record was run
against Production.

## Meta Events Manager — confirmed by NJS Royale

Verified manually on the Preview deployment at **01:22, 24 September 2026**, in
Meta Test Events (test code held in `META_CAPI_TEST_EVENT_CODE`, Preview only):

| Check | Result |
|---|---|
| `CompleteRegistration` from **Browser** | received, **Processed** |
| `CompleteRegistration` from **Server** (Conversions API) | received, **Deduplicated** |
| Event ID shared by both copies | `b8cf1cad…` — identical |
| `PageView` | received, **Processed** |

Browser *Processed* plus Server *Deduplicated* under one event ID is the intended
outcome: Meta counts **one** registration, not two. This is the evidence that the
shared `event_id` works end to end; it cannot be observed from the application
side, where a successful Conversions API send only ever reports `status: "sent"`.

### Automatic website matching — verified OFF

Also checked in Events Manager for dataset **1030394620034055** on **24 September
2026: automatic website matching is OFF.**

This is compliance evidence, not housekeeping. Automatic advanced matching is a
dataset-level setting that, when on, has Meta's own script read form fields in the
browser — email addresses and telephone numbers among them — hash them and send
them, without the site asking it to and without appearing anywhere in this
codebase. Had it been on, it would have reintroduced in the browser precisely the
exposure removed from the server in `9f75341`: contact details reaching Meta for a
person who may never have typed their own.

With it off, the position is consistent on both sides:

| Path | Contact details sent to Meta |
|---|---|
| Conversions API (server) | None. `CapiIdentifiers` has no email or telephone field. |
| Pixel (browser), our own events | None. We send `PageView` and `CompleteRegistration` with an event id and nothing else. |
| Pixel (browser), Meta's automatic collection | None. `autoConfig` is set to `false` before `init`, **and** automatic website matching is off at the dataset. |

The `autoConfig: false` call and the dataset setting are independent controls and
both are needed: the first stops Meta's script collecting on its own in this
site's pages, the second stops it at the account level for every page in the
dataset. Belt and braces, deliberately.

**If this setting is ever turned on, the privacy policy becomes inaccurate**, since
it states that we send Meta no email address or telephone number at all. Re-check
it after any change to the dataset's settings.

## Automated verification

- **51 unit tests** (`npm test`) — validation, normalisation, consent forgery, the honeypot-autofill rule, the IP-salt fail-safe, the absence
  of contact details from the Meta payload, the rate-limit value and boundary, and
  the full service matrix: declined consent, validation failure, storage
  failure, Meta failure, duplicate submission, honeypot, too-fast, rate limit and
  log hygiene.
- **Browser suite** against the Preview deployment — durable storage with the row
  read back from Postgres, one browser `CompleteRegistration` carrying the
  server's event id, declined consent storing the registration with zero Meta
  traffic, repeat submissions collapsing to one row, double-click protection,
  route exclusions, and no secret in any client bundle or in the HTML.

Server logs were checked directly in Vercel: they carry only `event`, `kind`,
`eventId`, `status` and `category` — no personal data, no hashes, no tokens.

## Defects found during Preview testing, and fixed

| Defect | Fix |
|---|---|
| A database error escaped as an unhandled 500 with an empty body | `2ed004f` — graceful 503 plus a surrounding catch in the route |
| Error logs said only `"error"`, which is useless for diagnosis | `98186ad` — log the SQLSTATE/system code; never the message, which can quote data |
| Browser autofill filled the honeypot (`company`), silently refusing every guest who used autofill | `6999b6c` — neutral field name and label, vendor opt-outs, and a regression test |
| Rate limit of 5 per IP per hour too tight for shared NAT addresses | `7b27e67` — raised to 20, with a boundary test |

## Preview database isolation — RESOLVED

**The problem.** Neon's Vercel integration had automatic preview branching enabled.
On the first push to a Git branch it created a Neon branch and injected
**branch-scoped** `DATABASE_URL` / `DATABASE_URL_UNPOOLED` into Vercel. A
branch-scoped Preview variable **overrides** a target-wide one, so the Preview
database that had been configured deliberately was silently ignored — which is
also why registrations first failed with `42P01`: right server, right credentials,
a database nobody had migrated.

The real risk was not the failure but the mechanism. Neon branches are
copy-on-write clones **including the parent's data**, and the parent is the
project's default branch — Production. Harmless while Production was empty; once
it holds guest registrations, every future preview branch would have contained a
copy, reachable by anyone able to open a Preview deployment.

**What was done.**

1. The **Neon–Vercel integration is disconnected**, so no further branch-scoped
   variables can be created and no preview branch will be cloned from Production.
2. The two stale branch-scoped variables were neutralised: renamed to
   `UNUSED_NEON_AUTOBRANCH_DATABASE_URL` and
   `UNUSED_NEON_AUTOBRANCH_DATABASE_URL_UNPOOLED` so they no longer shadow
   `DATABASE_URL`, **and their values overwritten** so no live credential for the
   old auto-created branch remains in Vercel. They are inert and can be deleted
   from the dashboard at any time.
3. Preview now resolves the manually configured, target-wide `DATABASE_URL`,
   pointing at a dedicated preview branch that has never held Production data.
4. Confirmed by redeploying and registering successfully against Preview. Had the
   override still applied, the connection string would have been the placeholder
   text and the endpoint would have returned 503.

**Standing rule.** `DATABASE_URL` is set manually, per environment. If the Neon
integration is ever reconnected, automatic preview branching must stay off, or its
parent must be a schema-only branch — never Production.

## Consent: what the server can and cannot check

Worth stating plainly, because it is easy to overclaim. Marketing consent is given
in the browser, so the consent record submitted with a registration is
client-supplied and **cannot be authenticated**.

The server validates that the record is complete, at the current consent version,
and carries a plausible decision time, and refuses to send anything to Meta
otherwise. **That prevents accidental transmission** — defaults, stale records,
version drift after the purposes change, client bugs.

It does **not** authenticate consent. A deliberately crafted request can carry a
consent record that looks entirely correct, and no client-supplied signal could
prevent that: a signed token would be obtainable by an attacker exactly as the
browser obtains it.

It also does **not** prove ownership of the submitted contact details. Someone can
enter a third party's email address and telephone number, assert consent, and cause
the SHA-256 of that person's details to be sent to Meta, who can match a hash back
to the person. Hashing protects those values in transit and at rest; it does not
make that person's participation consensual.

### Residual risk — CLOSED by not sending contact details

Option 3 below was chosen and implemented. `em` and `ph` are no longer sent to the
Conversions API at all: the payload carries the Meta cookies (`_fbp` / `_fbc`),
the IP address and the user agent, and nothing else. `CapiIdentifiers` has no
email or telephone field, so contact details cannot be passed to that module even
by mistake, and `lib/meta/hash.ts` was deleted rather than left as dead code
waiting to be rewired.

The options considered were:

1. NJS Royale's data-protection adviser explicitly accepts the residual risk.
2. Ownership is verified before any Meta event — a confirmation link to the
   submitted address, or validation of the invitation code against an issued list.
3. **`em` and `ph` are omitted from the Conversions API payload.** ← chosen

Option 3 removes the exposure outright rather than documenting it, and needs no
new infrastructure. The cost is Meta match quality, which is a marketing
trade-off. Option 2 remains available later if match quality proves inadequate,
and would make sending contact details defensible because ownership would then
have been demonstrated.

Tests that hold this in place:

- `there is no em and no ph, hashed or otherwise` — asserts the built event has no
  `em` or `ph` field, contains neither the raw email nor the raw telephone, neither
  of their SHA-256 hashes, and **no SHA-256-shaped value anywhere**, so a future
  identifier cannot slip in unnoticed.
- `the access token is sent in the body, never in the URL` — additionally asserts
  the payload actually put on the wire carries no contact details and no hashes.
- `user data carries cookies, IP and user agent — and nothing else` — pins the
  exact key set.

The privacy policy states this plainly: we do not send Meta the email address or
telephone number at all, not even hashed, and it explains why.

Confirmed on the Meta side as well: **automatic website matching is OFF** for the
dataset, verified 24 September 2026 — see above. Without that, Meta's own script
could have collected contact details in the browser regardless of what this
codebase sends.

See `lib/meta/consent.ts`.

## Also outstanding

- **Legal review** of the privacy policy — the retention rule and the
  cross-border passages. Flagged in a comment above `LAST_UPDATED` in
  `app/privacy/page.tsx`.
- ~~A decision on the consent residual risk~~ — **closed**: email and telephone
  hashes were dropped from the Conversions API entirely (see above).
- **Production database has no schema.** Running `npm run db:migrate` against it
  is a deliberate, separate step at launch.
- Vercel flags `readable-secret` on the integration-managed Production database
  variables. Untouched here.
