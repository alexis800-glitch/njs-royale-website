'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, Umbrella, Film, UtensilsCrossed, Flag, Star } from 'lucide-react'

const experiences = [
  {
    Icon: Sparkles,
    title: 'Spa & Wellness',
    desc: 'Massage, beauty treatments, salon appointments, and wellness experiences designed for complete relaxation.',
  },
  {
    Icon: Umbrella,
    title: 'Beach Cabanas',
    desc: 'Private cabanas for oceanfront lounging, intimate gatherings, and premium beachside comfort.',
  },
  {
    Icon: Film,
    title: 'Movie Nights',
    desc: 'Curated beach movie nights and outdoor cinema experiences under the Lagos coastal sky.',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Beach Dinners',
    desc: 'Private dining experiences by the water, from romantic dinners to curated group celebrations.',
  },
  {
    Icon: Flag,
    title: 'Indoor Golf Simulator',
    desc: 'A premium indoor golf experience for guests, leisure groups, and corporate retreats.',
  },
  {
    Icon: Star,
    title: 'Kids Activities',
    desc: 'Family-friendly activities designed to keep younger guests engaged, entertained, and safe.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: 'easeOut' } },
}

export default function ResortExperiences() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="experiences" className="bg-[#0A1628] py-32 px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Resort Life
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Curated Resort
            <br />
            <em className="text-gold italic">Experiences</em>
          </h2>
          <p className="text-white/50 text-base font-[family-name:var(--font-inter)] max-w-xl mx-auto">
            From oceanfront relaxation to private celebrations, every part of NJS Royale is designed around elevated guest experiences.
          </p>
        </div>

        {/* Cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14"
        >
          {experiences.map(({ Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="group border border-gold/10 p-7 hover:border-gold/30 hover:bg-[#060E1A]/60 transition-all duration-500 cursor-default"
            >
              <div className="mb-5">
                <Icon
                  size={22}
                  strokeWidth={1.25}
                  className="text-gold/70 group-hover:text-gold transition-colors duration-500"
                />
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-white text-xl mb-3 leading-snug">
                {title}
              </h3>
              <p className="text-white/45 text-sm leading-relaxed font-[family-name:var(--font-inter)]">
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="flex justify-center">
          <a
            href="#enquire"
            className="bg-gold text-navy px-10 py-4 text-[11px] uppercase tracking-widest font-semibold hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Explore Experiences
          </a>
        </div>

      </div>
    </section>
  )
}
