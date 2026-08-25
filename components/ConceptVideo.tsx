'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionVideo from './SectionVideo'

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

        {/* Reframed, not regenerated. As the shot pulls back it reveals an inland
            strip of scrub and road along the right edge that is not part of the
            approved site. On wide viewports the box is wider than the clip, so
            object-cover shows the full width and that strip lands in frame; anchoring
            the transform to the left and scaling 1.16 pushes the right ~14% out of
            the box. Below md the box is far narrower than the clip and object-cover
            already crops to the middle, so the strip never appears and no transform
            is applied. Pool, ocean, sunset and architecture are untouched. */}
        <SectionVideo
          name="sunset"
          poster="/images/njs-hero-sunset-poster.jpg"
          alt="NJS Royale second-floor ocean-facing pool terrace at Atlantic sunset"
          frameClassName="md:scale-[1.16] md:origin-left"
        />

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
            Atlantic Sunset Experience
          </motion.p>

          <motion.h2
            variants={fadeUp(0.12)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight drop-shadow-lg mb-6"
            style={{ fontSize: 'clamp(32px, 5vw, 68px)' }}
          >
            Atlantic Sunset Pool
            <br />
            <em className="text-gold italic">Experience</em>
          </motion.h2>

          {/* Mobile: one short, emotive supporting line (no long paragraph over the image) */}
          <motion.p
            variants={fadeUp(0.22)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="sm:hidden text-white/70 text-[15px] leading-relaxed max-w-[17rem] font-[family-name:var(--font-inter)]"
          >
            Sunset, sea views and effortless poolside evenings.
          </motion.p>

          {/* Desktop / tablet: full descriptive copy (unchanged) */}
          <motion.p
            variants={fadeUp(0.22)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="hidden sm:block text-white/60 text-base leading-relaxed max-w-xl font-[family-name:var(--font-inter)]"
          >
            A cinematic view of the second-floor ocean-facing pool terrace as the sun settles over
            the Atlantic — bringing together the infinity pool, cabanas, pool bar and warm evening
            atmosphere of NJS Royale.
          </motion.p>

        </div>

        {/* Bottom footnote — anchored to video bottom edge */}
        <motion.p
          variants={fadeUp(0.35)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="absolute bottom-6 left-0 right-0 text-center text-white/25 text-[10px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]"
        >
          Architectural visualisation for presentation purposes
        </motion.p>

      </div>

      {/* Thin gold rule separator */}
      <div className="w-full flex justify-center py-0">
        <div className="h-px w-32 bg-gold/20" />
      </div>

    </section>
  )
}
