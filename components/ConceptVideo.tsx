'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut', delay } },
})

export default function ConceptVideo() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' })

  return (
    <section ref={ref} className="relative bg-[#060E1A] overflow-hidden">

      {/* Video container */}
      <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">

        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/images/njs-rooftop-experience.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay — heavier at top and bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(6,14,26,0.55) 0%, rgba(6,14,26,0.25) 40%, rgba(6,14,26,0.60) 75%, rgba(6,14,26,0.92) 100%)',
          }}
        />

        {/* Centred text block */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">

          <motion.p
            variants={fadeUp(0)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="text-gold/70 text-[9px] uppercase tracking-[5px] mb-5 font-[family-name:var(--font-inter)]"
          >
            Phase 1 Concept Visual
          </motion.p>

          <motion.h2
            variants={fadeUp(0.12)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight drop-shadow-lg mb-6"
            style={{ fontSize: 'clamp(32px, 5vw, 68px)' }}
          >
            Rooftop Infinity Pool
            <br />
            <em className="text-gold italic">Experience</em>
          </motion.h2>

          <motion.p
            variants={fadeUp(0.22)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="text-white/60 text-sm sm:text-base leading-relaxed max-w-xl font-[family-name:var(--font-inter)]"
          >
            A cinematic preview of the proposed rooftop leisure atmosphere — designed to capture
            ocean-facing relaxation, sunset views, and the elevated lifestyle vision for NJS Royale
            Beach Resort.
          </motion.p>

        </div>

        {/* Bottom footnote — anchored to video bottom edge */}
        <motion.p
          variants={fadeUp(0.35)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="absolute bottom-6 left-0 right-0 text-center text-white/25 text-[10px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]"
        >
          Concept media for presentation purposes
        </motion.p>

      </div>

      {/* Thin gold rule separator */}
      <div className="w-full flex justify-center py-0">
        <div className="h-px w-32 bg-gold/20" />
      </div>

    </section>
  )
}
