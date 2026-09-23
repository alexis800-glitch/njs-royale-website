'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { useConsent } from './ConsentProvider'
import { META_PIXEL_ID, isTrackableRoute } from '@/lib/meta/config'

// Marketing consent banner, in the NJS navy and gold.
//
// Accept and Decline are the same size, weight and prominence: under the NDPA the
// choice has to be genuine, so declining must be exactly as easy as accepting.
// Nothing loads and no Meta cookie is set until Accept is pressed.

function ConsentBannerInner() {
  const { marketing, ready, grantMarketing, denyMarketing } = useConsent()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Don't ask on routes that are never tracked (print/proof artwork, drafts),
  // and don't ask at all if no Pixel is configured.
  if (!ready || marketing !== 'unknown') return null
  if (!isTrackableRoute(pathname ?? '', searchParams?.toString() ?? '')) return null
  if (!META_PIXEL_ID) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-[130] border-t border-gold/40 bg-[#0A1628]/98 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-5 sm:px-8 sm:py-6 md:flex-row md:items-center md:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-gold text-[10px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]">Privacy</p>
          <p className="mt-2 text-white/85 text-[13.5px] leading-relaxed font-[family-name:var(--font-inter)]">
            We would like to use marketing cookies from Meta (Facebook and Instagram) to measure how our
            adverts perform. They are optional, and we only use them if you accept. Essential cookies keep
            the site working and are always on. You can change this at any time under{' '}
            <span className="text-white">Cookie Preferences</span> in the footer, and our{' '}
            <Link href="/privacy" className="text-gold underline underline-offset-2 hover:text-white">
              Privacy Policy
            </Link>{' '}
            explains what is processed.
          </p>
        </div>

        {/* Equal prominence: identical size, spacing and visual weight. */}
        <div className="flex flex-shrink-0 gap-3">
          <button
            type="button"
            onClick={denyMarketing}
            className="min-h-[46px] flex-1 border border-gold px-6 text-[11px] uppercase tracking-[0.12em] font-semibold text-gold transition-colors duration-300 hover:bg-gold hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)] md:flex-none md:w-[148px]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={grantMarketing}
            className="min-h-[46px] flex-1 border border-gold bg-gold px-6 text-[11px] uppercase tracking-[0.12em] font-semibold text-navy transition-colors duration-300 hover:bg-[#d8bb66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)] md:flex-none md:w-[148px]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConsentBanner() {
  return (
    <Suspense fallback={null}>
      <ConsentBannerInner />
    </Suspense>
  )
}
