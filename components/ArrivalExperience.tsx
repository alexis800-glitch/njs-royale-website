'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionVideo from './SectionVideo'

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut', delay } },
})

export default function ArrivalExperience() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' })

  const [filmOpen, setFilmOpen] = useState(false)
  const filmRef = useRef<HTMLVideoElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const closeFilm = useCallback(() => {
    const v = filmRef.current
    if (v) {
      v.pause()
      v.currentTime = 0
    }
    setFilmOpen(false)
  }, [])

  // While the film is open: lock the page behind it, close on Escape, and put
  // focus on the close control so the dialog is reachable from the keyboard.
  useEffect(() => {
    if (!filmOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFilm()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    // The film carries sound, so it only ever starts from this explicit click.
    filmRef.current?.play().catch(() => {/* the native controls remain available */})
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [filmOpen, closeFilm])

  return (
    <section ref={ref} id="arrival" className="relative bg-[#060E1A] overflow-hidden">

      {/* Approved car-park / gated-entrance visualisation, silent and looping */}
      <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">

        <SectionVideo
          name="arrival"
          poster="/images/njs-arrival-carpark-poster.jpg"
          alt="NJS Royale Beach Resort gated entrance, perimeter fence and guest car park from the coastal road"
        />

        {/* Dark overlay — heavier at top and bottom, clear through the middle so the
            bays, gatehouse and fence line stay readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(6,14,26,0.62) 0%, rgba(6,14,26,0.22) 42%, rgba(6,14,26,0.55) 74%, rgba(6,14,26,0.92) 100%)',
          }}
        />

        {/* Centred text block */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">

          <motion.p
            variants={fadeUp(0)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="text-gold/70 text-[9px] uppercase tracking-[5px] mb-5 font-[family-name:var(--font-inter)]"
          >
            Arrival Experience
          </motion.p>

          <motion.h2
            variants={fadeUp(0.12)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight drop-shadow-lg mb-6"
            style={{ fontSize: 'clamp(32px, 5vw, 68px)' }}
          >
            A Refined
            <br />
            <em className="text-gold italic">Arrival Experience</em>
          </motion.h2>

          <motion.p
            variants={fadeUp(0.22)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="text-white/60 text-sm sm:text-base leading-relaxed max-w-xl font-[family-name:var(--font-inter)]"
          >
            Guests arrive from the coastal road through a gated entrance set behind a
            landscaped setback, into generous on-site parking screened by a travertine
            and bronze perimeter fence — the resort revealed only once you are inside it.
          </motion.p>

          <motion.div
            variants={fadeUp(0.34)}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="mt-9"
          >
            <button
              type="button"
              onClick={() => setFilmOpen(true)}
              className="group inline-flex items-center gap-3 border border-gold/55 text-gold bg-navy/30 backdrop-blur-sm px-7 py-3.5 text-[10px] uppercase tracking-[3px] font-medium hover:bg-gold hover:text-navy transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              <span className="text-[11px] leading-none">▶</span>
              Watch the Full Film
            </button>
          </motion.div>

        </div>

        {/* Bottom footnote — anchored to video bottom edge */}
        <motion.p
          variants={fadeUp(0.44)}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="absolute bottom-6 left-0 right-0 text-center text-white/25 text-[10px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]"
        >
          Architectural visualisation for presentation purposes
        </motion.p>

      </div>

      {/* Thin gold rule separator */}
      <div className="w-full flex justify-center py-0">
        <div className="h-px w-32 bg-gold/20" />
      </div>

      {/* Full film — opens only on click, never autoplays with sound */}
      {filmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="NJS Royale Beach Resort film"
          onClick={closeFilm}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#060E1A]/95 backdrop-blur-sm px-4 sm:px-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl"
          >
            <video
              ref={filmRef}
              controls
              playsInline
              preload="metadata"
              poster="/images/njs-arrival-carpark-poster.jpg"
              className="w-full h-auto max-h-[80vh] bg-black shadow-2xl"
            >
              <source src="/videos/njs-resort-film.mp4" type="video/mp4" />
            </video>

            <button
              ref={closeRef}
              type="button"
              onClick={closeFilm}
              aria-label="Close film"
              className="absolute -top-11 right-0 flex items-center gap-2 text-gold/80 hover:text-gold text-[10px] uppercase tracking-[3px] font-[family-name:var(--font-inter)] transition-colors duration-300"
            >
              Close <span className="text-sm leading-none">✕</span>
            </button>
          </div>
        </div>
      )}

    </section>
  )
}
