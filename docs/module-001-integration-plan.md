# Enquiry → Module 001 → n8n → Lead Capture → Staff Workflow (FUTURE PLAN)

> **Status:** plan only. **Do NOT change live n8n. Do NOT create API routes or webhooks tonight.** The live n8n Module Config still has an **empty allowlist**; the repository Module 001 allowlist already contains the three approved categories. This document is the step-by-step activation sequence for when Alex approves.

## Approved category allowlist (must match everywhere, exactly)
- `Accommodation / Room Stay`
- `Beach Resort`
- `General Enquiry`

These strings must be identical in: the form `<select>` options, the API validation, the repo Module 001 config, and the live n8n Module Config. A mismatch = rejected leads.

## Target flow
```
Website enquiry form (browser)
   │  POST (same-origin)
   ▼
Next.js route handler  app/api/enquiry/route.ts   ← does not exist yet
   │  validate + persist lead (DB) + attach consent/timestamp/category
   ▼
Module 001 (server-side dispatch, category-gated by allowlist)
   │  signed request / queue
   ▼
n8n workflow (lead intake)   ← LIVE allowlist currently EMPTY (must be set)
   │  normalise → dedupe → store → notify
   ▼
Lead capture (DB / sheet / CRM)
   ▼
Staff workflow (assignment, callback, status)
```

## Phased activation (each phase reversible; nothing runs until the phase before is signed off)

**Phase A — Groundwork (offline, safe now if approved):**
1. Build the form UI per `enquiry-form-design.md` behind a feature flag, still inert (no `action`, no `fetch`).
2. Add DB schema for `leads` (name, phone, email?, category, message, party_size, dates_text, consent_at, policy_version, source, created_at, status, sync_status). Reuse the existing Neon/Drizzle setup pattern from the Aiosell work; do not touch Aiosell tables.

**Phase B — Internal endpoint (no external calls yet):**
3. Add `app/api/enquiry/route.ts` (POST). Server-side: validate, enforce allowlist, honeypot + time check + rate limit, persist lead with `sync_status = not_pushed`. Return success/error JSON. **Still no call to n8n** — leads land in the DB only. This is safe to run in production because it only writes to our own DB.
4. Wire the form to POST to this route. QA end-to-end into the DB.

**Phase C — Module 001 dispatch (staging first):**
5. Implement Module 001 forwarder: reads `not_pushed` leads, sends to n8n **staging** webhook, records `sync_logs` (redacted), sets `sync_status = synced|failed`, idempotent by lead id. Mirror the Aiosell push/audit pattern (payment-gate not applicable here).
6. Set the **n8n allowlist** to the three approved categories **in staging**, verify the workflow accepts and routes each category, rejects anything else.

**Phase D — Go-live (requires Alex + explicit approval):**
7. Point Module 001 at the **live** n8n webhook; set the **live** n8n Module Config allowlist to the three categories (this is the "live n8n change" that is off-limits tonight).
8. Smoke-test one lead per category end-to-end; confirm staff notification + lead capture.
9. Enable the form for the public.

## Guardrails
- Enquiry is **not** booking: no availability, no confirmation, no payment. Copy stays "we'll call you back".
- Secrets (n8n webhook URL/token) via env vars only — never committed. `.env*` already gitignored.
- Rate limit + honeypot before any dispatch to protect n8n from spam.
- Every dispatch audited in `sync_logs` with PII redacted.
- Category value from client is validated against the server allowlist; never forwarded raw.

## Tonight's boundary
None of Phases A–D are executed tonight. The repo remains with **no `app/api/*`, no `fetch`, no webhook, no form that can submit.** Live n8n unchanged.
