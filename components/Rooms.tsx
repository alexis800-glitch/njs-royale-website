'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Users, ArrowRight } from 'lucide-react'

const rooms = [
  {
    name: 'Deluxe Ocean View',
    category: 'Deluxe',
    image: '/images/room-deluxe.jpg',
    description:
      'A refined Atlantic-facing room with a private balcony, king bed, and curated amenities positioned for the finest coastal experience.',
    bed: 'King Bed',
    occupancy: 'Up to 2 guests',
  },
  {
    name: 'Junior Suite',
    category: 'Suite',
    image: '/images/room-suite.jpg',
    description:
      'A generously appointed suite with a separate living area, spa-inspired en-suite bathroom, and sweeping panoramic sea views from every angle.',
    bed: 'King Bed',
    occupancy: 'Up to 2 guests',
  },
  {
    name: 'Penthouse Suite',
    category: 'Penthouse',
    image: '/images/room-penthouse.jpg',
    description:
      'The pinnacle of NJS Royale. A private full-floor suite with wraparound Atlantic terraces, dedicated butler service, and a personal plunge pool.',
    bed: 'King Bed · Private Plunge Pool',
    occupancy: 'Up to 4 guests',
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
            Accommodation
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Rooms &amp; Suites
          </h2>
          <p className="text-white/50 text-base font-[family-name:var(--font-inter)] max-w-md mx-auto">
            Every room and suite at NJS Royale is positioned to frame the Atlantic. Reservations opening soon.
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-7"
        >
          {rooms.map((room) => (
            <motion.div
              key={room.name}
              variants={cardVariants}
              className="group flex flex-col border border-gold/10 hover:border-gold/30 transition-colors duration-500"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={room.image}
                  alt={room.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute top-4 left-4 bg-[#0A1628]/80 backdrop-blur-sm px-3 py-1">
                  <span className="text-gold text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
                    {room.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6 gap-4">
                <h3 className="font-[family-name:var(--font-cormorant)] text-white text-2xl leading-tight">
                  {room.name}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-inter)] flex-1">
                  {room.description}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-gold/10 text-white/45 text-[10px] font-[family-name:var(--font-inter)]">
                  <span>{room.bed}</span>
                  <span className="text-gold/25">·</span>
                  <Users size={11} strokeWidth={1.5} className="text-gold/50 shrink-0" />
                  <span>{room.occupancy}</span>
                </div>

                {/* CTA */}
                <a
                  href="#enquire"
                  className="flex items-center justify-between text-gold text-[11px] uppercase tracking-[2px] hover:text-white transition-colors duration-300 font-[family-name:var(--font-inter)] pt-1"
                >
                  Book This Room
                  <ArrowRight size={13} strokeWidth={1.5} />
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-12">
          <p className="text-white/30 text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
            Full room catalogue available upon request
          </p>
        </div>

      </div>
    </section>
  )
}
