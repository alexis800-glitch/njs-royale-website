'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

const links = [
  { label: 'Home',           href: '#'            },
  { label: 'About',          href: '#about'       },
  { label: 'Rooms & Suites', href: '#rooms'       },
  { label: 'Experiences',    href: '#experiences' },
  { label: 'Dining',         href: '#amenities'   },
  { label: 'Wellness',       href: '#experiences' },
  { label: 'Gallery',        href: '#gallery'     },
  { label: 'Events',         href: '#events'      },
  { label: 'Contact',        href: '#enquire'     },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-500 ${
          scrolled
            ? 'bg-[#0A1628]/95 backdrop-blur-md shadow-lg py-3 px-4 md:px-8'
            : 'bg-transparent py-5 px-4 md:px-8'
        }`}
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 flex-shrink-0">
          <div className="relative w-11 h-11 md:w-14 md:h-14 flex-shrink-0 rounded-sm overflow-hidden">
            <Image
              src="/njs-logos/njs-royale-logo-gold-dark.jpg"
              alt="NJS Royale"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-cormorant)] text-white text-xl font-semibold tracking-wide">
              NJS Royale
            </span>
            <span className="text-gold text-[9px] uppercase tracking-[4px] font-[family-name:var(--font-inter)] mt-0.5">
              Beach Resort
            </span>
          </div>
        </a>

        {/* Desktop links — visible lg+ */}
        <div className="hidden lg:flex items-center gap-5 xl:gap-7">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-white/65 hover:text-gold text-[10px] xl:text-[11px] uppercase tracking-widest transition-colors duration-300 font-[family-name:var(--font-inter)] whitespace-nowrap"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right: CTA + hamburger */}
        <div className="flex items-center gap-3">
          <a
            href="#enquire"
            className="hidden sm:inline-flex items-center bg-gold text-navy text-[10px] uppercase tracking-wider font-semibold px-5 py-2.5 md:px-6 md:py-3 hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)] whitespace-nowrap"
          >
            Register Interest
          </a>
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden text-white/75 hover:text-gold transition-colors duration-300 p-1"
            aria-label="Open navigation menu"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* ── Mobile / tablet full-screen menu overlay ── */}
      <div
        className={`fixed inset-0 z-[100] bg-[#060E1A] flex flex-col transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gold/10">
          <div className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-cormorant)] text-white text-xl font-semibold tracking-wide">
              NJS Royale
            </span>
            <span className="text-gold text-[9px] uppercase tracking-[4px] font-[family-name:var(--font-inter)] mt-0.5">
              Beach Resort
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-white/60 hover:text-gold transition-colors duration-300 p-1"
            aria-label="Close navigation menu"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 flex flex-col justify-center px-8 gap-0">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="font-[family-name:var(--font-cormorant)] text-white/75 hover:text-gold text-[28px] py-3.5 border-b border-white/5 transition-colors duration-300"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Bottom CTA */}
        <div className="px-8 pb-10 pt-6">
          <a
            href="#enquire"
            onClick={() => setMenuOpen(false)}
            className="block w-full text-center bg-gold text-navy px-6 py-4 text-[11px] uppercase tracking-widest font-semibold hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Register Interest
          </a>
        </div>
      </div>
    </>
  )
}
