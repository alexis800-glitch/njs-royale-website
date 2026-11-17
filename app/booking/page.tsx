import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BookingJourney from '@/components/booking/BookingJourney'
import IntegrationStatus from '@/components/booking/IntegrationStatus'
import { PrototypeBanner, eyebrow, displayHeading, body } from '@/components/booking/ui'
import {
  BOOKING_ENABLED,
  EARLIEST_ARRIVAL,
  RESERVATIONS_OPEN_FROM,
  bookingWindow,
  type ProviderId,
} from '@/lib/booking/config'
import { formatLongDate, todayIso } from '@/lib/booking/dates'

// The NJS booking prototype.
//
// Gated three ways, and the gates are the point of this file:
//
//  1. BOOKING_ENABLED is false on the production deployment, so this route
//     calls notFound() there. The public website has no booking page, and no
//     environment variable can give it one. This is the same mechanism that
//     keeps the invitation proofs off production.
//  2. Preview deployments sit behind Vercel's own deployment protection, so the
//     journey is reachable by the team and not by the public.
//  3. noindex, nofollow, so nothing here can be indexed even if a preview URL
//     were shared.
//
// Reading searchParams makes this route dynamic rather than prerendered. That
// is deliberate and costs nothing: the route does not exist on production, so
// it is not part of the public site's static output.

export const metadata: Metadata = {
  title: 'Booking prototype',
  description: 'Internal prototype of the NJS Royale booking journey. Not a live booking system.',
  robots: { index: false, follow: false },
}

export default async function BookingPrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  // Before anything else. A disabled feature should not render, then hide itself.
  if (!BOOKING_ENABLED) notFound()

  const params = await searchParams
  // ?provider=aiosell swaps the adapter live, so a reviewer can watch the real
  // Aiosell stub refuse every call. That IS the demonstration of how the
  // adapter connects: the journey below does not change, only the provider.
  const providerId: ProviderId = params.provider === 'aiosell' ? 'aiosell' : 'mock'
  const today = todayIso()
  const windowState = bookingWindow(today)

  return (
    <main className="bg-navy min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-5xl px-5 pb-28 pt-32 sm:px-8 sm:pb-32 sm:pt-40">
        <header>
          <p className={eyebrow}>NJS Royale Beach Resort</p>
          <h1 className={`${displayHeading} mt-4 text-[38px] sm:text-[52px]`}>Reserve your stay</h1>
          <p className={`${body} mt-4 max-w-2xl`}>
            Guest rooms and accommodation open on {formatLongDate(EARLIEST_ARRIVAL)}. Advance room
            reservations are intended to begin on {formatLongDate(RESERVATIONS_OPEN_FROM)}.
          </p>
        </header>

        <div className="mt-10">
          <PrototypeBanner />
        </div>

        {windowState === 'not-open-yet' && (
          <p
            role="status"
            className="mt-5 rounded-md border border-white/15 bg-white/[0.03] p-4 text-white/65 text-[13.5px] leading-relaxed font-[family-name:var(--font-inter)]"
          >
            Advance reservations do not open until {formatLongDate(RESERVATIONS_OPEN_FROM)}. On the
            live site this journey would not yet accept a booking; the prototype lets the team walk
            it now.
          </p>
        )}

        {providerId === 'aiosell' && (
          <p
            role="status"
            className="mt-5 rounded-md border border-[#ffb4a8]/50 bg-[#ffb4a8]/[0.08] p-4 text-white/80 text-[13.5px] leading-relaxed font-[family-name:var(--font-inter)]"
          >
            Running against the <strong className="text-white">Aiosell adapter</strong>, which is a
            stub. Every call will be refused, because no documentation, endpoint or credential
            exists. This is what the journey does when a provider is not configured, and the
            demonstration that swapping the adapter touches nothing else.
          </p>
        )}

        <section className="mt-12 sm:mt-16" aria-labelledby="journey-heading">
          <h2 id="journey-heading" className="sr-only">
            Booking journey
          </h2>
          <BookingJourney providerId={providerId} today={today} />
        </section>

        <hr className="my-16 border-white/10 sm:my-20" />

        <IntegrationStatus />

        <hr className="my-16 border-white/10 sm:my-20" />

        <section aria-labelledby="swap-heading">
          <p className={eyebrow}>How Aiosell connects</p>
          <h2 id="swap-heading" className={`${displayHeading} mt-3 text-[26px] sm:text-[30px]`}>
            One file, when the documentation arrives
          </h2>
          <p className={`${body} mt-3 max-w-2xl`}>
            The journey above holds a <code className="text-gold">BookingProvider</code> and calls
            six methods on it: search, quote, hold, confirm, lookup and cancel. It does not know
            which adapter answers. Connecting Aiosell means implementing those six methods against
            its documented API in{' '}
            <code className="text-gold">lib/booking/aiosell/provider.ts</code> and setting{' '}
            <code className="text-gold">BOOKING_PROVIDER=aiosell</code>. No component changes.
          </p>
          <p className={`${body} mt-4 max-w-2xl`}>
            You can see the seam working now:{' '}
            <a
              href="?provider=aiosell"
              className="text-gold underline underline-offset-4 hover:text-[#d8bb66]"
            >
              run this journey against the Aiosell stub
            </a>{' '}
            and every call is refused, with the guest-facing failure state rendered properly.{' '}
            <a
              href="?provider=mock"
              className="text-gold underline underline-offset-4 hover:text-[#d8bb66]"
            >
              Back to the mock
            </a>
            .
          </p>
        </section>
      </div>

      <Footer />
    </main>
  )
}
