'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const spaces = [
  {
    title: 'Suite Concept',
    label: 'Rooms Preview',
    image: '/images/room-deluxe.jpg',
    description:
      'A first look at NJS Royale\'s en-suite concept — premium materials, curated furnishings, and an atmosphere of restful Atlantic luxury.',
  },
  {
    title: 'Spa & Wellness Suite',
    label: 'Wellness',
    image: '/images/room-suite.jpg',
    description:
      'A private treatment sanctuary within the resort — purpose-built for restorative wellness experiences inspired by coastal African traditions.',
  },
  {
    title: 'Grand Lounge',
    label: 'Leisure',
    image: '/images/double-height-grand-lounge-01.png',
    description:
      'A sweeping double-height lounge conceived for quiet reflection, private gatherings, and unhurried leisure in an atmosphere of understated grandeur.',
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

export default function Rooms() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="rooms" className="bg-[#0A1628] py-32 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Interior Preview
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Signature Spaces
          </h2>
          <p className="text-white/35 text-base font-[family-name:var(--font-inter)] max-w-md mx-auto">
            A design concept preview of NJS Royale's interior spaces. Final photography will follow as the resort takes shape.
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-7"
        >
          {spaces.map((space) => (
            <motion.div
              key={space.title}
              variants={cardVariants}
              className="group cursor-default transition-transform duration-500 hover:-translate-y-2"
            >
              <div className="relative aspect-[3/4] overflow-hidden mb-5">
                <Image
                  src={space.image}
                  alt={space.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-[family-name:var(--font-cormorant)] text-white text-2xl">
                  {space.title}
                </h3>
                <span className="text-gold/50 text-xs uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
                  {space.label}
                </span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed font-[family-name:var(--font-inter)]">
                {space.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
