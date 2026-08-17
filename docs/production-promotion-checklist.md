# Production Promotion — Safe Morning Procedure (PREPARED, NOT EXECUTED)

> **Do not execute tonight.** This is the exact sequence to promote `website/resort-launch-corrections` to Production after Alex approves. Promotion happens by merging to `main` (Vercel auto-deploys `main` → Production → www.njsbeachresort.com).

## Facts at handover
- Feature branch: `website/resort-launch-corrections`
- Feature HEAD: `607a207d7f9f0295646e3a54b1743a3d0f7e106d` (+ any new local commits — see handover; **local commits are NOT pushed**, so the remote branch may be behind local until pushed)
- Production `main`: `df9d27c6633ac0653e76c0fd32f4c8ae7d6515ad`
- Current Production deployment: `dpl_FCdBsvRQgDnz5VGgPoGZG2ZdmqnP` (rollback target)
- Vercel project: `njs-royale-website` (`prj_B0sjY9TGdLV81HGZJxjPAPQYEAuK`), team `veridion-systems-projects`

## Pre-flight (before merging)
1. `git fetch origin`; confirm `origin/main` is still `df9d27c` (unchanged since audit).
2. If there are unpushed local commits on the feature branch, review them (`git log origin/website/resort-launch-corrections..HEAD`) and **push** them: `git push origin HEAD:refs/heads/website/resort-launch-corrections` (no force).
3. Confirm the latest **Preview** deployment for the branch tip is `READY` and `target: null`, and visually approved.
4. `npx tsc --noEmit` → 0; `npm run build` → success. Content scans clean (see audit).
5. Confirm no `app/api/*`, no `fetch`/webhook, no form that submits, no email, no live-booking wording (guardrail scan).

## Merge → Production
6. Open PR: base `main` ← compare `website/resort-launch-corrections`. Review the diff (23 files batch-1 + revision commits).
7. Merge the PR (prefer "Create a merge commit" to preserve history; squash is also fine). This updates `main`.
8. Vercel automatically builds `main` and deploys to **Production**. Watch the deployment reach `READY` with `target: "production"`.

## Post-deploy verification (on www.njsbeachresort.com)
9. `curl -sI https://www.njsbeachresort.com` → 200; `http→https` 308; `non-www→www` 308; HSTS present (unchanged infra).
10. Homepage renders: video hero, announcement ribbon, Daycation (sunset image), Rooms "July 2027" badge, Dining/Wellness/Gallery, contact, footer "Privacy Policy" link.
11. Routes 200: `/`, `/privacy`, `/robots.txt`, `/sitemap.xml`, `/icon.png`, `/apple-icon.png`, `/favicon.ico`, `/og.png`.
12. `robots.txt` + `sitemap.xml` reference `https://www.njsbeachresort.com`; canonical on `/` = `https://www.njsbeachresort.com`.
13. Content scan on live: no Events/weddings/conf/retreat, no Reserve Now/Check Availability, no Richland, no `info@njsroyale.com.ng`, no 253/five-star/four-signature.
14. Contact: canonical address + phone `0707 533 4158` (`tel:+2347075334158`); no email present.
15. Mobile spot-check; reduced-motion spot-check (ribbon static, hero play-button).

## Rollback (if any check fails)
- **Fastest:** Vercel → Project → Deployments → select the previous production deployment `dpl_FCdBsvRQgDnz5VGgPoGZG2ZdmqnP` (`df9d27c`) → **Promote to Production** / **Instant Rollback**. This restores the old site in seconds without a git change.
- **Git-level:** `git revert <merge-commit>` on `main` and push; Vercel redeploys the reverted `main`.
- Do not force-push `main`. Prefer Vercel instant rollback for speed, then reconcile git.

## Notes
- Domain/DNS unchanged by promotion (same Vercel project + domain).
- Enquiry form, n8n, email remain out of scope for this promotion — this ships the corrected marketing site only.
