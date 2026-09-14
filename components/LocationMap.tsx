'use client'

import { useEffect, useRef, useState } from 'react'
import { Map as MapIcon, MapPin, Navigation, X } from 'lucide-react'
import {
  DIRECTIONS_URL,
  MAP_EMBED_URL,
  RESORT_ADDRESS_LINES,
  RESORT_COORDINATES,
  RESORT_NAME,
} from '@/lib/location'

// Click-to-load map. Nothing from Google is requested until the visitor chooses
// "View Interactive Map", so a page view alone never contacts Google. The panel keeps
// side gutters and a bounded height on phones, so a finger on either side of the map
// (or above and below it) still scrolls the page normally.
export default function LocationMap() {
  const [active, setActive] = useState(false)
  const toggled = useRef(false)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const { latitude, longitude } = RESORT_COORDINATES

  // Move focus with the swap, but never on first render.
  useEffect(() => {
    if (!toggled.current) return
    if (active) frameRef.current?.focus()
    else openRef.current?.focus()
  }, [active])

  const setMap = (next: boolean) => {
    toggled.current = true
    setActive(next)
  }

  return (
    <section id="location" aria-labelledby="location-heading" className="bg-[#F5F0E8] py-24 md:py-32 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center">

        {/* Address and directions */}
        <div>
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Location
          </p>
          <h2
            id="location-heading"
            className="font-[family-name:var(--font-cormorant)] text-navy leading-tight mb-7"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Find Us on the
            <br />
            <em className="text-gold italic">Atlantic Coast</em>
          </h2>

          <address className="not-italic flex gap-4">
            <MapPin size={20} strokeWidth={1.3} className="text-gold mt-1 flex-shrink-0" aria-hidden="true" />
            <span className="font-[family-name:var(--font-inter)] text-navy/65 text-[15px] leading-relaxed">
              <span className="block font-[family-name:var(--font-cormorant)] text-navy text-2xl leading-snug mb-1">
                {RESORT_NAME}
              </span>
              {RESORT_ADDRESS_LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
          </address>

          <p className="mt-5 pl-9 text-navy/50 text-[12px] tracking-wide font-[family-name:var(--font-inter)]">
            <span className="uppercase tracking-[2px] text-[10px] text-navy/40 mr-2">Coordinates</span>
            {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E
          </p>

          <div className="mt-8 pl-9">
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 min-h-[48px] bg-navy text-[#f6f2e9] px-7 text-[12px] uppercase tracking-[0.08em] font-medium hover:bg-gold hover:text-navy transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              <Navigation size={14} strokeWidth={1.6} aria-hidden="true" />
              Get Directions
              <span className="sr-only">(opens Google Maps in a new tab)</span>
            </a>
          </div>
        </div>

        {/* Map panel */}
        <div className="min-w-0">
          <div
            id="location-map-panel"
            className="relative w-full h-[320px] sm:h-[400px] lg:h-[460px] overflow-hidden border border-gold/30 bg-[#0A1628]"
          >
            {active ? (
              <iframe
                ref={frameRef}
                src={MAP_EMBED_URL}
                title={`Interactive Google Map of ${RESORT_NAME}, pinned at ${latitude}, ${longitude}, Mosere-Kogo Village, Ibeju-Lekki, Lagos`}
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 42%, rgba(201,168,76,0.14) 0%, rgba(10,22,40,0) 62%), #0A1628',
                }}
              >
                <MapPin size={34} strokeWidth={1.2} className="text-gold" aria-hidden="true" />
                <p className="mt-4 font-[family-name:var(--font-cormorant)] text-white text-2xl leading-snug">
                  {RESORT_NAME}
                </p>
                <p className="mt-1.5 text-white/55 text-[13px] leading-relaxed font-[family-name:var(--font-inter)]">
                  {RESORT_ADDRESS_LINES.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                <p className="mt-3 text-gold/80 text-[11px] tracking-[1.5px] font-[family-name:var(--font-inter)]">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
                <button
                  ref={openRef}
                  type="button"
                  onClick={() => setMap(true)}
                  aria-controls="location-map-panel"
                  className="mt-7 inline-flex items-center justify-center gap-2.5 min-h-[48px] bg-gold text-navy px-7 text-[12px] uppercase tracking-[0.08em] font-medium hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
                >
                  <MapIcon size={14} strokeWidth={1.6} aria-hidden="true" />
                  View Interactive Map
                </button>
                <p className="mt-4 max-w-[17rem] text-white/45 text-[11px] leading-relaxed font-[family-name:var(--font-inter)]">
                  Opening the interactive map connects to Google Maps.
                </p>
              </div>
            )}
          </div>

          {active && (
            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setMap(false)}
                aria-controls="location-map-panel"
                className="inline-flex items-center gap-2 min-h-[44px] px-2 text-navy/60 hover:text-gold text-[11px] uppercase tracking-[2px] transition-colors duration-300 font-[family-name:var(--font-inter)]"
              >
                <X size={14} strokeWidth={1.6} aria-hidden="true" />
                Hide Map
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
