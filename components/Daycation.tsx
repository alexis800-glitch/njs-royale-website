'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { CalendarDays, Sun, Waves } from 'lucide-react'

const facts = [
  { Icon: CalendarDays, label: 'Open', value: 'Thursday to Sunday' },
  { Icon: Sun, label: 'First season', value: 'Opening December' },
  { Icon: Waves, label: 'Enjoy', value: 'Leisure park, lounge & pool' },
]

export default function Daycation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="daycation" className="bg-sand py-28 md:py-32 px-8">
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
            src="/images/njs-rooftop-infinity-pool-atlantic-view.png"
            alt="NJS Royale ocean-facing infinity pool and leisure deck"
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
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-5 font-[family-name:var(--font-inter)]">
            Opening this December
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-navy leading-tight mb-6"
            style={{ fontSize: 'clamp(34px, 4.4vw, 54px)' }}
          >
            The Daycation
            <br />
            <em className="text-gold italic">Begins</em>
          </h2>
          <p className="text-navy/60 leading-relaxed mb-8 font-[family-name:var(--font-inter)] max-w-lg">
            NJS Royale opens first as a beach resort daycation. A leisure park, a relaxed
            lounge and an ocean-facing pool, open Thursday to Sunday. Come for the day and
            stay through golden hour.
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-9 border-t border-navy/10 pt-7">
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

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#enquire"
              className="inline-flex items-center justify-center text-center bg-navy text-[#f6f2e9] px-7 py-[14px] text-[12px] uppercase tracking-[0.08em] font-medium hover:bg-gold hover:text-navy transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Plan Your Day
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
