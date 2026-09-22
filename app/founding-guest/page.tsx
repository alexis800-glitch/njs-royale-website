import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import CampaignJourney from '@/components/CampaignJourney'
import FoundingGuestForm from '@/components/FoundingGuestForm'
import {
  CONDITIONS,
  FOUNDING_GUEST,
  FOUNDING_GUEST_INVITATION,
  STAY_BENEFIT,
} from '@/lib/foundingGuest'

// Founding Guest invitation activation. Deliberately more formal than /first-look:
// a private-page header instead of the site navigation, and a framed, centred
// composition. Kept out of search engines (and the sitemap) until approved.
export const metadata: Metadata = {
  title: 'NJS Royale Founding Guest — Invitation Activation',
  description: 'Private activation page for NJS Royale Founding Guest invitations.',
  alternates: { canonical: '/founding-guest' },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const serif = 'font-[family-name:var(--font-cormorant)]'
const sans = 'font-[family-name:var(--font-inter)]'

function SectionHeading({ id, kicker, children }: { id: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="text-center">
      <p className={`text-gold text-[11px] uppercase tracking-[3.5px] font-semibold ${sans}`}>{kicker}</p>
      <h2 id={id} className={`mt-3 text-white leading-tight ${serif}`} style={{ fontSize: 'clamp(30px, 4.6vw, 44px)' }}>
        {children}
      </h2>
      <div aria-hidden="true" className="mx-auto mt-5 flex items-center justify-center gap-2">
        <span className="h-px w-10 bg-gold/70" />
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <span className="h-2 w-2 rotate-45 border border-gold" />
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <span className="h-px w-10 bg-gold/70" />
      </div>
    </div>
  )
}

export default function FoundingGuestPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-navyDark">
      {/* Private-page header */}
      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-gold/25 bg-navyDark px-4 sm:px-10 py-4">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label="NJS Royale Beach Resort — home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/njs-logos/njs-crest-mark.png" alt="" className="h-10 w-auto" />
          <span className="flex flex-col leading-none">
            <span className={`text-white text-lg tracking-wide ${serif}`}>NJS Royale</span>
            <span className={`mt-0.5 text-gold text-[8px] uppercase tracking-[3.5px] ${sans}`}>Beach Resort</span>
          </span>
        </Link>
        <p className={`text-gold text-[10px] sm:text-[11px] uppercase tracking-[3px] text-right ${sans}`}>
          Private invitation
        </p>
      </header>

      {/* ── Hero: the resort at night ── */}
      <section aria-labelledby="fg-title" className="relative isolate overflow-hidden px-4 sm:px-10 pt-16 sm:pt-24 pb-14 sm:pb-20">
        {/* On phones the crop centres on the lit building; wider screens show the
            full shoreline. */}
        <Image
          src="/images/njs-hero-night-poster.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[50%_40%]"
        />
        <div
          aria-hidden="true"
          className="-z-10 absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 55% at 50% 55%, rgba(6,14,26,0.55) 0%, rgba(6,14,26,0) 100%), linear-gradient(180deg, rgba(6,14,26,0.70) 0%, rgba(6,14,26,0.72) 45%, rgba(6,14,26,0.86) 75%, #060E1A 100%)',
          }}
        />

        {/* Formal gold frame around the hero composition */}
        <div className="mx-auto max-w-3xl border border-gold/70 px-5 py-10 sm:px-12 sm:py-14 text-center">
          <p className={`text-gold text-[11px] sm:text-xs uppercase tracking-[4px] font-semibold ${sans}`}>
            {FOUNDING_GUEST.kicker}
          </p>
          <h1 id="fg-title" className={`mt-4 text-white leading-[1.05] text-balance ${serif}`} style={{ fontSize: 'clamp(36px, 6.4vw, 64px)' }}>
            NJS Royale
            <span className="block text-gold">Founding Guest</span>
          </h1>
          <p className={`mx-auto mt-7 max-w-xl text-sand text-[18px] sm:text-[21px] leading-relaxed ${serif}`}>
            {FOUNDING_GUEST_INVITATION}
          </p>
          <p className={`mx-auto mt-7 max-w-md text-white text-[14px] font-medium ${sans}`}>{FOUNDING_GUEST.registeredNote}</p>
          <a
            href="#activate"
            className={`mt-8 inline-flex min-h-[48px] items-center justify-center rounded-md bg-gold px-8 text-navy text-[12px] uppercase tracking-[2px] font-semibold transition-colors duration-300 hover:bg-[#d8bb66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navyDark ${sans}`}
          >
            Activate your invitation
          </a>
        </div>
      </section>

      {/* ── Journey ── */}
      <section aria-labelledby="journey-heading" className="border-y border-gold/20 bg-navy px-4 sm:px-8 py-14 sm:py-16">
        <h2 id="journey-heading" className="sr-only">
          The journey
        </h2>
        <CampaignJourney current="grand-opening" />
      </section>

      {/* ── The stay ── */}
      <section aria-labelledby="stay-heading" className="px-4 sm:px-8 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading id="stay-heading" kicker="Your Founding Guest stay">
            {STAY_BENEFIT.heading}
          </SectionHeading>

          <div className="mx-auto mt-10 max-w-xl border border-gold bg-gold/[0.08] px-6 py-8 sm:px-10 text-center">
            <p className={`text-white text-[34px] sm:text-[40px] leading-tight ${serif}`}>{STAY_BENEFIT.dates}</p>
            <p className={`mt-3 text-white/90 text-[16px] leading-relaxed ${sans}`}>{STAY_BENEFIT.includes}</p>
            <p className={`mt-3 text-white/80 text-[14px] ${sans}`}>{FOUNDING_GUEST.categoryNote}</p>
          </div>
        </div>
      </section>

      {/* ── Complete conditions ── */}
      <section id="conditions" aria-labelledby="conditions-heading" className="scroll-mt-6 bg-sand px-4 sm:px-8 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className={`text-[#7d621c] text-[11px] uppercase tracking-[3.5px] font-semibold ${sans}`}>Please read before activating</p>
            <h2 id="conditions-heading" className={`mt-3 text-navy leading-tight ${serif}`} style={{ fontSize: 'clamp(30px, 4.6vw, 44px)' }}>
              Founding Guest accommodation conditions
            </h2>
          </div>
          <ol className={`mt-10 space-y-4 border border-[#C9A84C] bg-white p-6 sm:p-8 ${sans}`}>
            {CONDITIONS.map((c, i) => (
              <li key={c} className="flex gap-4 text-navy text-[15px] sm:text-base leading-relaxed">
                <span aria-hidden="true" className={`w-6 flex-shrink-0 text-right text-[#7d621c] font-semibold ${serif} text-lg leading-snug`}>
                  {i + 1}.
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
          <p className={`mt-6 text-center text-navy/80 text-[14px] ${sans}`}>
            {FOUNDING_GUEST.registeredNote} {FOUNDING_GUEST.categoryNote}
          </p>
        </div>
      </section>

      {/* ── Activation form ── */}
      <section id="activate" aria-labelledby="activate-heading" className="scroll-mt-6 px-4 sm:px-8 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <SectionHeading id="activate-heading" kicker="Founding Guest invitation">
            Activate your invitation
          </SectionHeading>
          <p className={`mx-auto mt-6 max-w-lg text-center text-white/80 text-[15px] leading-relaxed ${sans}`}>
            Registration must be completed by <strong className="font-semibold text-white">31 May 2027</strong>. Your
            stay is subject to confirmed registration and RSVP.
          </p>
          <FoundingGuestForm />
        </div>
      </section>

      <Footer />
    </main>
  )
}
