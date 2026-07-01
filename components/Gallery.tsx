'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: 'easeOut' } },
}

const images = [
  { src: '/images/grand-entrance-hall-01.png',        alt: 'NJS Royale grand entrance hall'   },
  { src: '/images/double-height-grand-lounge-01.png', alt: 'NJS Royale grand lounge interior' },
  { src: '/images/ground-floor-bar-01.png',           alt: 'NJS Royale ground floor bar'      },
]

export default function Gallery() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="gallery" className="bg-[#0A1628] py-32 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            A Glimpse Inside
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            NJS Royale
          </h2>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Desktop editorial mosaic — large feature left, two stacked right */}
          <div className="hidden md:block">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: '3fr 2fr', gridTemplateRows: '300px 300px' }}
            >
              <motion.div
                variants={itemVariants}
                className="relative overflow-hidden group"
                style={{ gridRow: '1 / 3' }}
              >
                <Image
                  src="/images/grand-entrance-hall-01.png"
                  alt="NJS Royale grand entrance hall"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="relative overflow-hidden group">
                <Image
                  src="/images/double-height-grand-lounge-01.png"
                  alt="NJS Royale grand lounge interior"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="relative overflow-hidden group">
                <Image
                  src="/images/ground-floor-bar-01.png"
                  alt="NJS Royale ground floor bar"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                />
              </motion.div>
            </div>
          </div>

          {/* Mobile: 2-column uniform grid */}
          <div className="md:hidden grid grid-cols-2 gap-2">
            {images.map(({ src, alt }) => (
              <motion.div
                key={src}
                variants={itemVariants}
                className="relative aspect-[4/3] overflow-hidden group"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
