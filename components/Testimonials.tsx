'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Briefcase, Heart } from 'lucide-react'

const pillars = [
  {
    Icon: Heart,
    title: 'Refined Oceanfront Hospitality',
    body: 'Every aspect of the NJS Royale experience is curated around the Atlantic. From arrival to departure, the resort is designed to anticipate, personalise, and exceed the expectations of the most discerning guests.',
  },
  {
    Icon: Briefcase,
    title: 'Corporate & Private Retreats',
    body: 'Purpose-built for high-profile business retreats, executive summits, and exclusive private gatherings. Ocean-view conference suites, dedicated event coordination, and complete discretion — on Nigeria\'s Atlantic coast.',
  },
  {
    Icon: Users,
    title: 'Celebrations & Luxury Leisure',
    body: 'Whether marking a milestone, celebrating a union, or simply indulging in unhurried Atlantic leisure, NJS Royale offers a setting of exceptional beauty and an unmatched standard of premium service.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: 'easeOut' } },
}

export default function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section className="bg-[#F5F0E8] py-32 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Designed for Exceptional Stays
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-navy leading-tight mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            The NJS Royale Experience
          </h2>
          <p className="text-navy/50 text-base font-[family-name:var(--font-inter)] max-w-lg mx-auto">
            A resort conceived for those who demand more than accommodation — crafted for those who expect an experience.
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-6"
        >
          {pillars.map(({ Icon, title, body }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="bg-white p-9 border border-gold/15"
            >
              <div className="mb-5">
                <Icon size={22} strokeWidth={1.25} className="text-gold" />
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-navy text-xl leading-snug mb-4">
                {title}
              </h3>
              <p className="text-navy/55 text-sm leading-relaxed font-[family-name:var(--font-inter)]">
                {body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
