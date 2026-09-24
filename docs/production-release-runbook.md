# Production release runbook — PR #15, registration + Meta Conversions API

For whoever runs the release. Work from the repository root of a clean checkout of
`feat/registration-meta-capi` (or of `main` once merged).

Nothing in this runbook may begin until the blocker in §1 is cleared.

---

## 1. Blocker — written approval of the privacy wording

**Do not merge, migrate or deploy until this is in writing.**

`app/privacy/page.tsx` carries a comment above `LAST_UPDATED` naming three
passages that need NJS Royale's confirmation, not engineering's:

1. **Section 2, "How long we keep it"** — a retention *rule* tied to the event.
   No specific period has been invented. If the adviser wants a fixed period,
   it must be written in before release.
2. **Sections 2 and 11, the cross-border position** — registrations are held in
   AWS `eu-west-2` (London). That the database sits there is a fact; whether the
   NDPA transfer conditions are met is a legal judgement.
3. **Section 11, the Meta Platforms Ireland transfer** — now covering cookies,
   IP address and user agent only, since no contact details are sent to Meta.

Record the approval (who, when, which version of the page) before proceeding.

---

## 2. The ordering that matters

**Merging triggers a Production deployment automatically.** Vercel builds `main`
to Production on push. So the database must be migrated *before* the merge, not
after — otherwise the first guest to register on the live site meets
`relation "registrations" does not exist`, the endpoint returns 503, and they are
told to telephone instead.

Migrating first is safe: the Production code at that moment does not use the
table, so an unused table simply sits there.

```
  approval  →  §3 pre-flight  →  §4 MIGRATE  →  §5 merge (auto-deploys)  →  §6 verify
```

---

## 3. Pre-flight checks

Run from the branch, before touching Production.

```bash
git fetch origin
git status --short                 # must be clean
git log --oneline origin/main..HEAD

npm ci
npm run typecheck                  # tsc --noEmit
npm test                           # 51 unit tests
NEXT_PUBLIC_META_PIXEL_ID=1030394620034055 npx next build
npx next build                     # again with no Pixel ID: tracking must disable cleanly
```

Confirm in Vercel (names and targets only — sensitive values cannot be read back):

| Variable | Production | Preview |
|---|---|---|
| `DATABASE_URL` | present | present |
| `REGISTRATION_IP_SALT` | present, Sensitive, ≥16 chars | present |
| `META_CAPI_ACCESS_TOKEN` | present, Sensitive | present |
| `NEXT_PUBLIC_META_PIXEL_ID` | present | present |
| `META_CAPI_TEST_EVENT_CODE` | **MUST BE ABSENT** | present |

**`META_CAPI_TEST_EVENT_CODE` must never be set in Production.** If it is, every
real conversion is diverted into Meta's Test Events tool and stops counting. It
was briefly mis-scoped to Production during development and corrected; check it
again here rather than assuming.

### A risk specific to this release

The Production `DATABASE_URL` was created by the Neon–Vercel integration, and
**that integration has since been disconnected**. The credentials are expected to
remain valid — disconnecting the integration does not delete the Neon role — but
this has not been proven against Production. The `--dry-run` in §4 connects
without writing and is the cheapest way to find out. Do it before release day,
not during it.

---

## 4. Migrate the Production database

The schema has never been applied to Production. This is deliberate and is a
separate, explicit step.

Use the **direct (unpooled)** Production connection string — pooled PgBouncer in
transaction mode cannot run this DDL reliably. Pass it through a file so it never
enters a shell history, a process listing or a chat transcript:

```bash
umask 077
SECRET=~/njs-prod-db-url.txt        # create, paste the DIRECT Production string, save
chmod 600 "$SECRET"

# 1. Confirm the target WITHOUT writing anything. Prints host and database only.
DATABASE_URL="$(tr -d '[:space:]' < "$SECRET")" node scripts/migrate.mjs --dry-run
```

**Check the printed host before going further.** It must be the Production Neon
branch. It must **not** be either preview endpoint:

- ❌ `ep-calm-forest-zaw130d9` — the manual preview branch
- ❌ `ep-noisy-water-zawomp4p` — the old auto-created preview branch

```bash
# 2. Apply. Idempotent: create extension / table / indexes are all IF NOT EXISTS.
DATABASE_URL="$(tr -d '[:space:]' < "$SECRET")" node scripts/migrate.mjs

# Expect: "Applied 001_registrations.sql"
#         "registrations: 25 columns, 5 indexes, 0 rows"

# 3. Shred the file.
rm -P "$SECRET"
```

The migration adds only a table, indexes and the `pgcrypto` extension. It drops
nothing and alters nothing that already exists.

---

## 5. Merge and deploy

```bash
# Confirm the PR is still mergeable and the base has not moved underneath it.
gh pr view 15 --json mergeable,mergeStateStatus,baseRefName
```

Merge PR #15 into `main` through GitHub. Vercel builds `main` to Production
automatically; watch the deployment reach **READY** before going on.

Do not promote or roll back anything else while this is in flight.

---

## 6. Verification on Production

### 6.1 The site still works

- `/` , `/careers`, `/privacy`, `/terms` all load.
- `/first-look` and `/founding-guest` load. Both remain `noindex` and out of the
  sitemap — deliberate, since they are reached from a printed invitation rather
  than from search. **Decide explicitly whether that stays**; if these pages
  should be findable, removing `noindex` is a separate change.
- `/privacy` shows the approved wording, including that no email address or
  telephone number is sent to Meta.

### 6.2 One real registration, end to end

Use a real address and telephone you control. Accept marketing cookies.

- The confirmation panel appears.
- The row exists in the **Production** database:
  ```sql
  select kind, source_path, consent_marketing, meta_status, created_at
    from registrations order by created_at desc limit 5;
  ```
- `meta_status` is `sent`.
- `ip_hash` is 64 hex characters, and the IP address itself appears nowhere.

### 6.3 Meta, live — not Test Events

`META_CAPI_TEST_EVENT_CODE` is Preview-only, so this event must arrive as a
**normal conversion**, not a test event. In Events Manager for dataset
`1030394620034055`:

- `CompleteRegistration` present from **Browser** and from **Server**.
- Both carry the **same event ID**; Meta reports the pair as **deduplicated**,
  counting one registration.
- Action source **Website**; event source URL is the live `njsbeachresort.com` URL.
- The event does **not** appear under Test Events.
- **Automatic website matching remains OFF** for the dataset. If it is ever turned
  on, the privacy policy becomes inaccurate — see
  `docs/registration-meta-verification.md`.

### 6.4 Declined consent

In a fresh browser profile, decline cookies and register.

- The registration succeeds.
- No Meta script loads at all, and no event appears in Events Manager.
- The row shows `consent_marketing = false` and `meta_status` null.

### 6.5 Logs

In Vercel's runtime logs for the Production deployment, `/api/registrations`
entries must contain only `event`, `kind`, `eventId`, `status`, `category` — no
names, email addresses, telephone numbers, invitation codes, IP addresses, hashes
or tokens.

### 6.6 Tidy up

Delete the smoke-test rows from Production:

```sql
delete from registrations where email = '<the address you used>';
```

---

## 7. Rollback

### What the levers actually are

**Vercel environment variables are applied at build time.** Removing a variable
does not take effect until something is rebuilt, so "delete the token" is not an
instant off switch. The instant lever is the deployment itself.

| Situation | Action |
|---|---|
| Registration broken, or anything unexpected | In Vercel, **promote the previous Production deployment** (commit `147432d`, the state before this release). Instant, and restores the site to Phase 1 — consent banner and Pixel PageView, no registration endpoint. |
| Needs to be undone in git as well | `git revert -m 1 <merge-commit>` on `main` and push. Produces a fresh Production build without the registration code. |
| Only the Meta side is wrong | Rolling back the deployment stops it. There is no faster switch, for the reason above. |

### The database on rollback

**Leave the schema in place.** The table is additive and unused by the rolled-back
code, so it costs nothing. **Do not drop it**: by then it may hold real guest
registrations, and dropping it destroys them. If the release is abandoned
permanently, export the rows first and dispose of them under the retention rule in
the privacy policy.

### What cannot be rolled back

Meta events already delivered. If a registration was reported in error, it must be
handled through Meta's own deletion tooling, not by redeploying.

---

## 8. After a successful release

- Record the release: date, commit, who approved the privacy wording.
- Delete the two inert Vercel variables if still present:
  `UNUSED_NEON_AUTOBRANCH_DATABASE_URL`, `UNUSED_NEON_AUTOBRANCH_DATABASE_URL_UNPOOLED`.
- Consider Vercel's `readable-secret` flag on the Production database variables —
  marking them Sensitive, or rotating them in Neon.
- **The rate limit is 20 registrations per IP hash per hour.** On the day itself a
  venue, hotel lobby or coach party shares one NAT address. If guests will
  register on site over shared wifi, raise it beforehand in
  `lib/registrations/service.ts` (`RATE_LIMIT_MAX`) — a test pins the value, so it
  will need updating with it.
- Neon preview branching must stay off. If the integration is ever reconnected,
  its preview branches must not be parented on Production, or every preview branch
  will contain a copy of real guest registrations.
