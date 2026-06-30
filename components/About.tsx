'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: 'easeOut', delay } },
})

export default function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="about" className="bg-[#F5F0E8] pt-32 pb-20 px-8" ref={ref}>
      <div className="max-w-6xl mx-auto">

        {/* Main 2-col layout */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">

          {/* Left */}
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
              The Resort
            </p>
            <h2
              className="font-[family-name:var(--font-cormorant)] text-navy leading-tight mb-8"
              style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
            >
              Where the Atlantic
              <br />
              Becomes Your
              <br />
              <em>Private Horizon</em>
            </h2>
            <p className="text-navy/58 text-lg leading-loose mb-5 font-[family-name:var(--font-inter)]">
              NJS Royale Beach Resort rises above Nigeria&apos;s Atlantic coastline as a monument to refined hospitality. Every room, every terrace, and every amenity has been positioned to offer an unobstructed relationship with the ocean.
            </p>
            <p className="text-navy/58 text-lg leading-loose mb-8 font-[family-name:var(--font-inter)]">
              From the rooftop infinity pool that mirrors the sky to the four signature restaurants perched above the waves, life here is lived at the water&apos;s edge — in absolute luxury.
            </p>
            <a
              href="#rooms"
              className="text-navy border-b border-navy/30 pb-0.5 text-[13px] uppercase tracking-[3px] hover:text-gold hover:border-gold transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Explore The Resort →
            </a>
          </motion.div>

          {/* Right */}
          <motion.div
            variants={fadeUp(0.15)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="relative"
          >
            {/* Gold border accent */}
            <div className="absolute -bottom-5 -left-5 w-4/5 h-4/5 border border-gold/40 -z-10" />

            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/double-height-grand-lounge-01.png"
                alt="NJS Royale — grand double-height lounge interior"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Beach Resort logo badge */}
            <div className="absolute top-5 right-5 bg-white p-3 shadow-xl">
              <div className="relative w-[72px] h-[72px]">
                <Image
                  src="/njs-logos/njs-royale-beach-resort-logo-gold.png"
                  alt="NJS Royale Beach Resort"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </motion.div>

        </div>

        {/* Founder's Vision */}
        <motion.div
          variants={fadeUp(0.3)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mt-10 pt-8 border-t border-gold/20"
        >
          <div className="flex flex-col sm:flex-row items-center gap-10 max-w-3xl mx-auto">

            {/* Portrait — multiply blend dissolves the white bg into the cream section */}
            <div
              className="relative w-44 h-52 sm:w-48 sm:h-56 flex-shrink-0 overflow-hidden"
              style={{ mixBlendMode: 'multiply' }}
            >
              <Image
                src="/images/njs-reference/nicole-shuler-founder.png"
                alt="Nicole Shuler — Founder, NJS Royale"
                fill
                className="object-cover object-top"
              />
            </div>

            {/* Text */}
            <div>
              <p className="text-gold text-[10px] uppercase tracking-[3px] mb-2 font-[family-name:var(--font-inter)]">
                Founder&apos;s Vision
              </p>
              <p className="font-[family-name:var(--font-cormorant)] text-navy text-2xl italic mb-4 leading-snug">
                Nicole Shuler
              </p>
              <p className="text-navy/55 text-base leading-relaxed font-[family-name:var(--font-inter)]">
                NJS Royale Beach Resort was born from Nicole Shuler&apos;s vision to create a soulful coastal retreat where Nigerian heritage meets global luxury. Designed as a destination for belonging, beauty, wellness, and refined hospitality, the resort reflects a lifelong commitment to excellence, culture, and heartfelt hospitality.
              </p>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}
