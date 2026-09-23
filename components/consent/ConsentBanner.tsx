'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useConsent } from './ConsentProvider'
import { META_PIXEL_ID, isTrackableRoute } from '@/lib/meta/config'

// Marketing consent banner, in the NJS navy and gold.
//
// Accept and Decline are the same size, weight and prominence: under the NDPA the
// choice has to be genuine, so declining must be exactly as easy as accepting.
// Nothing loads and no Meta cookie is set until Accept is pressed, and the site
// stays fully usable if no choice is ever made.
//
// The banner waits until the visitor has scrolled past the first screen. Pages
// here open on a full-height hero whose calls to action sit at the very bottom of
// that screen — at 360px wide the hero button already reaches the fold — so a
// bottom-anchored bar shown immediately would cover them. Waiting costs nothing:
// until a choice is made nothing is tracked, and Cookie Preferences in the footer
// offers the same choice at any time.
const REVEAL_FRACTION = 0.45

function ConsentBannerInner() {
  const { marketing, ready, grantMarketing, denyMarketing } = useConsent()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  const undecided = ready && marketing === 'unknown'
  const trackable = isTrackableRoute(pathname ?? '', searchParams?.toString() ?? '') && !!META_PIXEL_ID

  // Reveal once past the first screen — or straight away on a page short enough
  // that there is nothing to scroll.
  useEffect(() => {
    if (!undecided || !trackable) return
    const check = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable < 120 || window.scrollY > window.innerHeight * REVEAL_FRACTION) setRevealed(true)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [undecided, trackable, pathname])

  // While the banner is on screen, reserve its height at the foot of the page so
  // it cannot cover anything at the very end of the document.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => {
      document.body.style.paddingBottom = `${el.offsetHeight}px`
    }
    apply()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null
    observer?.observe(el)
    window.addEventListener('resize', apply)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', apply)
      document.body.style.paddingBottom = ''
    }
  })

  if (!undecided || !trackable || !revealed) return null

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-[130] border-t border-gold/40 bg-[#0A1628]/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-3.5 sm:px-8 md:flex-row md:items-center md:gap-8 md:py-5">
        <p className="min-w-0 flex-1 text-white/85 text-[12.5px] leading-[1.45] font-[family-name:var(--font-inter)] sm:text-[13px]">
          Optional Meta cookies measure our adverts, with your consent.{' '}
          <Link href="/privacy" className="text-gold underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>
        </p>

        {/* Equal prominence: identical size, spacing and visual weight. */}
        <div className="flex flex-shrink-0 gap-3">
          <button
            type="button"
            onClick={denyMarketing}
            className="min-h-[44px] flex-1 border border-gold px-6 text-[11px] uppercase tracking-[0.12em] font-semibold text-gold transition-colors duration-300 hover:bg-gold hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)] md:flex-none md:w-[148px]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={grantMarketing}
            className="min-h-[44px] flex-1 border border-gold bg-gold px-6 text-[11px] uppercase tracking-[0.12em] font-semibold text-navy transition-colors duration-300 hover:bg-[#d8bb66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)] md:flex-none md:w-[148px]"
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
