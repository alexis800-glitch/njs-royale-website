'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const slides = [
  '/images/exterior-entrance-facade-01.png',
  '/images/grand-entrance-hall-01.png',
  '/images/hero-3.jpg',
  '/images/hero-4.jpg',
  '/images/ground-floor-bar-01.png',
]

export default function Hero() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative h-screen overflow-hidden">
      {slides.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <Image
            src={src}
            alt={`NJS Royale resort view ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(135deg, rgba(10,22,40,0.65) 0%, rgba(10,22,40,0.30) 50%, rgba(10,22,40,0.75) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-gold text-xs uppercase tracking-[4px] sm:tracking-[6px] mb-6 font-[family-name:var(--font-inter)]">
          Atlantic Oceanfront • Nigeria
        </p>

        <h1
          className="font-[family-name:var(--font-cormorant)] text-white leading-none mb-8"
          style={{ fontSize: 'clamp(48px, 9vw, 100px)' }}
        >
          NJS Royale
          <br />
          <em className="text-gold not-italic italic">Beach Resort</em>
        </h1>

        <p className="text-white/65 text-lg font-light leading-relaxed max-w-lg mb-10 font-[family-name:var(--font-inter)]">
          300 ocean-facing rooms perched above Nigeria's Atlantic coast — where the horizon belongs to you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:w-auto">
          <a
            href="#rooms"
            className="w-full sm:w-auto text-center bg-gold text-navy px-8 py-4 text-[11px] uppercase tracking-widest font-semibold hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Explore the Resort →
          </a>
          <a
            href="#enquire"
            className="w-full sm:w-auto text-center border border-white text-white px-8 py-4 text-[11px] uppercase tracking-widest font-semibold hover:border-gold hover:text-gold transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Register Interest
          </a>
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="h-[3px] rounded-full transition-all duration-500"
            style={{
              width: i === active ? '24px' : '8px',
              background: i === active ? '#C9A84C' : 'rgba(255,255,255,0.3)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <span className="text-white/40 text-[9px] uppercase tracking-[4px] font-[family-name:var(--font-inter)]">
          Discover
        </span>
        <span className="text-gold animate-bounce text-lg">↓</span>
      </div>
    </section>
  )
}
