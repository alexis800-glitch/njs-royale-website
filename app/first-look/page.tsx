import Image from 'next/image'
import type { Metadata } from 'next'
import { CalendarDays, Check, Sparkles, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FirstLookForm from '@/components/FirstLookForm'
import {
  CAMPAIGN,
  FIRST_ESCAPE,
  GRAND_OPENING,
  GUEST_PRIVILEGES,
  VERIFICATION_NOTE,
} from '@/lib/firstLook'

// Kept out of search engines (and out of the sitemap) until the registration
// workflow is approved.
export const metadata: Metadata = {
  title: 'The First Escape — First Look Guest Registration',
  description:
    'NJS Royale — The First Escape. You saw it first. Now come experience it. Exclusive registration for First Look guests returning on 12 December 2026.',
  alternates: { canonical: '/first-look' },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: {
    title: 'NJS Royale — The First Escape',
    description: 'You Saw It First. Now Come Experience It.',
    url: '/first-look',
  },
}

const dates = [
  {
    kicker: 'The First Escape',
    date: FIRST_ESCAPE.date,
    detail: `From ${FIRST_ESCAPE.hours}`,
    note: 'NJS Royale enters its first phase of hospitality.',
  },
  {
    kicker: 'Grand Opening',
    date: GRAND_OPENING.date,
    detail: 'The complete resort unveiled',
    note: 'The full NJS Royale Beach Resort experience.',
  },
]

export default function FirstLookPage() {
  return (
    <main className="bg-navy min-h-screen overflow-x-clip">
      <Navbar />

      {/* ── Hero ── */}
      <header className="relative isolate overflow-hidden border-b border-white/10 px-4 sm:px-10 pt-32 sm:pt-40 pb-16 sm:pb-20">
        <Image
          src="/images/njs-rooftop-infinity-pool-atlantic-view.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center opacity-35"
        />
        <div
          aria-hidden="true"
          className="-z-10 absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,22,40,0.82) 0%, rgba(10,22,40,0.70) 45%, #0A1628 100%), radial-gradient(70% 60% at 50% 0%, rgba(201,168,76,0.16) 0%, rgba(201,168,76,0) 60%)',
          }}
        />

        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-navy/60 px-4 py-1.5 text-gold text-[10px] sm:text-[11px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
            {CAMPAIGN.pageLabel}
          </p>

          <h1
            className="mt-6 font-[family-name:var(--font-cormorant)] text-white leading-[1.05] text-balance"
            style={{ fontSize: 'clamp(38px, 7vw, 72px)' }}
          >
            NJS Royale
            <span className="block text-gold italic">The First Escape</span>
          </h1>

          <div aria-hidden="true" className="mx-auto my-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gold/50" />
            <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <span className="h-px w-12 bg-gold/50" />
          </div>

          <p className="text-white text-[13px] sm:text-base uppercase tracking-[3px] sm:tracking-[4px] font-medium text-balance font-[family-name:var(--font-inter)]">
            {CAMPAIGN.tagline}
          </p>

          <div className="mx-auto mt-8 max-w-2xl space-y-4 text-white/75 text-[15px] sm:text-[17px] leading-relaxed font-[family-name:var(--font-inter)]">
            <p>
              Thank you for joining us for the First Look of NJS Royale Beach Resort. What you
              experienced was only the beginning.
            </p>
            <p>
              Join us again on{' '}
              <strong className="font-semibold text-white">
                {FIRST_ESCAPE.date}, from {FIRST_ESCAPE.hours}
              </strong>
              , as NJS Royale enters its first phase of hospitality&mdash;where rooftop leisure,
              poolside moments, dining, music and the Atlantic come alive.
            </p>
            <p>
              Then return on <strong className="font-semibold text-white">{GRAND_OPENING.date}</strong>,
              as we unveil the complete NJS Royale Beach Resort experience.
            </p>
          </div>

          <a
            href="#register"
            className="mt-9 inline-flex min-h-[48px] items-center justify-center rounded-md bg-gold px-8 text-navy text-[12px] uppercase tracking-[2px] font-semibold transition-colors duration-300 hover:bg-[#d8bb66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
          >
            Register your RSVP
          </a>
        </div>
      </header>

      {/* ── Dates ── */}
      <section aria-labelledby="dates-heading" className="px-4 sm:px-8 py-14 sm:py-20">
        <h2 id="dates-heading" className="sr-only">
          Save the dates
        </h2>
        <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {dates.map((d) => (
            <li
              key={d.kicker}
              className="relative rounded-2xl border border-gold/30 bg-white/[0.03] p-6 sm:p-8 text-center"
            >
              <CalendarDays aria-hidden="true" className="mx-auto h-6 w-6 text-gold" strokeWidth={1.5} />
              <p className="mt-3 text-gold text-[11px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]">
                {d.kicker}
              </p>
              <p className="mt-2 font-[family-name:var(--font-cormorant)] text-white text-[34px] sm:text-[40px] leading-tight">
                {d.date}
              </p>
              <p className="mt-1 text-white text-[15px] font-medium font-[family-name:var(--font-inter)]">
                {d.detail}
              </p>
              <p className="mt-2 text-white/60 text-sm font-[family-name:var(--font-inter)]">{d.note}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Guest privilege (cream band) ── */}
      <section aria-labelledby="privilege-heading" className="bg-sand px-4 sm:px-8 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[#8a6d22] text-[11px] uppercase tracking-[3px] font-semibold font-[family-name:var(--font-inter)]">
            For verified First Look guests
          </p>
          <h2
            id="privilege-heading"
            className="mt-3 text-center font-[family-name:var(--font-cormorant)] text-navy leading-tight"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
          >
            Your First Look Guest Privilege
          </h2>

          <div className="mt-8 flex items-start gap-4 rounded-xl border border-navy/10 bg-white p-5 sm:p-6">
            <Users aria-hidden="true" className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#8a6d22]" strokeWidth={1.5} />
            <p className="text-navy text-[15px] sm:text-base leading-relaxed font-[family-name:var(--font-inter)]">
              Each invitation admits <strong className="font-semibold">two people: the invited guest and one companion</strong>.
            </p>
          </div>

          <p className="mt-8 text-navy/80 text-[15px] sm:text-base leading-relaxed font-[family-name:var(--font-inter)]">
            Verified First Look guests returning on {FIRST_ESCAPE.dateShort} will receive:
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {GUEST_PRIVILEGES.map((p) => (
              <li
                key={p}
                className="flex items-center gap-3 rounded-xl border border-gold/50 bg-white px-4 py-4 text-navy text-[15px] font-medium font-[family-name:var(--font-inter)] sm:flex-col sm:text-center sm:py-6"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy text-gold">
                  <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <p className="mt-8 border-l-2 border-gold pl-4 text-navy/75 text-sm leading-relaxed font-[family-name:var(--font-inter)]">
            {VERIFICATION_NOTE}
          </p>
        </div>
      </section>

      {/* ── Registration ── */}
      <section id="register" aria-labelledby="register-heading" className="scroll-mt-24 px-4 sm:px-8 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-gold text-[11px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]">
            RSVP · {FIRST_ESCAPE.date}
          </p>
          <h2
            id="register-heading"
            className="mt-3 text-center font-[family-name:var(--font-cormorant)] text-white leading-tight"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
          >
            {CAMPAIGN.pageLabel}
          </h2>
          <FirstLookForm />
        </div>
      </section>

      <Footer />
    </main>
  )
}
