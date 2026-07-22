'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Waves, Building2, Wine, Eye } from 'lucide-react'
import SectionVideo from './SectionVideo'

const features = [
  { Icon: Building2, stat: 'Second Floor', label: 'Ocean-Facing Terrace' },
  { Icon: Waves,     stat: 'Infinity',     label: 'Edge Pool' },
  { Icon: Wine,      stat: '12 Metres',    label: 'Pool Bar' },
  { Icon: Eye,       stat: 'Atlantic',     label: 'Views' },
]

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: 'easeOut', delay } },
})

export default function RooftopPool() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section ref={ref} id="rooftop" className="relative bg-[#060E1A] overflow-hidden">

      {/* Cinematic daytime aerial video — second-floor ocean-facing pool terrace */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <SectionVideo
          name="daytime"
          poster="/images/njs-hero-daytime-poster.jpg"
          alt="NJS Royale second-floor ocean-facing infinity pool and Atlantic coast, Nigeria"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(6,14,26,0.20) 0%, rgba(6,14,26,0.35) 50%, rgba(6,14,26,1) 100%)',
          }}
        />

        {/* Heading overlaid on video */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Ocean-Facing Pool Terrace
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-none drop-shadow-lg"
            style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}
          >
            Where the Sky Meets
            <br />
            <em className="text-gold italic">the Atlantic</em>
          </h2>
        </div>
      </div>

      {/* Ambient gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,168,76,0.07) 0%, transparent 65%)',
        }}
      />

      {/* Content below video */}
      <div className="relative max-w-6xl mx-auto px-8 pb-32">

        {/* Divider */}
        <motion.div
          variants={fadeUp(0)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex items-center justify-center gap-5 py-12"
        >
          <div className="h-px flex-1 max-w-[120px] bg-gold/20" />
          <Waves size={16} strokeWidth={1.25} className="text-gold/50" />
          <div className="h-px flex-1 max-w-[120px] bg-gold/20" />
        </motion.div>

        {/* Body copy */}
        <motion.p
          variants={fadeUp(0.1)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-center text-white/45 text-base leading-loose max-w-2xl mx-auto mb-16 font-[family-name:var(--font-inter)]"
        >
          Set on the second-floor ocean-facing terrace, the NJS Royale infinity pool opens to
          uninterrupted views of the Atlantic. Cabanas, a 12-metre pool bar and dedicated guest
          facilities create a relaxed setting from day into night.
        </motion.p>

        {/* 4 feature stats */}
        <motion.div
          variants={fadeUp(0.22)}
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
                <Icon
                  size={22}
                  strokeWidth={1.25}
                  className="text-gold/60 group-hover:text-gold transition-colors duration-500"
                />
              </div>
              <div className="font-[family-name:var(--font-cormorant)] text-gold text-3xl font-light mb-1 leading-none">
                {stat}
              </div>
              <div className="text-white/45 text-[10px] uppercase tracking-[2px] mt-2 font-[family-name:var(--font-inter)]">
                {label}
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
