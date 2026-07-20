'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// Cinematic hero sequence — plays in order, crossfading between clips.
// Daytime → Sunset → Night (matches the approved NJS Royale sequence).
const clips = [
  { key: 'daytime', poster: '/images/njs-hero-daytime-poster.jpg' },
  { key: 'sunset',  poster: '/images/njs-hero-sunset-poster.jpg'  },
  { key: 'night',   poster: '/images/njs-hero-night-poster.jpg'   },
] as const

// Static fallback if the hero videos cannot load at all.
const slides = [
  '/images/grand-entrance-hall-01.png',
  '/images/njs-rooftop-infinity-pool-atlantic-view.png',
  '/images/ground-floor-bar-01.png',
]

export default function Hero() {
  const [active, setActive]         = useState(0)
  const [videoError, setVideoError] = useState(false)
  const [tier, setTier]             = useState<'desktop' | 'mobile'>('desktop')
  const [reduced, setReduced]       = useState(false)
  const videoRefs                   = useRef<(HTMLVideoElement | null)[]>([])

  // Pick optimised source tier + honour reduced-motion (after mount, avoids SSR mismatch)
  useEffect(() => {
    const mobileMq  = window.matchMedia('(max-width: 767px)')
    const reduceMq  = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyTier = () => setTier(mobileMq.matches ? 'mobile' : 'desktop')
    applyTier()
    setReduced(reduceMq.matches)
    mobileMq.addEventListener('change', applyTier)
    return () => mobileMq.removeEventListener('change', applyTier)
  }, [])

  // Play the active clip from its start whenever it becomes active
  useEffect(() => {
    if (videoError || reduced) return
    const v = videoRefs.current[active]
    if (v) {
      try { v.currentTime = 0 } catch {}
      v.play().catch(() => {/* autoplay may defer; poster covers the gap */})
    }
  }, [active, tier, videoError, reduced])

  const advance = () => setActive((prev) => (prev + 1) % clips.length)

  const showVideo = !videoError && !reduced

  return (
    <section className="relative h-screen overflow-hidden">

      {/* ── Primary background: cinematic hero video sequence (crossfade) ── */}
      {showVideo && clips.map((clip, i) => (
        <video
          key={clip.key}
          ref={(el) => { videoRefs.current[i] = el }}
          autoPlay={i === 0}
          muted
          playsInline
          preload={i === 0 ? 'auto' : 'none'}
          poster={clip.poster}
          onEnded={advance}
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <source src={`/videos/njs-hero-${clip.key}-${tier}.mp4`} type="video/mp4" />
          <source src={`/videos/njs-hero-${clip.key}-desktop.mp4`} type="video/mp4" />
        </video>
      ))}

      {/* ── Reduced-motion: single static hero frame (no autoplay) ── */}
      {!videoError && reduced && (
        <Image
          src={clips[0].poster}
          alt="NJS Royale Beach Resort at dawn over the Atlantic"
          fill
          priority
          className="absolute inset-0 object-cover"
        />
      )}

      {/* ── Fallback: image slideshow (shown only if video cannot load) ── */}
      {videoError && slides.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === active % slides.length ? 1 : 0 }}
        >
          <Image
            src={src}
            alt={`NJS Royale resort view ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Advance the fallback slideshow on a timer when video is unavailable */}
      <FallbackTimer enabled={videoError} onTick={advance} />

      {/* Dark luxury overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(6,14,26,0.45) 0%, rgba(6,14,26,0.20) 45%, rgba(6,14,26,0.70) 100%)',
        }}
      />

      {/* Hero content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-gold/80 text-[9px] sm:text-[10px] uppercase tracking-[3px] sm:tracking-[6px] leading-relaxed mb-10 sm:mb-7 font-[family-name:var(--font-inter)]">
          Atlantic Oceanfront &nbsp;·&nbsp; Nigeria
        </p>

        <h1
          className="font-[family-name:var(--font-cormorant)] text-white leading-[1.3] sm:leading-tight mb-9 sm:mb-8"
          style={{ fontSize: 'clamp(30px, 7vw, 88px)' }}
        >
          A Private Oceanfront Escape,
          <br className="hidden sm:block" />
          <em className="text-gold italic block sm:inline mt-4 sm:mt-0">Crafted for Prestige</em>
        </h1>

        <p className="text-white/55 text-[15px] sm:text-lg font-light leading-[1.6] sm:leading-relaxed max-w-xs sm:max-w-2xl mb-12 font-[family-name:var(--font-inter)]">
          NJS Royale Beach Resort is envisioned as a refined coastal destination where elegant
          hospitality, ocean-facing leisure, and elevated lifestyle experiences meet the Atlantic.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:w-auto">
          <a
            href="#about"
            className="w-full sm:w-auto text-center bg-gold text-navy px-10 py-4 text-[11px] uppercase tracking-widest font-semibold hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Explore the Resort
          </a>
          <a
            href="#enquire"
            className="w-full sm:w-auto text-center border border-white/50 text-white px-10 py-4 text-[11px] uppercase tracking-widest font-semibold hover:border-gold hover:text-gold transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Register Interest
          </a>
        </div>
      </div>

      {/* One uninterrupted cinematic reel — no carousel controls. */}

      {/* Scroll indicator — hidden on small screens where it crowds the CTAs */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-2">
        <span className="text-white/40 text-[9px] uppercase tracking-[4px] font-[family-name:var(--font-inter)]">
          Discover
        </span>
        <span className="text-gold animate-bounce text-lg">↓</span>
      </div>

    </section>
  )
}

// Advances the image-slideshow fallback every 5s (only mounts logic when enabled)
function FallbackTimer({ enabled, onTick }: { enabled: boolean; onTick: () => void }) {
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(onTick, 5000)
    return () => clearInterval(id)
  }, [enabled, onTick])
  return null
}
