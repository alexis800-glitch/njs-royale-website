'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Crown, Building2, UtensilsCrossed, Briefcase } from 'lucide-react'

const offerings = [
  {
    Icon: Crown,
    title: 'Weddings & Celebrations',
    desc: 'Celebrate your most precious moments against the Atlantic backdrop. Our event specialists curate every detail — from intimate ceremonies to grand receptions — with lasting distinction.',
  },
  {
    Icon: Building2,
    title: 'Conferences & Summits',
    desc: 'Ocean-view conference suites for executive summits, product launches, and high-profile international gatherings — supported by full AV, catering, and dedicated coordination teams.',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Banquets & Galas',
    desc: 'Host unforgettable gala dinners and banquets in our grand event halls. From intimate seated suppers to large-scale black-tie evenings, every occasion is handled with precision.',
  },
  {
    Icon: Briefcase,
    title: 'Corporate Retreats',
    desc: 'Inspire your leadership team with a purpose-built retreat at NJS Royale. Private dining, collaboration spaces, and Atlantic vistas combine for a truly transformative offsite.',
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

export default function EventCenter() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="events" className="bg-[#060E1A] py-32 px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-7">
            <div className="bg-white p-3 shadow-md ring-1 ring-gold/10">
              <div className="relative w-[80px] h-[80px]">
                <Image
                  src="/njs-logos/njs-royale-event-conference-center-logo-gold.png"
                  alt="NJS Royale Event & Conference Center"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            NJS Royale Event &amp; Conference Center
          </p>

          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Extraordinary Events,
            <br />
            <em className="text-gold italic">Atlantic Setting</em>
          </h2>

          <p className="text-white/40 text-base font-[family-name:var(--font-inter)] max-w-xl mx-auto">
            From intimate private celebrations to large-scale international conferences, NJS Royale Event &amp; Conference Center provides Nigeria's premier coastal event destination.
          </p>
        </div>

        {/* Service cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 gap-6 mb-14"
        >
          {offerings.map(({ Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="group border border-gold/10 p-8 hover:border-gold/30 hover:bg-[#0A1628]/60 transition-all duration-500 cursor-default"
            >
              <div className="mb-5">
                <Icon
                  size={24}
                  strokeWidth={1.25}
                  className="text-gold/70 group-hover:text-gold transition-colors duration-500"
                />
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-white text-2xl mb-3 leading-snug">
                {title}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed font-[family-name:var(--font-inter)]">
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#enquire"
            className="w-full sm:w-auto text-center bg-gold text-navy px-8 py-4 text-[11px] uppercase tracking-widest font-semibold hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Plan an Event
          </a>
          <a
            href="#enquire"
            className="w-full sm:w-auto text-center border border-gold/40 text-gold px-8 py-4 text-[11px] uppercase tracking-widest font-semibold hover:border-gold hover:text-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Request a Proposal
          </a>
        </div>

      </div>
    </section>
  )
}
