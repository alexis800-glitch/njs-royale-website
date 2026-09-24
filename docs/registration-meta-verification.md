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

## Automated verification

- **50 unit tests** (`npm test`) — validation, normalisation, SHA-256 hashing,
  consent forgery, the honeypot-autofill rule, the rate-limit value and boundary,
  and the full service matrix: declined consent, validation failure, storage
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

## Preview database isolation — OUTSTANDING, required before Production

Neon's Vercel integration has **automatic preview branching** enabled. On the
first push to a Git branch it creates a Neon branch and injects **branch-scoped**
`DATABASE_URL` / `DATABASE_URL_UNPOOLED` into Vercel. A branch-scoped Preview
variable **overrides** a target-wide Preview variable, so any manually configured
Preview database is silently ignored.

Neon branches are copy-on-write clones **including the parent's data**. The parent
is the project's default branch, which is the Production database. That is
harmless today, because Production has no `registrations` table and no rows — but
once Production holds real guest registrations, **every future preview branch
would contain a copy of them**, reachable by anyone who can open a Preview
deployment.

This must be resolved before Production carries data. Either:

1. **Turn automatic preview branching off** in the Neon integration, delete the
   branch-scoped Vercel variables, and let Preview fall through to a dedicated,
   schema-only preview database; or
2. **Point preview branching at a schema-only parent branch** rather than at
   Production, so clones inherit the schema and no guest data.

Option 1 is the simpler guarantee. Both require a change in the Neon console,
which cannot be made through the Vercel API.

## Also outstanding

- **Legal review** of the privacy policy — the retention rule and the
  cross-border passages. Flagged in a comment above `LAST_UPDATED` in
  `app/privacy/page.tsx`.
- **Production database has no schema.** Running `npm run db:migrate` against it
  is a deliberate, separate step at launch.
- Vercel flags `readable-secret` on the integration-managed Production database
  variables. Untouched here.
