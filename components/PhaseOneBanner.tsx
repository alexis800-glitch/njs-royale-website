import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { APPLICATION_DEADLINE, TOTAL_POSITIONS, TOTAL_TITLES } from '@/lib/careers'

// Phase One recruitment banner. The whole banner links to /careers.
//
// Mobile (< sm): sits in normal document flow directly below the fixed header, so the
//   hero begins *after* it and the full hero headline stays visible (no overlay). The
//   parent wrapper adds the header-height top padding on mobile.
// Desktop (>= sm): the approved slim overlay — absolutely positioned just beneath the
//   header, over the top of the hero, clear of the hero controls.
//
// No pop-up, marquee or flashing animation; only restrained colour transitions.
export default function PhaseOneBanner() {
  return (
    <div className="relative z-40 sm:absolute sm:inset-x-0 sm:top-[92px] sm:z-30">
      <Link
        href="/careers"
        aria-label="View Phase One vacancies at NJS Royale Beach Resort"
        className="group block border-y border-gold/40 bg-navy/95 sm:bg-navy/90 sm:backdrop-blur-sm transition-colors duration-300 hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-3 text-center sm:min-h-[56px] sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:py-2.5">
          <span className="text-gold text-[11px] sm:text-xs font-semibold uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
            We’re Hiring for Phase One
          </span>

          {/* Desktop info (approved copy, unchanged) */}
          <span aria-hidden="true" className="hidden sm:inline text-gold/40 text-[10px]">
            &bull;
          </span>
          <span className="hidden sm:inline text-sand/90 text-[13px] font-[family-name:var(--font-inter)]">
            {TOTAL_POSITIONS} positions across {TOTAL_TITLES} roles
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-gold/40 text-[10px]">
            &bull;
          </span>
          <span className="hidden sm:inline text-sand/70 text-[13px] font-[family-name:var(--font-inter)]">
            Applications close {APPLICATION_DEADLINE}
          </span>

          {/* Mobile compact info line */}
          <span className="sm:hidden text-sand/85 text-[12.5px] leading-snug font-[family-name:var(--font-inter)]">
            {TOTAL_POSITIONS} positions &middot; Apply by 15 October 2026
          </span>

          <span className="mt-0.5 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-gold px-6 text-navy text-[11px] font-semibold uppercase tracking-[1.5px] transition-colors duration-300 group-hover:bg-white sm:mt-0 sm:ml-2 sm:min-h-[38px] sm:px-5 font-[family-name:var(--font-inter)]">
            View Vacancies
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
              strokeWidth={1.75}
            />
          </span>
        </div>
      </Link>
    </div>
  )
}
