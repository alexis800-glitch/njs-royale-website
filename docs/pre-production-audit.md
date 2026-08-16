# NJS Royale Beach Resort — Pre-Production Audit (feature branch)

**Branch:** `website/resort-launch-corrections` · **Audited at:** commit `607a207` (+ docs commit) · **Production `main`:** `df9d27c` (untouched)
**Method:** offline — typecheck, production build, local serve, static scans, rendered-HTML checks.

## Verdict: ✅ READY for production promotion (pending Alex's go + the separate items below)
No blocking defects found. No code changes were required; the branch was already clean from the prior batches. This audit is verification + documentation only.

## Results
| Area | Result |
|---|---|
| Typecheck (`tsc --noEmit`) | ✅ 0 errors |
| Production build (`next build`) | ✅ success; routes `/`, `/privacy`, `/robots.txt`, `/sitemap.xml`, `/icon.png`, `/apple-icon.png`, `/_not-found` prerendered static |
| 404 behaviour | ✅ unknown route → HTTP 404 + "This page could not be found" |
| Navigation | ✅ Home, About, Daycation, Rooms & Suites, Dining, Wellness, Gallery, Contact — no Events |
| Internal anchors | ✅ all hash targets resolve (about, daycation, rooms, amenities, experiences, gallery, enquire, opening, rooftop) |
| Internal routes | ✅ `/` and `/privacy` |
| Phone links | ✅ all `tel:+2347075334158`; visible `0707 533 4158` |
| Hero | ✅ video hero preserved; reduced-motion shows manual "Play video" button |
| Announcement ribbon | ✅ navy/gold/ivory; motion-safe marquee; static + centred under `prefers-reduced-motion`; `sr-only` text for AT; mobile-readable |
| Daycation | ✅ authentic NJS sunset image (`njs-hero-sunset-poster.jpg`, pre-existing); "Opening this December" badge; Thu–Sun; leisure park/lounge/pool |
| Rooms | ✅ "Rooms Opening July 2027" badge + "Room reservations are not yet open." |
| Dining / Wellness / Gallery | ✅ present; unsupported claims removed |
| Contact (BookCTA) | ✅ canonical address + phone; no email; truthful CTAs (Call to Enquire / Plan Your Day) |
| Privacy Policy | ✅ `/privacy` renders; NDPA-2023; phone + postal contact; no invented email |
| Footer | ✅ "Privacy Policy" link → `/privacy`; no dead Events/Terms links |
| SEO metadata | ✅ title, description, canonical → `https://www.njsbeachresort.com`, OG + Twitter |
| robots / sitemap | ✅ `/robots.txt` + `/sitemap.xml` reference www canonical |
| JSON-LD | ✅ exactly one `@type: Resort` (name, url, `+2347075334158`, canonical PostalAddress, og image; no email/rating/price) |
| Favicon / OG assets | ✅ branded favicon/icon/apple-icon + `og.png` from official crest |
| Image alt text | ✅ every `<Image>`/`<img>` has alt |
| Reduced motion | ✅ ribbon static; hero autoplay suppressed with play control |
| Layout-shift / performance | ✅ `next/image` used throughout with sized containers; hero video with poster; no obvious CLS risk |
| Broken/missing media | ✅ all referenced assets exist in `public/` |

## Content-consistency scan (whole repo, context-aware) — all CLEAN
No user-facing occurrences of: Events · Weddings · Conferences · Corporate retreats · Reserve Now · Check Availability · priority booking · live availability · Richland/old address · `info@njsroyale.com.ng` · 253 Suites · Five-Star/5-star · four/signature restaurant counts · unsupported awards/ratings.

## Opening information — consistent everywhere
- **Daycation:** opens **this December**, **Thursday to Sunday**, leisure park + lounge + pool.
- **Rooms:** **reservations open from July 2027**, **not currently bookable**.
- No exact December date/year invented.

## Notes (non-blocking)
- `docs/aiosell-integration-plan.md` (pre-existing, internal, not user-facing) references a future Aiosell booking channel. Left unchanged — it is planning documentation, not published content, and predates this branch. Flagged for Alex's awareness only.
- Email intentionally absent site-wide. Intended future mailbox `reservations@njsbeachresort.com` documented in `google-workspace-setup.md`, not published.
- Enquiry form is design-only (`enquiry-form-design.md`); no form/`api`/`fetch`/webhook exists in the repo (verified).

## Guardrail scan (must stay true until Alex approves activation) — all TRUE tonight
- No `app/api/*` route · no `fetch(`/`axios`/`webhook`/`n8n` reference · no `<form>` that submits · no email/`mailto:` · no live-booking wording.
