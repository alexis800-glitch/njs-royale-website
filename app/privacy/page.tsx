import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How NJS Royale Beach Resort collects, uses and protects personal data, in line with the Nigeria Data Protection Act 2023.',
  alternates: { canonical: '/privacy' },
}

// LEGAL REVIEW REQUIRED before this policy is published to Production.
//
// Three passages state legal positions that NJS Royale — and, where needed, its
// data-protection adviser — must confirm, not engineering:
//   1. Section 2, "How long we keep it": a retention *rule* tied to the event, not
//      a fixed period. A specific period has deliberately not been invented.
//   2. Section 2 and section 11, the cross-border position: registrations are held
//      in AWS eu-west-2 (London), which is a factual statement of where the Neon
//      database sits; whether the NDPA transfer conditions are met is a legal one.
//   3. Section 11, the transfer of advertising data to Meta Platforms Ireland.
//      Note that no contact details are sent to Meta at all, hashed or otherwise
//      (see lib/meta/capi.ts), so this transfer covers cookies, IP address and
//      user agent only.
const LAST_UPDATED = '23 September 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-[family-name:var(--font-cormorant)] text-white text-2xl mb-3">{title}</h2>
      <div className="space-y-3 text-white/60 text-[15px] leading-relaxed font-[family-name:var(--font-inter)]">
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPolicy() {
  return (
    <main className="bg-navy min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3" aria-label="NJS Royale Beach Resort — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/njs-logos/njs-crest-mark.png" alt="NJS Royale crest" className="h-10 w-auto" />
          <span className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-cormorant)] text-white text-lg tracking-wide">
              NJS Royale
            </span>
            <span className="text-gold text-[8px] uppercase tracking-[3.5px] mt-0.5 font-[family-name:var(--font-inter)]">
              Beach Resort
            </span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-gold hover:text-white text-[11px] uppercase tracking-[0.15em] transition-colors duration-300 font-[family-name:var(--font-inter)]"
        >
          Back to site
        </Link>
      </header>

      {/* Body */}
      <article className="max-w-3xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
        <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
          Legal
        </p>
        <h1 className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-2" style={{ fontSize: 'clamp(40px, 6vw, 60px)' }}>
          Privacy Policy
        </h1>
        <p className="text-white/40 text-sm mb-8 font-[family-name:var(--font-inter)]">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="font-[family-name:var(--font-cormorant)] text-white/80 text-xl leading-relaxed">
          This Privacy Policy explains how NJS Royale Beach Resort (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;) handles personal data in connection with this website. It is written to be
          consistent with the Nigeria Data Protection Act 2023 (the &ldquo;NDPA&rdquo;) and applies to
          visitors to this site.
        </p>

        <Section title="1. Current state of data processing">
          <p>
            This website is mainly an informational site. It does not process payments and does not run a
            live online booking engine, and it has no general enquiry or contact form.
          </p>
          <p>
            Two pages do collect personal data: the First Look guest registration at{' '}
            <span className="text-white/80">/first-look</span> and the Founding Guest activation at{' '}
            <span className="text-white/80">/founding-guest</span>, both of which are reached from a
            printed invitation. Section 2 sets out exactly what those forms collect, why, where it is
            stored and for how long.
          </p>
          <p>
            We use one optional marketing tool, the Meta Pixel, and only if you accept it. It is switched
            off unless you choose &ldquo;Accept&rdquo;, and you can withdraw that choice at any time.
            Section 12 explains exactly what it does and what Meta receives. If you decline, no Meta code
            loads and no Meta cookies are set.
          </p>
          <p>
            If you contact us using the telephone number or email address provided, we will receive the
            information you choose to share in order to respond to you.
          </p>
          <p>
            Our homepage also offers an optional interactive Google Maps view of the resort&rsquo;s
            location, which loads only if you choose to open it. Section 12 explains what that involves.
          </p>
        </Section>

        <Section title="2. Invitation registration (First Look and Founding Guest)">
          <p>
            If you were given an NJS Royale invitation, you can register your attendance on one of two
            pages. Registration is optional, and both forms tell you at the point of collection what they
            are for.
          </p>

          <p className="text-white/80">What we collect</p>
          <p>
            On the <span className="text-white/80">First Look guest</span> page: your invitation or
            reference code; your full name; your email address; your mobile or WhatsApp number; whether
            you will attend on 12 December 2026; how many people will attend (one or two); your
            companion&rsquo;s full name if you are bringing one; and whether you have asked to hear about
            the Grand Opening.
          </p>
          <p>
            On the <span className="text-white/80">Founding Guest</span> page: your invitation or
            reference code; the primary guest&rsquo;s full name; your email address; your mobile or
            WhatsApp number; the second guest&rsquo;s full name; your confirmation of the stay from 23 to
            25 July 2027; your expected arrival time; anything you add about your arrival; and whether you
            have asked to receive NJS Royale updates.
          </p>
          <p>
            With either form we also record which page you registered on, the date and time, your
            browser&rsquo;s user-agent string, and a one-way hash of your IP address. The hash is used only
            to limit automated submissions; we do not keep the address itself.
          </p>

          <p className="text-white/80">Why we use it</p>
          <p>
            To verify your invitation, confirm your RSVP, prepare your guest privileges and manage entry on
            the day &mdash; and, for Founding Guests, to prepare your accommodation. If you are registering
            a companion or second guest, please make sure they are content for you to give us their name.
          </p>
          <p>
            We rely on your consent, given when you submit the form, and on taking steps at your request to
            confirm your attendance. Updates about the Grand Opening or about NJS Royale are sent only if
            you tick the optional box, which is never ticked for you; you can withdraw that consent at any
            time by emailing{' '}
            <a href="mailto:info@njsbeachresort.com" className="text-gold hover:text-white transition-colors">
              info@njsbeachresort.com
            </a>
            .
          </p>

          <p className="text-white/80">Where it is stored</p>
          <p>
            Registrations are stored in a Postgres database provided by Neon, reached only from the server
            side of this website, which is hosted by Vercel. The database is located in Amazon Web
            Services&rsquo; Europe (London) region, <span className="text-white/80">eu-west-2</span>, so
            registration data is stored in the United Kingdom. Both Neon and Vercel are processors acting
            on our instructions; section 11 explains how we approach transfers outside Nigeria. We do not
            sell your personal data, and we do not publish invitation lists or guest details on this
            website.
          </p>

          <p className="text-white/80">How long we keep it</p>
          <p>
            We keep a registration until the event it relates to has taken place, and then only for as long
            as we reasonably need it to deal with anything arising from it or to meet a legal or
            record-keeping obligation. After that it is deleted or securely disposed of.
          </p>

          <p className="text-white/80">What Meta is told</p>
          <p>
            If &mdash; and only if &mdash; you have accepted optional marketing cookies, we also tell Meta
            that a registration was completed, so that we can measure our advertising. What we send is
            limited to your IP address, your browser&rsquo;s user-agent string, the address of the
            registration page, and the Meta cookies described in section 12 if your browser has them.
          </p>
          <p>
            <span className="text-white/80">
              We do not send Meta your email address or telephone number at all
            </span>
            , not even in hashed form, and we do not send your name, your invitation code, your
            companion&rsquo;s name, your arrival time or anything you wrote in the notes. We made that
            choice deliberately: a registration form cannot show that the person filling it in owns the
            contact details they type, so sending those details could identify someone who never asked to
            be included. The same event is sent once from your browser and once from our server, sharing a
            single identifier so that Meta records one registration rather than two.
          </p>
          <p>
            If you declined marketing cookies, or never made a choice, nothing about your registration is
            sent to Meta, and your registration works exactly the same way. If you withdraw consent later,
            nothing further is sent. Section 12 explains the cookies themselves and how to change your
            choice.
          </p>
        </Section>

        <Section title="3. Scope of this policy">
          <p>
            We intend to add an online enquiry / contact form in the future. The remainder of this policy
            explains how personal data will be handled once that form is activated, so that our approach is
            clear in advance. We will keep this policy up to date as our services change.
          </p>
        </Section>

        <Section title="4. Information we may collect">
          <p>When the enquiry form is activated, we expect to collect only the information you choose to provide, which may include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>your name;</li>
            <li>your telephone number and any contact detail you supply;</li>
            <li>details relevant to your enquiry, such as intended dates, number of guests, and any message you send us.</li>
          </ul>
          <p>We will not require more information than is necessary to respond to your enquiry.</p>
        </Section>

        <Section title="5. How and why we use your data">
          <p>We will use the information you provide to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>respond to your enquiry and communicate with you;</li>
            <li>help you plan a potential visit and provide information you have requested;</li>
            <li>keep a record of our correspondence with you.</li>
          </ul>
          <p>We will not use your enquiry details for unrelated marketing without your consent.</p>
        </Section>

        <Section title="6. Lawful basis for processing">
          <p>Where we process your personal data, we rely on one or more of the lawful bases recognised under the NDPA, namely:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-white/80">Your consent</span> — given when you submit an enquiry or otherwise ask us to contact you;</li>
            <li><span className="text-white/80">Steps taken at your request</span> — to respond to your enquiry and take steps prior to any potential agreement;</li>
            <li><span className="text-white/80">Our legitimate interests</span> — in responding to enquiries and operating the resort, where these are not overridden by your rights.</li>
          </ul>
        </Section>

        <Section title="7. Data minimisation">
          <p>We collect only the personal data that is adequate, relevant and limited to what is necessary for the purpose of responding to your enquiry.</p>
        </Section>

        <Section title="8. Retention">
          <p>
            We keep personal data only for as long as necessary to deal with your enquiry and for a
            reasonable period afterwards, or for as long as required to meet any legal or record-keeping
            obligation. When it is no longer needed, we take steps to delete or securely dispose of it.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We take reasonable technical and organisational measures to protect personal data against loss,
            misuse and unauthorised access, alteration or disclosure. No method of transmission or storage
            is completely secure, but we work to protect your information appropriately.
          </p>
        </Section>

        <Section title="10. Service providers and processors">
          <p>We currently use the following providers:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-white/80">Vercel</span> &mdash; hosting for this website;</li>
            <li><span className="text-white/80">Neon</span> &mdash; the Postgres database in which invitation registrations are stored;</li>
            <li><span className="text-white/80">Meta Platforms</span> &mdash; advertising measurement, only where you have accepted optional marketing cookies (sections 2 and 12);</li>
            <li><span className="text-white/80">Google</span> &mdash; the interactive location map, only if you choose to open it (section 12).</li>
          </ul>
          <p>
            These providers are permitted to process personal data only in accordance with our instructions
            and applicable data-protection obligations. If we later use a provider to help us receive and
            manage general enquiries, we will update this section before doing so.
          </p>
        </Section>

        <Section title="11. International transfers">
          <p>
            Some of our service providers store or process data outside Nigeria. In particular, invitation
            registrations are held in the United Kingdom, in Amazon Web Services&rsquo; Europe (London)
            region (<span className="text-white/80">eu-west-2</span>), and Meta Platforms Ireland processes
            the advertising measurement data described in section 12.
          </p>
          <p>
            Where personal data is transferred outside Nigeria, we take steps intended to ensure it
            continues to receive an appropriate level of protection consistent with the NDPA.
          </p>
        </Section>

        <Section title="12. Cookies, marketing and maps">
          <p>
            <span className="text-white/80">Essential cookies.</span> A small number of cookies are needed
            for the website to work. They do not track you across other websites and cannot be switched off.
          </p>
          <p>
            <span className="text-white/80">Meta Pixel (optional).</span> We use the Meta Pixel from Meta
            Platforms so that we can measure how our advertising on Facebook and Instagram performs. It is
            optional and is <span className="text-white/80">not loaded unless you accept it</span> in the
            cookie banner or under &ldquo;Cookie Preferences&rdquo; in the footer.
          </p>
          <p>
            If you have accepted it, two things are measured: the pages you view, and the completion of an
            invitation registration. Registrations are also reported to Meta from our server, carrying no
            contact details of any kind; section 2 sets out precisely what is and is not sent. Nothing is
            reported to Meta if you declined, and nothing further is reported once you withdraw.
          </p>
          <p>If you accept, Meta may set the following cookies in your browser:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-white/80">_fbp</span> — identifies your browser so that visits and advert performance can be measured. Typically expires after about 90 days.</li>
            <li><span className="text-white/80">_fbc</span> — records that you arrived from a Meta advert. Set only if you click such an advert, and typically expires after about 90 days.</li>
          </ul>
          <p>
            When the Pixel is active, Meta receives your IP address, browser and device details, the page
            address you are viewing and the cookie identifiers above. We do not send Meta your name,
            telephone number or email address through this website, and the Pixel does not read anything
            you type into a form.
          </p>
          <p>
            <span className="text-white/80">Your control.</span> You may accept or decline when first
            asked, and you can change or withdraw your choice at any time under &ldquo;Cookie
            Preferences&rdquo; in the footer. Withdrawing stops any further tracking and deletes the Meta
            cookies that your browser allows us to remove. It cannot undo processing that already took
            place while consent was in force, and you may also clear cookies in your browser settings or
            use Meta&rsquo;s own advertising controls in your Facebook or Instagram account.
          </p>
          <p>
            <span className="text-white/80">Lawful basis and transfers.</span> We rely on your consent for
            this processing. Meta Platforms Ireland Limited acts as the recipient of this data and may
            process it outside Nigeria, including in the European Union and the United States, under its own
            terms and privacy policy. Where personal data is transferred outside Nigeria, we take steps
            intended to ensure it continues to receive an appropriate level of protection consistent with
            the NDPA.
          </p>
          <p>
            <span className="text-white/80">Where it does not run.</span> The Pixel does not run on internal
            or draft pages, or on print and proof pages used for producing printed material.
          </p>
          <p>
            <span className="text-white/80">Google Maps.</span> The location section on our homepage
            shows the resort&rsquo;s address and coordinates without contacting Google. The interactive
            map loads only after you choose &ldquo;View Interactive Map&rdquo;. When you do, your browser
            connects to Google, which may receive technical information such as your IP address and
            device and browser details, and may set its own cookies. Google handles that information
            under its own privacy policy. The &ldquo;Get Directions&rdquo; link opens Google Maps in a
            new tab in the same way.
          </p>
        </Section>

        <Section title="13. Recruitment and job applications">
          <p>
            If you apply for a role through our Careers section, you will email your CV and details to{' '}
            <a href="mailto:careers@njsbeachresort.com" className="text-gold hover:text-white transition-colors">careers@njsbeachresort.com</a>.
            Applications may contain your CV, contact information and other details you choose to share.
          </p>
          <p>We use recruitment information only to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>assess your suitability for the role;</li>
            <li>communicate with you about your application;</li>
            <li>arrange interviews;</li>
            <li>maintain necessary recruitment records.</li>
          </ul>
          <p>
            Recruitment information is accessible only to authorised personnel involved in the
            recruitment process. We retain it only for as long as necessary for recruitment purposes
            and to meet applicable legal obligations, after which we take steps to delete or securely
            dispose of it.
          </p>
        </Section>

        <Section title="14. Your rights">
          <p>Subject to the conditions of the NDPA, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>request access to the personal data we hold about you;</li>
            <li>ask us to correct inaccurate or incomplete data;</li>
            <li>ask us to delete your data in certain circumstances;</li>
            <li>ask us to restrict or object to certain processing;</li>
            <li>withdraw your consent where we rely on it;</li>
            <li>request a copy of certain data in a portable format where applicable.</li>
          </ul>
          <p>To exercise any of these rights, please contact us using the details below.</p>
        </Section>

        <Section title="15. Complaints and how to contact us">
          <p>If you have any question about this policy or wish to exercise your rights, you can reach us at:</p>
          <p className="font-[family-name:var(--font-cormorant)] text-white/80 text-lg leading-relaxed">
            NJS Royale Beach Resort
            <br />
            Mosere-Kogo Village, via Eko Akete, Ibeju-Lekki, Lagos State, Nigeria
            <br />
            Telephone: <a href="tel:+2347075334158" className="text-gold hover:text-white transition-colors">0707 533 4158</a>
            <br />
            Email: <a href="mailto:info@njsbeachresort.com" className="text-gold hover:text-white transition-colors">info@njsbeachresort.com</a>
          </p>
          <p>
            If you believe your data has not been handled properly, you also have the right to lodge a
            complaint with the Nigeria Data Protection Commission (NDPC).
          </p>
        </Section>

        <Section title="16. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our services or legal
            requirements. When we do, we will revise the &ldquo;Last updated&rdquo; date at the top of this
            page.
          </p>
        </Section>
      </article>

      <footer className="border-t border-white/10 px-6 sm:px-10 py-6 flex items-center justify-between">
        <span className="text-white/40 text-[11px] uppercase tracking-widest font-[family-name:var(--font-inter)]">
          © 2026 NJS Royale Beach Resort
        </span>
        <Link href="/" className="text-gold hover:text-white text-[11px] uppercase tracking-widest transition-colors font-[family-name:var(--font-inter)]">
          Back to site
        </Link>
      </footer>
    </main>
  )
}
