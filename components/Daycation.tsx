'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Building2, CalendarDays, Waves } from 'lucide-react'
import { PHASE_ONE_DATE, PHASE_ONE_INCLUDES, PHASE_TWO_DATE } from '@/lib/opening'

// Phase One of the two-phase opening.
//
// Phase One is the resort opening to guests — the venues, the lounges, the
// entertainment and the beach — not the second-floor pool area alone, as this
// section previously said. Only guest rooms and accommodation wait for Phase Two.
// The scope lives in lib/opening.ts; do not add facilities that are not listed
// there unless they are separately confirmed.
const facts = [
  { Icon: CalendarDays, label: 'Phase One', value: PHASE_ONE_DATE },
  { Icon: Waves, label: 'Opening First', value: 'The resort experience' },
  { Icon: Building2, label: 'Phase Two', value: PHASE_TWO_DATE },
]

export default function PhaseOne() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="phase-one" className="relative bg-sand py-28 md:py-32 px-8">
      {/* Earlier links pointed at #daycation; keep them landing on this section. */}
      <span id="daycation" aria-hidden="true" className="absolute top-0 left-0" />

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Image */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          className="relative aspect-[4/3] overflow-hidden order-1 md:order-none"
        >
          <Image
            src="/images/njs-hero-sunset-poster.jpg"
            alt="NJS Royale second-floor ocean-facing pool terrace at sunset over the Atlantic"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, 48vw"
          />
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
          transition={{ duration: 0.85, ease: 'easeOut', delay: 0.12 }}
        >
          <span className="inline-flex items-center gap-2 border border-gold/50 text-gold text-[11px] font-semibold uppercase tracking-[3px] px-4 py-2 mb-6 font-[family-name:var(--font-inter)]">
            <CalendarDays size={13} strokeWidth={1.6} />
            Phase One · December 12, 2026
          </span>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-navy leading-tight mb-6"
            style={{ fontSize: 'clamp(34px, 4.4vw, 54px)' }}
          >
            Experience the Resort
            <br />
            <em className="text-gold italic">Before the Rooms Open</em>
          </h2>
          <p className="text-navy/60 leading-relaxed mb-7 font-[family-name:var(--font-inter)] max-w-lg">
            NJS Royale opens on {PHASE_ONE_DATE}. Come experience the resort before the rooms
            open &mdash; its restaurants and lounges, its live entertainment, the ocean-facing
            pool terrace and the private beach on the Atlantic. Guest rooms and accommodation
            open with Phase Two on {PHASE_TWO_DATE}.
          </p>

          <ul className="mb-8 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {PHASE_ONE_INCLUDES.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-navy/75 text-[15px] font-[family-name:var(--font-inter)]"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-gold" />
                {item}
              </li>
            ))}
          </ul>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 border-t border-navy/10 pt-7">
            {facts.map(({ Icon, label, value }) => (
              <div key={label}>
                <Icon size={18} strokeWidth={1.4} className="text-gold mb-2" />
                <dt className="text-navy/45 text-[10px] uppercase tracking-[2px] mb-1 font-[family-name:var(--font-inter)]">
                  {label}
                </dt>
                <dd className="font-[family-name:var(--font-cormorant)] text-navy text-lg leading-snug">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mb-8 text-navy/45 text-[12px] italic font-[family-name:var(--font-inter)]">
            Access arrangements and operating details for Phase One will be announced.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#enquire"
              className="inline-flex items-center justify-center text-center bg-navy text-[#f6f2e9] px-7 py-[14px] text-[12px] uppercase tracking-[0.08em] font-medium hover:bg-gold hover:text-navy transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Enquire
            </a>
            <a
              href="tel:+2347075334158"
              className="inline-flex items-center justify-center text-center border border-navy/30 text-navy px-7 py-[14px] text-[12px] uppercase tracking-[0.08em] font-medium hover:border-gold hover:text-gold transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Call Us
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
