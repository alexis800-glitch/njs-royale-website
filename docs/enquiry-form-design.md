# NJS Royale Beach Resort — General Enquiry Form (OFFLINE DESIGN ONLY)

> **Status:** design specification. **Not built, not wired, not activated.** No form element that can submit currently exists on the site. This document describes how the future enquiry form should be built when Alex approves activation. Nothing here calls n8n, Module 001, email, or any external API.

## 1. Purpose & placement
A single, restrained enquiry form serving the three approved public categories:
- **Accommodation / Room Stay** (interest ahead of rooms opening July 2027 — not a booking)
- **Beach Resort** (daycation: leisure park, lounge, pool — Thursday to Sunday, from December)
- **General Enquiry**

Placement: a new `#enquire` form block (replacing//augmenting the current contact CTA), or a dedicated `/enquire` route. It must never imply live availability, instant booking, confirmed reservation, priority booking, or online payment.

## 2. Fields (minimal)
| Field | Type | Required | Notes |
|---|---|---|---|
| Full name | text | yes | 2–80 chars |
| Phone | tel | yes | NG format; used as primary contact until email mailbox exists |
| Email | email | optional | valid email if provided (site has no mailbox yet, but guests may leave theirs) |
| Enquiry type | select | yes | Accommodation / Room Stay · Beach Resort · General Enquiry (must match Module 001 allowlist exactly) |
| Preferred dates | text/date range | optional | free-text or date pickers; **labelled "indicative only — not a booking"** |
| Party size | number | optional | 1–20 |
| Message | textarea | optional | 0–1000 chars |
| Consent | checkbox | yes | see §4 |
| Honeypot | hidden text | — | anti-spam (see §5) |

Keep it to name + phone + type + message as the core; everything else optional. No payment, card, passport, or sensitive fields.

## 3. Validation
- Client-side: required-field checks, email/phone pattern, max-lengths, inline error messages, `aria-invalid` + `aria-describedby` on errored fields, focus moves to first error.
- Server-side (when built): re-validate everything; never trust the client. Enquiry type must be one of the allowlisted values; reject otherwise.
- Progressive enhancement: the form should be usable and validated without JS where feasible (native `required`, `type=email/tel`, `maxlength`).

## 4. Privacy notice & consent
- Point-of-collection notice beside the submit button: *"We use these details only to respond to your enquiry. See our [Privacy Policy](/privacy)."*
- Required consent checkbox (unticked by default): *"I agree that NJS Royale Beach Resort may use my details to respond to this enquiry."*
- Lawful basis: consent + steps taken at the data subject's request (already documented in `/privacy`).
- No pre-ticked boxes; no bundled marketing consent (a separate, optional opt-in may be added later if desired).
- On submit, record consent timestamp + policy version alongside the lead.

## 5. Anti-spam (no third-party tracker)
Layered, privacy-friendly, no external captcha that sets tracking cookies unless approved:
1. **Honeypot** hidden field — bots fill it, humans don't; reject if non-empty.
2. **Time-to-submit** check — reject submissions faster than ~2s.
3. **Server-side rate limiting** per IP (e.g. 5/hour) when the API exists.
4. Optional later: Cloudflare Turnstile / hCaptcha (privacy-respecting) — only if spam volume warrants; disclose in Privacy Policy if added.

## 6. Success / error UX
- **Submitting:** button disabled + spinner + "Sending…"; prevent double-submit.
- **Success:** inline confirmation panel (no redirect): *"Thank you — we've received your enquiry and will call you back. For anything urgent, call 0707 533 4158."* Clear the form; move focus to the confirmation for screen readers (`role="status"`).
- **Error:** non-destructive inline message preserving entered values: *"Something went wrong. Please try again, or call us on 0707 533 4158."* Never lose the user's input.
- All states must be keyboard- and screen-reader-accessible and respect `prefers-reduced-motion`.

## 7. Design language
Navy `#0A1628` / gold `#C9A84C` / ivory `#F5F0E8`; Cormorant Garamond headings, Inter fields; generous spacing; thin borders; restrained. Matches the existing site (BookCTA / Daycation styling).

## 8. Eventual connection (see module-001-integration-plan.md)
When activated, the form POSTs to an internal Next.js **route handler** (`app/api/enquiry/route.ts`) which validates, persists the lead, and forwards to Module 001 → n8n. **Until Alex approves, no `app/api/*` route, no `fetch`, no webhook, and no form element that can submit will exist in the repo.** The current site has none of these (verified by scan).

## 9. Inert-preview option (if a visual is wanted before activation)
A form may be shown with fields disabled or with `onSubmit` calling `preventDefault()` and doing nothing except showing the success panel locally — **provided it has no `action`, no `fetch`, no network call of any kind**. Preferred: keep it as this spec until activation, to eliminate any risk of accidental submission.
