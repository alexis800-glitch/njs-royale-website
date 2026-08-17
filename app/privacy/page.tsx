import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How NJS Royale Beach Resort collects, uses and protects personal data, in line with the Nigeria Data Protection Act 2023.',
  alternates: { canonical: '/privacy' },
}

const LAST_UPDATED = '16 August 2026'

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
            At present, this website is an informational site. It does not operate an active enquiry or
            contact form, does not use analytics or tracking cookies, does not process payments, and does
            not run a live online booking engine. As a result, we currently do not collect personal data
            through this website.
          </p>
          <p>
            If you contact us using the telephone number provided, we will receive the information you
            choose to share during that call in order to respond to you.
          </p>
        </Section>

        <Section title="2. Scope of this policy">
          <p>
            We intend to add an online enquiry / contact form in the future. The remainder of this policy
            explains how personal data will be handled once that form is activated, so that our approach is
            clear in advance. We will keep this policy up to date as our services change.
          </p>
        </Section>

        <Section title="3. Information we may collect">
          <p>When the enquiry form is activated, we expect to collect only the information you choose to provide, which may include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>your name;</li>
            <li>your telephone number and any contact detail you supply;</li>
            <li>details relevant to your enquiry, such as intended dates, number of guests, and any message you send us.</li>
          </ul>
          <p>We will not require more information than is necessary to respond to your enquiry.</p>
        </Section>

        <Section title="4. How and why we use your data">
          <p>We will use the information you provide to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>respond to your enquiry and communicate with you;</li>
            <li>help you plan a potential visit and provide information you have requested;</li>
            <li>keep a record of our correspondence with you.</li>
          </ul>
          <p>We will not use your enquiry details for unrelated marketing without your consent.</p>
        </Section>

        <Section title="5. Lawful basis for processing">
          <p>Where we process your personal data, we rely on one or more of the lawful bases recognised under the NDPA, namely:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-white/80">Your consent</span> — given when you submit an enquiry or otherwise ask us to contact you;</li>
            <li><span className="text-white/80">Steps taken at your request</span> — to respond to your enquiry and take steps prior to any potential agreement;</li>
            <li><span className="text-white/80">Our legitimate interests</span> — in responding to enquiries and operating the resort, where these are not overridden by your rights.</li>
          </ul>
        </Section>

        <Section title="6. Data minimisation">
          <p>We collect only the personal data that is adequate, relevant and limited to what is necessary for the purpose of responding to your enquiry.</p>
        </Section>

        <Section title="7. Retention">
          <p>
            We keep personal data only for as long as necessary to deal with your enquiry and for a
            reasonable period afterwards, or for as long as required to meet any legal or record-keeping
            obligation. When it is no longer needed, we take steps to delete or securely dispose of it.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We take reasonable technical and organisational measures to protect personal data against loss,
            misuse and unauthorised access, alteration or disclosure. No method of transmission or storage
            is completely secure, but we work to protect your information appropriately.
          </p>
        </Section>

        <Section title="9. Service providers and processors">
          <p>
            We use a third-party provider to host this website. When the enquiry form is activated, we may
            use trusted service providers to help us receive and manage enquiries on our behalf. Where we
            do, those providers are permitted to process personal data only in accordance with our
            instructions and applicable data-protection obligations.
          </p>
        </Section>

        <Section title="10. International transfers">
          <p>
            Some of our service providers may store or process data outside Nigeria. Where personal data is
            transferred outside Nigeria, we take steps intended to ensure it continues to receive an
            appropriate level of protection consistent with the NDPA.
          </p>
        </Section>

        <Section title="11. Cookies and analytics">
          <p>
            This website does not currently set analytics or advertising cookies, and does not use
            third-party tracking or marketing tools. If this changes, we will update this policy and, where
            required, ask for your consent before any non-essential cookies are used.
          </p>
        </Section>

        <Section title="12. Your rights">
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

        <Section title="13. Complaints and how to contact us">
          <p>If you have any question about this policy or wish to exercise your rights, you can reach us at:</p>
          <p className="font-[family-name:var(--font-cormorant)] text-white/80 text-lg leading-relaxed">
            NJS Royale Beach Resort
            <br />
            Mosere-Kogo Village, via Eko Akete, Ibeju-Lekki, Lagos State, Nigeria
            <br />
            Telephone: <a href="tel:+2347075334158" className="text-gold hover:text-white transition-colors">0707 533 4158</a>
          </p>
          <p>
            We are in the process of establishing a dedicated email address for privacy enquiries and will
            add it to this policy once it is available. In the meantime, please use the telephone number or
            postal address above.
          </p>
          <p>
            If you believe your data has not been handled properly, you also have the right to lodge a
            complaint with the Nigeria Data Protection Commission (NDPC).
          </p>
        </Section>

        <Section title="14. Changes to this policy">
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
