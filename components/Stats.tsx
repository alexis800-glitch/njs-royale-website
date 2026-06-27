'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const stats = [
  { number: 'Coastal', label: 'Resort Suites' },
  { number: '5★', label: 'Five-Star Standard' },
  { number: '4', label: 'Signature Restaurants' },
  { number: '∞', label: 'Horizon Views' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: 'easeOut' } },
}

export default function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section className="bg-[#0A1628] py-14 border-t border-b border-gold/15">
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-8 text-center"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <div className="font-[family-name:var(--font-cormorant)] text-gold text-5xl font-light mb-2">
              {stat.number}
            </div>
            <div className="text-white/50 text-[10px] tracking-[3px] uppercase font-[family-name:var(--font-inter)]">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
