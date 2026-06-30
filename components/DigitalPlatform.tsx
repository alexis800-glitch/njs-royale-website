'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CalendarCheck, Bot, BarChart3, Zap } from 'lucide-react'

const features = [
  {
    Icon: CalendarCheck,
    title: 'Guest Reservations',
    desc: 'Room booking, spa appointments, beach activities, indoor golf, kids activities, and restaurant reservations — structured for a unified guest journey.',
  },
  {
    Icon: Bot,
    title: 'Digital Concierge',
    desc: 'Future AI-assisted guest support for room service, housekeeping requests, resort questions, reception chat, and personalized stay recommendations.',
  },
  {
    Icon: BarChart3,
    title: 'Owner Dashboard',
    desc: 'Executive visibility into occupancy, revenue, ADR, RevPAR, restaurant revenue, event revenue, daily arrivals, and departures.',
  },
  {
    Icon: Zap,
    title: 'AI Marketing Engine',
    desc: 'AI-assisted content creation for resort videos, social campaigns, SEO articles, seasonal offers, and luxury brand storytelling.',
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

export default function DigitalPlatform() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section className="bg-[#060E1A] py-32 px-8 border-t border-gold/10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Future Platform
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Beyond Booking:
            <br />
            <em className="text-gold italic">The NJS Royale Digital Platform</em>
          </h2>
          <p className="text-white/50 text-base font-[family-name:var(--font-inter)] max-w-xl mx-auto">
            Designed to grow from a luxury website into a complete guest, operations, and revenue intelligence platform.
          </p>
        </div>

        {/* Cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 gap-6 mb-10"
        >
          {features.map(({ Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="group border border-gold/10 p-8 hover:border-gold/25 hover:bg-[#0A1628]/60 transition-all duration-500 cursor-default"
            >
              <div className="flex items-center gap-3 mb-5">
                <Icon
                  size={20}
                  strokeWidth={1.25}
                  className="text-gold/60 group-hover:text-gold/90 transition-colors duration-500 flex-shrink-0"
                />
                <span className="text-gold/35 text-[9px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
                  Phase 2
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-white text-2xl mb-3 leading-snug">
                {title}
              </h3>
              <p className="text-white/45 text-sm leading-relaxed font-[family-name:var(--font-inter)]">
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Phase note */}
        <p className="text-white/25 text-[11px] text-center leading-relaxed italic font-[family-name:var(--font-inter)] max-w-2xl mx-auto">
          Advanced booking workflows, PMS/Aiosell integration, dashboards, and AI concierge features will be activated in future phases.
        </p>

      </div>
    </section>
  )
}
