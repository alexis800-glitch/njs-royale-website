'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)

  // While the banner is on screen, reserve the space it occupies so it never
  // covers a call to action at the foot of the page.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => {
      const h = `${el.offsetHeight}px`
      // Full-height sections read this variable so the banner never covers a
      // call to action pinned to the bottom of the first screen.
      document.documentElement.style.setProperty('--consent-height', h)
      document.body.style.paddingBottom = h
    }
    apply()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null
    observer?.observe(el)
    window.addEventListener('resize', apply)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', apply)
      document.documentElement.style.removeProperty('--consent-height')
      document.body.style.paddingBottom = ''
    }
  })

  // Don't ask on routes that are never tracked (print/proof artwork, drafts),
  // and don't ask at all if no Pixel is configured.
  if (!ready || marketing !== 'unknown') return null
  if (!isTrackableRoute(pathname ?? '', searchParams?.toString() ?? '')) return null
  if (!META_PIXEL_ID) return null

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-[130] border-t border-gold/40 bg-[#0A1628]/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3.5 px-5 py-4 sm:px-8 md:flex-row md:items-center md:gap-8 md:py-5">
        <div className="min-w-0 flex-1">
          <p className="text-white/85 text-[13px] leading-snug font-[family-name:var(--font-inter)]">
            Optional Meta (Facebook and Instagram) cookies help us measure our adverts. We use them only if
            you accept, and you can change this later under Cookie Preferences.{' '}
            <Link href="/privacy" className="text-gold underline underline-offset-2 hover:text-white">
              Privacy Policy
            </Link>
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
