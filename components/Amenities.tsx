'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Waves, Leaf, UtensilsCrossed, CalendarDays, Sun, BellRing } from 'lucide-react'

const amenities = [
  {
    Icon: Waves,
    title: 'Infinity Pool',
    desc: 'A stunning second-floor ocean-facing infinity pool — the centrepiece of the resort, with a 12-metre pool bar and uninterrupted Atlantic views.',
  },
  {
    Icon: Leaf,
    title: 'Spa & Wellness',
    desc: 'A dedicated wellness sanctuary offering treatments inspired by coastal African traditions and modern luxury therapies.',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Fine Dining',
    desc: 'Four signature restaurants including an international kitchen and a ground floor lounge bar with ocean views.',
  },
  {
    Icon: CalendarDays,
    title: 'Event Spaces',
    desc: "Versatile ocean-view halls for weddings, corporate conferences, and high-profile private gatherings on Nigeria's Atlantic coast.",
  },
  {
    Icon: Sun,
    title: 'Private Beach',
    desc: 'An exclusive stretch of Atlantic shoreline reserved solely for NJS Royale guests — pristine, private, and breathtaking.',
  },
  {
    Icon: BellRing,
    title: 'Butler Concierge',
    desc: 'A dedicated team of hospitality professionals available around the clock to curate and elevate every moment of your stay.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: 'easeOut' } },
}

export default function Amenities() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="amenities" className="bg-[#F5F0E8] py-32 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Facilities
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-navy leading-tight mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Resort Amenities
          </h2>
          <p className="text-navy/50 text-base font-[family-name:var(--font-inter)] max-w-md mx-auto">
            Every detail designed for your pleasure. Every space created for the extraordinary.
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-5"
        >
          {amenities.map(({ Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="group border border-gold/15 p-8 transition-all duration-500 hover:bg-[#0A1628] hover:border-gold cursor-default"
            >
              <div className="mb-5">
                <Icon
                  size={26}
                  strokeWidth={1.25}
                  className="text-gold transition-colors duration-500"
                />
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-navy group-hover:text-white text-2xl mb-3 transition-colors duration-500">
                {title}
              </h3>
              <p className="text-navy/55 group-hover:text-white/50 text-sm leading-relaxed transition-colors duration-500 font-[family-name:var(--font-inter)]">
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
