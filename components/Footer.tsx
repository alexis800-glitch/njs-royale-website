import Image from 'next/image'
import Link from 'next/link'
import CookiePreferences from './CookiePreferences'

// Subtle legal-link styling — deliberately lighter than the wordmark and copyright,
// so the legal navigation never competes with the main footer content.
const legalLink =
  'text-white/45 hover:text-gold text-[11px] tracking-wide transition-colors duration-300 font-[family-name:var(--font-inter)]'

export default function Footer() {
  return (
    <footer className="bg-[#050D18] py-11 px-8 border-t border-white/4">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex-shrink-0 rounded-sm overflow-hidden">
            <Image
              src="/njs-logos/njs-royale-logo-gold-dark.jpg"
              alt="NJS Royale"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-[family-name:var(--font-cormorant)] text-white/55 text-lg">
            NJS Royale
          </span>
        </div>

        {/* Copyright */}
        <p className="text-white/40 text-[11px] font-[family-name:var(--font-inter)]">
          © {new Date().getFullYear()} NJS Royale Beach Resort. All rights reserved.
        </p>

        {/* Legal navigation — Privacy Policy · Terms of Service · Cookie Preferences */}
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:gap-x-2.5 sm:gap-y-1"
        >
          <Link href="/privacy" className={legalLink}>
            Privacy Policy
          </Link>
          <span className="hidden sm:inline text-white/20 text-[11px]" aria-hidden="true">·</span>
          <Link href="/terms" className={legalLink}>
            Terms of Service
          </Link>
          <span className="hidden sm:inline text-white/20 text-[11px]" aria-hidden="true">·</span>
          <CookiePreferences className={legalLink} />
        </nav>
      </div>
    </footer>
  )
}
