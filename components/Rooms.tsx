'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import RoomPlaceholder from '@/components/RoomPlaceholder'
import {
  accommodation,
  formatNaira,
  hasSpecs,
  RESORT_KEYS,
  type AccommodationCategory,
} from '@/lib/accommodation'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const tierLabel: Record<AccommodationCategory['tier'], string | null> = {
  room: null,
  'multi-bedroom': 'Multi-Bedroom',
  suite: 'Suite Residence',
  signature: 'Signature Residence',
}

// Present only the specifications that have been supplied; otherwise a single,
// intentional "coming soon" line. Never render empty "Room size: —" rows.
function Specs({ a }: { a: AccommodationCategory }) {
  const rows: { label: string; value: string }[] = []
  if (a.roomSize) rows.push({ label: 'Room size', value: a.roomSize })
  if (a.bedrooms) rows.push({ label: 'Bedrooms', value: String(a.bedrooms) })
  if (a.bedType) rows.push({ label: 'Bed', value: a.bedType })
  if (a.occupancy) rows.push({ label: 'Sleeps', value: a.occupancy })
  if (a.bathroomType) rows.push({ label: 'Bathroom', value: a.bathroomType })
  if (a.bathroomSize) rows.push({ label: 'Bathroom size', value: a.bathroomSize })
  if (a.balconyOrTerrace) rows.push({ label: 'Outdoor', value: a.balconyOrTerrace })
  if (a.livingArea) rows.push({ label: 'Living area', value: a.livingArea })
  if (a.diningArea) rows.push({ label: 'Dining', value: a.diningArea })
  if (a.kitchenOrKitchenette) rows.push({ label: 'Kitchen', value: a.kitchenOrKitchenette })
  if (a.guestWC) rows.push({ label: 'Guest WC', value: a.guestWC })

  if (!hasSpecs(a)) {
    return (
      <p className="text-white/40 text-[11px] italic font-[family-name:var(--font-inter)] pt-2 border-t border-gold/10">
        Full specifications coming soon
      </p>
    )
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-3 border-t border-gold/10 text-[11px] font-[family-name:var(--font-inter)]">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col">
          <dt className="text-white/35 uppercase tracking-[1.5px] text-[9px]">{r.label}</dt>
          <dd className="text-white/70">{r.value}</dd>
        </div>
      ))}
      {a.specialFeatures.length > 0 && (
        <div className="col-span-2 flex flex-col">
          <dt className="text-white/35 uppercase tracking-[1.5px] text-[9px]">Signature features</dt>
          <dd className="text-white/70">{a.specialFeatures.join(' · ')}</dd>
        </div>
      )}
      {a.includedBenefits.length > 0 && (
        <div className="col-span-2 flex flex-col">
          <dt className="text-white/35 uppercase tracking-[1.5px] text-[9px]">Included</dt>
          <dd className="text-white/70">{a.includedBenefits.join(' · ')}</dd>
        </div>
      )}
    </dl>
  )
}

export default function Rooms() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="rooms" className="bg-[#0A1628] pt-16 pb-32 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Accommodation
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight mb-5"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Rooms &amp; Suites
          </h2>
          <p className="text-white/55 text-base leading-relaxed font-[family-name:var(--font-inter)]">
            {RESORT_KEYS} keys across eleven accommodation categories, from Royale Rooms
            to the Presidential Suite. Accommodation opens progressively from February
            2027, with the complete resort at Grand Opening in July 2027. Rates shown are
            opening rates, per night.
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7"
        >
          {accommodation.map((a) => {
            const signature = a.tier === 'signature'
            return (
              <motion.div
                key={a.id}
                variants={cardVariants}
                className={`group flex flex-col border transition-colors duration-500 ${
                  signature ? 'border-gold/30 hover:border-gold/50' : 'border-gold/10 hover:border-gold/30'
                }`}
              >
                {/* Image or branded placeholder */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {a.mainImage ? (
                    <Image
                      src={a.mainImage}
                      alt={a.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                    />
                  ) : (
                    <RoomPlaceholder label={a.name} />
                  )}
                  <div className="absolute top-4 left-4 bg-[#0A1628]/80 backdrop-blur-sm px-3 py-1">
                    <span className="text-gold text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
                      {a.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6 gap-3">
                  <div>
                    <h3 className="font-[family-name:var(--font-cormorant)] text-white text-2xl leading-tight">
                      {a.name}
                    </h3>
                    <p className="mt-1 text-[11px] uppercase tracking-[2px] text-gold/80 font-[family-name:var(--font-inter)]">
                      {a.view ?? tierLabel[a.tier] ?? ' '}
                    </p>
                  </div>

                  {/* Opening rate */}
                  <div className="pt-1">
                    <div className="text-white/40 text-[9px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
                      Opening Rate · Per Night
                    </div>
                    <div className="font-[family-name:var(--font-cormorant)] text-gold text-3xl leading-none mt-1">
                      {formatNaira(a.openingRate)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <Specs a={a} />
                  </div>

                  {/* CTA */}
                  <a
                    href="#enquire"
                    className="mt-1 flex items-center justify-between text-gold text-[11px] uppercase tracking-[2px] hover:text-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
                  >
                    Enquire
                    <ArrowRight size={13} strokeWidth={1.5} />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="text-center mt-12 max-w-xl mx-auto">
          <p className="text-white/35 text-[11px] leading-relaxed font-[family-name:var(--font-inter)]">
            Room dimensions, layouts and official photography will be published for each
            category as they are finalised. Our team is glad to share further detail on
            enquiry.
          </p>
        </div>
      </div>
    </section>
  )
}
