'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const links = ['About', 'Rooms', 'Amenities', 'Gallery', 'Events']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-500 ${
        scrolled
          ? 'bg-[#0A1628]/95 backdrop-blur-md shadow-lg py-3.5 px-4 md:px-8'
          : 'bg-transparent py-6 px-4 md:px-8'
      }`}
    >
      <a href="#" className="flex items-center gap-3">
        <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-sm overflow-hidden">
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

      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="text-white/70 hover:text-gold text-[11px] uppercase tracking-widest transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            {link}
          </a>
        ))}
      </div>

      <a
        href="#enquire"
        className="bg-gold text-navy text-[10px] uppercase tracking-wider font-semibold px-4 py-2.5 md:px-6 md:py-3 md:tracking-widest hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)] whitespace-nowrap"
      >
        Book Now
      </a>
    </nav>
  )
}
