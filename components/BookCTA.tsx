'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { MapPin, Phone, Mail } from 'lucide-react'

const info = [
  { Icon: MapPin, label: 'Location',  value: 'Richland Garden Estate, Ibeju-Lekki, Lagos' },
  { Icon: Phone,  label: 'Telephone', value: '07075334158' },
  { Icon: Mail,   label: 'Enquiries', value: 'info@njsroyale.com.ng' },
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
          Register Your Interest
        </p>

        <h2
          className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-6"
          style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
        >
          Begin Your
          <br />
          <em className="text-gold italic">NJS Royale Journey</em>
        </h2>

        <p className="text-white/40 leading-relaxed max-w-xl mx-auto font-[family-name:var(--font-inter)]" style={{ marginBottom: '3rem' }}>
          Whether you are seeking a luxury coastal retreat at our Beach Resort or coordinating your next signature event at our Event &amp; Conference Center, NJS Royale is preparing to welcome you. Register your interest for priority updates and early reservation access.
        </p>

        {/* Dual brand columns — logo + label + button, each brand self-contained */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-gold/20 gap-10 md:gap-0 mb-16">

          {/* Beach Resort */}
          <div className="flex flex-col items-center gap-5 md:px-10">
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
            <a
              href="#"
              className="w-full max-w-[320px] text-center bg-gold text-navy px-6 py-4 text-[11px] uppercase tracking-widest font-semibold hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Register Interest
            </a>
          </div>

          {/* Event & Conference Center */}
          <div className="flex flex-col items-center gap-5 md:px-10">
            <div className="bg-white p-3 shadow-md ring-1 ring-gold/10">
              <div className="relative w-[96px] h-[96px]">
                <Image
                  src="/njs-logos/njs-royale-event-conference-center-logo-gold.png"
                  alt="NJS Royale Event & Conference Center"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-white/50 text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
              Event &amp; Conference Center
            </p>
            <a
              href="#"
              className="w-full max-w-[320px] text-center border border-white text-white px-6 py-4 text-[11px] uppercase tracking-widest font-semibold hover:border-gold hover:text-gold transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Plan an Event
            </a>
          </div>

        </div>

        <p className="text-white/30 text-[11px] text-center leading-relaxed font-[family-name:var(--font-inter)] mb-12 italic">
          Full reservation processing and online payment will be activated in Phase Two —
          our reservations team is available now to assist with priority bookings.
        </p>

        <div className="border-t border-white/7 pt-12 grid md:grid-cols-3 gap-8">
          {info.map(({ Icon, label, value }) => (
            <div key={label} className="text-center">
              <div className="flex justify-center mb-3">
                <Icon size={18} strokeWidth={1.25} className="text-gold/60" />
              </div>
              <div className="text-white/45 text-[10px] uppercase tracking-[2px] mb-1 font-[family-name:var(--font-inter)]">
                {label}
              </div>
              <div className="text-white/55 text-sm font-[family-name:var(--font-inter)]">
                {value}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
