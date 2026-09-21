# First Look registration — proposed Privacy Policy wording (DRAFT, not live)

Status: **for review only.** None of this wording is published. The live
[Privacy Policy](../app/privacy/page.tsx) has not been changed, and it stays accurate
because the Preview form at `/first-look` does not transmit, email, save or store
anything.

Add this wording only **after** the registration and data-management method has been
chosen and set up. Placeholders in `[square brackets]` must be settled by NJS Royale
(and, where needed, its data-protection adviser) before publishing. This draft
deliberately gives **no retention period**. One must be decided, not invented.

---

## Proposed new section: "First Look guest registration"

When you register as a First Look guest at `njsbeachresort.com/first-look`, we collect:

- your invitation or reference code;
- your full name, email address and mobile/WhatsApp number;
- whether you will attend on 12 December 2026, and the number attending (one or two);
- your companion's full name, if you are bringing one; and
- whether you have asked to hear about the NJS Royale Grand Opening on 23 July 2027.

**Why we use it.** We use this information to verify your invitation, confirm your RSVP,
prepare your guest privileges and manage entry on the day. If you are bringing a
companion, please make sure they are happy for you to share their name with us.

**Lawful basis.** [To confirm under the NDPA 2023. For example: taking steps at your
request to confirm your attendance, and our legitimate interest in managing a private
invitation-only event safely.]

**Grand Opening updates (optional).** We will contact you about the Grand Opening only
if you tick the optional box. It is never ticked for you. You can withdraw your consent
at any time by emailing info@njsbeachresort.com.

**Who can see it.** [Name the service provider(s) that will receive or store
registrations, e.g. the form or email provider, once chosen.] We do not sell your
personal data.

**How long we keep it.** [Retention period to be decided by NJS Royale. Do not publish
this section until it is.]

**Registering does not guarantee entry.** Registration does not by itself guarantee
entry or benefits. Invitations and guest privileges remain subject to invitation
verification and RSVP confirmation.

## Consequential edits to review at the same time

1. **Section 1, "Current state of data processing"** currently says the site "does not
   operate an active enquiry or contact form" and "we currently do not collect personal
   data through this website". Once registration is live this must be updated, and the
   "Last updated" date changed.
2. Your rights, and how to exercise them, should cover registration data. Check the
   existing rights section still applies unchanged.

## Engineering notes for the live version

- Keep the invitation list and eligibility checks **server-side only**. Never ship a
  guest list or valid-code list to the browser.
- Remove `robots: noindex` from `app/first-look/page.tsx` only when the workflow is
  approved, and add `/first-look` to `app/sitemap.ts` at the same time if it should be
  indexed.
- The proof routes under `/first-look/proofs/*` already return 404 on Production
  (`VERCEL_ENV === 'production'`). Decide whether to delete them before merging.
