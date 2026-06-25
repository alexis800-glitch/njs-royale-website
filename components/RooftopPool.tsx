'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Waves, Sun, Eye, UtensilsCrossed } from 'lucide-react'

const features = [
  { Icon: Sun,             stat: 'Fifth Floor',  label: 'Rooftop Elevation' },
  { Icon: Waves,           stat: 'Infinity',     label: 'Edge Pool' },
  { Icon: Eye,             stat: '360°',         label: 'Ocean Panoramas' },
  { Icon: UtensilsCrossed, stat: 'Al Fresco',    label: 'Poolside Dining' },
]

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: 'easeOut', delay } },
})

export default function RooftopPool() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section ref={ref} id="rooftop" className="relative bg-[#060E1A] py-32 px-8 overflow-hidden">
      {/* Ambient gold glow — suggests warmth of the pool at golden hour */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,168,76,0.08) 0%, transparent 65%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeUp(0)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-center mb-6"
        >
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Rooftop Experience
          </p>

          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-none"
            style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}
          >
            Where the Sky Meets
            <br />
            <em className="text-gold italic">the Atlantic</em>
          </h2>
        </motion.div>

        {/* Divider */}
        <motion.div
          variants={fadeUp(0.1)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex items-center justify-center gap-5 my-10"
        >
          <div className="h-px flex-1 max-w-[120px] bg-gold/20" />
          <Waves size={16} strokeWidth={1.25} className="text-gold/50" />
          <div className="h-px flex-1 max-w-[120px] bg-gold/20" />
        </motion.div>

        {/* Body copy */}
        <motion.p
          variants={fadeUp(0.15)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-center text-white/45 text-base leading-loose max-w-2xl mx-auto mb-4 font-[family-name:var(--font-inter)]"
        >
          Rising above Nigeria's Atlantic coastline on the fifth floor, the NJS Royale rooftop infinity pool offers an unbroken panorama of sky and sea — a horizon that belongs to you alone.
        </motion.p>

        <motion.p
          variants={fadeUp(0.2)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-center text-white/30 text-sm leading-loose max-w-xl mx-auto mb-20 font-[family-name:var(--font-inter)]"
        >
          Poolside recliners, attentive attendant service, and direct access to the rooftop international kitchen — every element is conceived for unhurried luxury above the Atlantic.
        </motion.p>

        {/* 4 feature stats */}
        <motion.div
          variants={fadeUp(0.28)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gold/10"
        >
          {features.map(({ Icon, stat, label }) => (
            <div
              key={label}
              className="bg-[#060E1A] px-4 py-8 md:px-8 md:py-10 text-center group hover:bg-[#0A1628] transition-colors duration-500"
            >
              <div className="flex justify-center mb-4">
                <Icon size={22} strokeWidth={1.25} className="text-gold/60 group-hover:text-gold transition-colors duration-500" />
              </div>
              <div className="font-[family-name:var(--font-cormorant)] text-gold text-3xl font-light mb-1 leading-none">
                {stat}
              </div>
              <div className="text-white/30 text-[9px] uppercase tracking-[3px] mt-2 font-[family-name:var(--font-inter)]">
                {label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
