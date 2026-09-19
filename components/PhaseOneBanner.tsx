import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { APPLICATION_DEADLINE, TOTAL_POSITIONS, TOTAL_TITLES } from '@/lib/careers'

// Slim, full-width Phase One recruitment banner shown directly beneath the fixed
// header, over the top of the hero (clear of the centred hero controls). The whole
// banner is a single link to /careers. No pop-up, marquee or flashing animation —
// only restrained colour transitions on hover/focus.
export default function PhaseOneBanner() {
  return (
    <div className="absolute inset-x-0 top-[84px] sm:top-[92px] z-30">
      <Link
        href="/careers"
        className="group block border-y border-gold/40 bg-navy/90 backdrop-blur-sm transition-colors duration-300 hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-1.5 px-4 py-3 text-center sm:min-h-[56px] sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:py-2.5">
          <span className="text-gold text-[11px] sm:text-xs font-semibold uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
            We’re Hiring for Phase One
          </span>

          <span aria-hidden="true" className="hidden sm:inline text-gold/40 text-[10px]">
            &bull;
          </span>

          <span className="text-sand/90 text-[12px] sm:text-[13px] font-[family-name:var(--font-inter)]">
            {TOTAL_POSITIONS} positions across {TOTAL_TITLES} roles
          </span>

          <span aria-hidden="true" className="hidden sm:inline text-gold/40 text-[10px]">
            &bull;
          </span>

          <span className="text-sand/70 text-[12px] sm:text-[13px] font-[family-name:var(--font-inter)]">
            Applications close {APPLICATION_DEADLINE}
          </span>

          <span className="mt-1.5 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-gold px-5 text-navy text-[11px] font-semibold uppercase tracking-[1.5px] transition-colors duration-300 group-hover:bg-white sm:mt-0 sm:ml-2 sm:min-h-[38px] font-[family-name:var(--font-inter)]">
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
