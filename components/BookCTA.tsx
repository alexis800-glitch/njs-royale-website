'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { MapPin, Phone } from 'lucide-react'

const info = [
  {
    Icon: MapPin,
    label: 'Location',
    value: 'Mosere-Kogo Village, via Eko Akete, Ibeju-Lekki, Lagos State, Nigeria',
  },
  { Icon: Phone, label: 'Telephone', value: '0707 533 4158', href: 'tel:+2347075334158' },
]

export default function BookCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="enquire" className="bg-[#0A1628] py-32 px-8">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 36 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
        className="max-w-[760px] mx-auto text-center"
      >
        <p className="text-gold text-[10px] uppercase tracking-[4px] mb-5 font-[family-name:var(--font-inter)]">
          Plan Your Stay
        </p>

        <h2
          className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-6"
          style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
        >
          Begin Your
          <br />
          <em className="text-gold italic">NJS Royale Journey</em>
        </h2>

        <p
          className="text-white/40 leading-relaxed max-w-xl mx-auto font-[family-name:var(--font-inter)]"
          style={{ marginBottom: '3rem' }}
        >
          Our beach resort daycation &mdash; leisure park, lounge and pool &mdash; opens
          this December, Thursday to Sunday. Rooms open from July 2027. Our online enquiry
          service is coming soon; for now, we would be glad to help you plan your visit by
          phone.
        </p>

        {/* Beach Resort brand mark */}
        <div className="flex flex-col items-center gap-5 mb-12">
          <div className="bg-white p-3 shadow-md ring-1 ring-gold/10">
            <div className="relative w-[96px] h-[96px]">
              <Image
                src="/njs-logos/njs-royale-beach-resort-logo-gold.png"
                alt="NJS Royale Beach Resort"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <p className="text-white/50 text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
            Beach Resort
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            <a
              href="tel:+2347075334158"
              className="w-full sm:w-auto sm:min-w-[210px] text-center bg-gold text-navy px-6 py-[14px] text-[12px] uppercase tracking-[0.08em] font-medium hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Call to Enquire
            </a>
            <a
              href="#daycation"
              className="w-full sm:w-auto sm:min-w-[190px] text-center border border-white/70 text-white px-6 py-[14px] text-[12px] uppercase tracking-[0.08em] font-medium hover:border-gold hover:text-gold transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Plan Your Day
            </a>
          </div>
        </div>

        <p className="text-white/30 text-[11px] text-center leading-relaxed font-[family-name:var(--font-inter)] mb-12 italic">
          Rooms are not yet available to book. Room reservations open from July 2027.
        </p>

        <div className="border-t border-white/7 pt-12 grid gap-8 sm:grid-cols-2 max-w-2xl mx-auto">
          {info.map(({ Icon, label, value, href }) => (
            <div key={label} className="text-center">
              <div className="flex justify-center mb-3">
                <Icon size={18} strokeWidth={1.25} className="text-gold/60" />
              </div>
              <div className="text-white/45 text-[10px] uppercase tracking-[2px] mb-1 font-[family-name:var(--font-inter)]">
                {label}
              </div>
              <div className="text-white/55 text-sm font-[family-name:var(--font-inter)]">
                {href ? (
                  <a href={href} className="hover:text-gold transition-colors duration-300">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
