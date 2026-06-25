'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

export default function Quote() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section className="relative h-[65vh] flex items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-3.jpg"
        alt="NJS Royale spa suite interior"
        fill
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(10,22,40,0.68)' }}
      />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 36 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
        className="relative z-10 text-center px-8 max-w-3xl mx-auto"
      >
        <div className="font-[family-name:var(--font-cormorant)] text-gold text-7xl leading-none mb-4 italic">
          "
        </div>
        <p
          className="font-[family-name:var(--font-cormorant)] text-white italic leading-snug mb-8"
          style={{ fontSize: 'clamp(26px, 4vw, 46px)' }}
        >
          The Atlantic is not just a view. It is the soul of NJS Royale.
        </p>
        <p className="text-gold text-[10px] tracking-[5px] uppercase font-[family-name:var(--font-inter)]">
          NJS Royale Beach Resort • Nigeria
        </p>
      </motion.div>
    </section>
  )
}
