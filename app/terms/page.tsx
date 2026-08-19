import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms that govern use of the NJS Royale Beach Resort website. Reservation and commercial terms are provided separately when those services become available.',
  alternates: { canonical: '/terms' },
}

const LAST_UPDATED = '19 August 2026'

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

export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p className="text-white/40 text-sm mb-8 font-[family-name:var(--font-inter)]">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="font-[family-name:var(--font-cormorant)] text-white/80 text-xl leading-relaxed">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the NJS Royale Beach Resort
          website. They cover use of this website only. Terms relating to reservations, Daycation
          admission, payments, cancellations and other commercial arrangements are not part of these
          Terms and will be provided separately when those services become available.
        </p>

        <Section title="1. About these Terms">
          <p>
            This website is operated by NJS Royale Beach Resort (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            &ldquo;our&rdquo;). By accessing or using this website, you agree to these Terms. If you do not
            agree, please do not use the website.
          </p>
        </Section>

        <Section title="2. Pre-opening information">
          <p>
            The resort is in a pre-opening phase, and this website is currently informational. Descriptions,
            imagery, visualisations, features, dates and other details are provided for general information,
            are subject to change, and may be updated or refined as plans are finalised. Nothing on this
            website is an offer, guarantee or binding commitment.
          </p>
          <p>
            Some imagery is presented as architectural visualisation for presentation purposes and may
            differ from the final resort.
          </p>
        </Section>

        <Section title="3. Use of this website">
          <p>You agree to use this website lawfully and not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>use it in any way that breaches applicable law or these Terms;</li>
            <li>attempt to gain unauthorised access to the website or any system connected to it;</li>
            <li>interfere with or disrupt the website, or introduce anything malicious;</li>
            <li>copy, reproduce or exploit content from the website except as permitted below.</li>
          </ul>
        </Section>

        <Section title="4. Intellectual property">
          <p>
            The content of this website, including text, imagery, video, graphics, the NJS Royale name and
            logo, and the overall design, is owned by or licensed to NJS Royale Beach Resort and is
            protected by applicable intellectual-property laws. You may view the website for your personal,
            non-commercial use. You may not otherwise copy, republish, distribute or use our content without
            our prior written permission.
          </p>
        </Section>

        <Section title="5. No online booking or payment at this time">
          <p>
            This website does not currently operate an online booking engine and does not process payments.
            It does not create any booking, reservation or contract. Any enquiry you make through the
            contact details provided is for information only and does not constitute a reservation.
          </p>
        </Section>

        <Section title="6. Reservations and commercial terms">
          <p>
            Terms that apply to reservations, Daycation admission, stays, payments, cancellations, refunds
            and other commercial matters are <span className="text-white/80">not set out on this website</span>.
            Where such services are offered, the applicable terms will be made available to you separately at
            the relevant time (for example, at the point of enquiry, reservation or purchase), and those
            terms will govern that transaction.
          </p>
        </Section>

        <Section title="7. Links to other websites">
          <p>
            This website may contain links to third-party websites or services that we do not control. We
            provide these links for convenience only and are not responsible for the content, policies or
            practices of any third-party website.
          </p>
        </Section>

        <Section title="8. Availability and accuracy">
          <p>
            We aim to keep this website available and its information accurate, but we do not guarantee that
            it will always be available, uninterrupted or error-free, or that the information is complete or
            current. The website is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
          </p>
        </Section>

        <Section title="9. Liability">
          <p>
            We take reasonable care in providing the information on this website. However, because the resort
            is in a pre-opening phase, website content may change as plans are finalised.
          </p>
          <p>
            To the extent permitted by applicable law, NJS Royale Beach Resort will not be responsible for
            losses arising solely from reliance on preliminary or outdated website information where the
            relevant information has subsequently been updated or changed.
          </p>
          <p>
            Nothing in these Terms excludes, restricts or limits any liability or consumer right that cannot
            lawfully be excluded, restricted or limited under applicable Nigerian law.
          </p>
        </Section>

        <Section title="10. Privacy">
          <p>
            Our handling of personal data in connection with this website is explained in our{' '}
            <Link href="/privacy" className="text-gold hover:text-white transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="11. Consumer rights">
          <p>
            Nothing in these Terms is intended to exclude, restrict or limit any rights or remedies available
            to consumers under applicable Nigerian consumer protection law.
          </p>
        </Section>

        <Section title="12. Governing law">
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute relating to
            these Terms will be handled in accordance with applicable Nigerian law, without limiting any
            rights or remedies available to you under applicable law.
          </p>
        </Section>

        <Section title="13. Changes to these Terms">
          <p>
            We may update these Terms from time to time to reflect changes in our services or legal
            requirements. When we do, we will revise the &ldquo;Last updated&rdquo; date at the top of this
            page. Your continued use of the website after any change means you accept the updated Terms.
          </p>
        </Section>

        <Section title="14. Contact us">
          <p>If you have any question about these Terms, you can reach us at:</p>
          <p className="font-[family-name:var(--font-cormorant)] text-white/80 text-lg leading-relaxed">
            NJS Royale Beach Resort
            <br />
            Mosere-Kogo Village, via Eko Akete, Ibeju-Lekki, Lagos State, Nigeria
            <br />
            Telephone: <a href="tel:+2347075334158" className="text-gold hover:text-white transition-colors">0707 533 4158</a>
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
