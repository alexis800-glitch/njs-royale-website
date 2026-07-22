'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { label: 'Home',           href: '#'            },
  { label: 'About',          href: '#about'       },
  { label: 'Rooms & Suites', href: '#rooms'       },
  { label: 'Dining',         href: '#amenities'   },
  { label: 'Wellness',       href: '#experiences' },
  { label: 'Experiences',    href: '#experiences' },
  { label: 'Events',         href: '#events'      },
  { label: 'Gallery',        href: '#gallery'     },
  { label: 'Contact',        href: '#enquire'     },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => closeRef.current?.focus(), 60)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [menuOpen])

  const closeMenu = () => {
    setMenuOpen(false)
    menuBtnRef.current?.focus()
  }

  const ink = scrolled ? 'text-navy' : 'text-white'

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-t transition-all duration-500 ${
          scrolled
            ? 'bg-[#f6f2e9] border-t-navy shadow-[0_1px_14px_rgba(6,14,26,0.10)]'
            : 'bg-transparent border-t-white/15'
        }`}
      >
        {/* subtle dark scrim behind the header when transparent, for readability over the hero */}
        {!scrolled && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#060E1A]/50 to-transparent pointer-events-none" />
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-[84px] sm:h-[92px] px-4 sm:px-6 md:px-10">

          {/* ── Left: hamburger + Menu ── */}
          <div className="flex items-center gap-3 justify-self-start min-w-0">
            <button
              ref={menuBtnRef}
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              className={`${ink} hover:text-gold transition-colors duration-300 p-1`}
            >
              <Menu size={22} strokeWidth={1.4} />
            </button>
            <span className={`hidden sm:inline text-[11px] uppercase tracking-[0.16em] ${scrolled ? 'text-navy/80' : 'text-white/80'} font-[family-name:var(--font-inter)]`}>
              Menu
            </span>
          </div>

          {/* ── Centre: official NJS Royale crest + wordmark, mathematically
                centred by the grid's auto column ── */}
          <a href="#" aria-label="NJS Royale — home" className="justify-self-center flex items-center gap-2.5 sm:gap-3.5 whitespace-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/njs-logos/njs-crest-mark.png"
              alt="NJS Royale crest"
              className="h-11 sm:h-[52px] w-auto flex-shrink-0"
            />
            <span className="flex flex-col items-start leading-none">
              <span className={`font-[family-name:var(--font-cormorant)] text-lg sm:text-xl tracking-wide transition-colors duration-500 ${ink}`}>
                NJS Royale
              </span>
              <span className="text-gold text-[8px] sm:text-[9px] uppercase tracking-[3.5px] mt-0.5 font-[family-name:var(--font-inter)]">
                Beach Resort
              </span>
            </span>
          </a>

          {/* ── Right: refined Reserve Now — transparent w/ thin ivory border over
                the hero, restrained navy fill once solid (compact on mobile) ── */}
          <div className="flex items-center justify-self-end min-w-0">
            <a
              href="#enquire"
              className={`inline-flex items-center justify-center uppercase font-medium tracking-[0.08em] transition-colors duration-300 font-[family-name:var(--font-inter)] whitespace-nowrap text-[11px] px-4 py-2.5 sm:text-[12px] sm:px-[26px] sm:min-h-[46px] ${
                scrolled
                  ? 'bg-navy text-[#f6f2e9] hover:bg-gold hover:text-navy'
                  : 'bg-transparent text-[#f6f2e9] border border-[#f6f2e9]/55 hover:bg-white/10'
              }`}
            >
              Reserve<span className="hidden sm:inline">&nbsp;Now</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Full-screen ivory menu overlay ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-[100] bg-[#f6f2e9] flex flex-col transition-all duration-[400ms] ease-out ${
          menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Top row (fixed) — close left · official crest + wordmark centred · equal space right */}
        <div className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-7 pt-7 pb-6">
          <button
            ref={closeRef}
            onClick={closeMenu}
            className="justify-self-start text-navy/60 hover:text-gold transition-colors duration-300 p-1"
            aria-label="Close navigation menu"
          >
            <X size={24} strokeWidth={1.25} />
          </button>
          <a href="#" onClick={closeMenu} aria-label="NJS Royale — home" className="justify-self-center flex items-center gap-2.5 whitespace-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/njs-logos/njs-crest-mark.png" alt="NJS Royale crest" className="h-9 sm:h-10 w-auto flex-shrink-0" />
            <span className="flex flex-col items-start leading-none">
              <span className="font-[family-name:var(--font-cormorant)] text-navy text-base sm:text-lg tracking-wide">
                NJS Royale
              </span>
              <span className="text-gold text-[8px] uppercase tracking-[3.5px] mt-0.5 font-[family-name:var(--font-inter)]">
                Beach Resort
              </span>
            </span>
          </a>
          <span aria-hidden="true" className="justify-self-end" />
        </div>

        {/* Scrollable content — left-aligned serif links + restrained Reserve */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <nav className="flex flex-col items-start pl-[8vw] pr-6 pt-5 sm:pt-9">
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={closeMenu}
                className="font-[family-name:var(--font-cormorant)] text-navy hover:text-gold font-normal leading-tight text-[24px] sm:text-[27px] md:text-[32px] py-[11px] md:py-[13px] transition-colors duration-300"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="pl-[8vw] pr-6 pt-5 pb-12 flex flex-col items-start gap-5">
            <a
              href="#enquire"
              onClick={closeMenu}
              className="inline-block text-center bg-navy text-[#f6f2e9] w-[168px] px-6 py-[13px] text-[12px] uppercase tracking-[0.08em] font-medium hover:bg-gold hover:text-navy transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Reserve Now
            </a>
            <p className="text-navy/45 text-[11px] tracking-wide font-[family-name:var(--font-inter)]">
              Mosere-Kogo Village &nbsp;·&nbsp; Ibeju-Lekki, Lagos
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
