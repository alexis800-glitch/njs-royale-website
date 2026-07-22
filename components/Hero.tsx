'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// Homepage hero — the approved Night Atlantic Approach (v2) as the sole hero video.
// Autoplays muted + loops when motion is allowed. Under prefers-reduced-motion (or if
// autoplay is blocked) the poster shows with a visible "Play video" control, so the hero
// is never permanently frozen while still respecting accessibility.
export default function Hero() {
  const videoRef                    = useRef<HTMLVideoElement>(null)
  const [tier, setTier]             = useState<'desktop' | 'mobile'>('desktop')
  const [reduced, setReduced]       = useState(false)
  const [failed, setFailed]         = useState(false)
  const [blocked, setBlocked]       = useState(false) // autoplay rejected (needs a gesture)
  const [userPlaying, setUserPlaying] = useState(false) // user opted in via the control

  // Source tier + reduced-motion (after mount, avoids SSR mismatch); react to changes
  useEffect(() => {
    const mobileMq = window.matchMedia('(max-width: 767px)')
    const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyTier = () => setTier(mobileMq.matches ? 'mobile' : 'desktop')
    const applyRM   = () => setReduced(reduceMq.matches)
    applyTier()
    applyRM()
    mobileMq.addEventListener('change', applyTier)
    reduceMq.addEventListener('change', applyRM)
    return () => {
      mobileMq.removeEventListener('change', applyTier)
      reduceMq.removeEventListener('change', applyRM)
    }
  }, [])

  // Play when motion is allowed; under reduced-motion wait for the user to opt in.
  useEffect(() => {
    if (failed) return
    const v = videoRef.current
    if (!v) return
    // Check the LIVE preference at call time (not the React state) to avoid a
    // first-render race where stale state could let playback start under reduced-motion.
    const suppressed = () =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches && !userPlaying
    if (suppressed()) {
      v.pause() // respect reduced-motion: hold on the poster until the user hits Play
      return
    }
    let tries = 0
    const tryPlay = () => {
      if (suppressed()) { v.pause(); return }
      v.play().then(() => setBlocked(false)).catch(() => {
        if (tries++ < 6) setTimeout(tryPlay, 400)
        else setBlocked(true) // surface a Play control if the browser refuses autoplay
      })
    }
    v.addEventListener('canplay', tryPlay)
    v.addEventListener('loadeddata', tryPlay)
    tryPlay()
    return () => {
      v.removeEventListener('canplay', tryPlay)
      v.removeEventListener('loadeddata', tryPlay)
    }
  }, [reduced, userPlaying, failed, tier])

  const showVideo      = !failed
  const showPlayButton = showVideo && !userPlaying && (reduced || blocked)

  const handlePlay = () => {
    setUserPlaying(true)
    videoRef.current?.play().catch(() => {/* ignore; effect will retry */})
  }

  return (
    <section className="relative h-screen overflow-hidden">

      {/* ── Primary background: Night Atlantic Approach hero video ── */}
      {showVideo ? (
        <video
          ref={videoRef}
          // No `autoPlay` attribute: playback is started by the effect below, which
          // respects reduced-motion. This avoids a first-render race where autoPlay
          // would fire before `reduced` is known.
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/njs-hero-night-poster.jpg"
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={`/videos/njs-hero-night-${tier}.mp4`} type="video/mp4" />
          <source src="/videos/njs-hero-night-desktop.mp4" type="video/mp4" />
        </video>
      ) : (
        /* ── Hard fallback: night poster only (video failed to load) ── */
        <Image
          src="/images/njs-hero-night-poster.jpg"
          alt="NJS Royale Beach Resort illuminated over the Atlantic at night"
          fill
          priority
          className="absolute inset-0 object-cover"
        />
      )}

      {/* Dark gradient — stronger toward the top where the centred copy sits, then clears
          through the middle so the illuminated pool, 12m bar and central façade stay visible */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(6,14,26,0.60) 0%, rgba(6,14,26,0.34) 30%, rgba(6,14,26,0.10) 52%, rgba(6,14,26,0) 70%, rgba(6,14,26,0.18) 100%)',
        }}
      />

      {/* Hero content — restrained centred composition, lifted slightly so the pool / bar / façade stay visible */}
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-6">
        <div
          className="w-full max-w-[1000px] flex flex-col items-center -translate-y-[4vh] sm:-translate-y-[7vh]"
          style={{ textShadow: '0 1px 3px rgba(6,14,26,0.72), 0 2px 28px rgba(6,14,26,0.72)' }}
        >
          <p className="text-gold/85 text-[9px] sm:text-[10px] uppercase tracking-[3px] sm:tracking-[6px] leading-relaxed mb-6 font-[family-name:var(--font-inter)]">
            Atlantic Oceanfront &nbsp;·&nbsp; Nigeria
          </p>

          <h1 className="font-[family-name:var(--font-cormorant)] text-white mb-6 sm:mb-7 text-balance">
            <span className="block leading-[1.1] text-[clamp(2.15rem,6.4vw,2.75rem)] sm:text-[clamp(3rem,4.3vw,3.9rem)]">
              A Private Oceanfront Escape,
            </span>
            <em className="block italic text-gold leading-[1.15] mt-2 text-[clamp(1.65rem,5vw,2.1rem)] sm:text-[clamp(2.1rem,3vw,2.7rem)]">
              Crafted for Prestige
            </em>
          </h1>

          <p className="text-white/60 font-light leading-[1.6] sm:leading-relaxed max-w-xs sm:max-w-[660px] mb-9 font-[family-name:var(--font-inter)] text-[15px] sm:text-[clamp(1rem,1.2vw,1.2rem)]">
            NJS Royale Beach Resort is envisioned as a refined coastal destination where elegant
            hospitality, ocean-facing leisure, and elevated lifestyle experiences meet the Atlantic.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:w-auto">
            <a
              href="#about"
              className="inline-flex items-center justify-center w-full sm:w-auto sm:min-w-[210px] min-h-[50px] text-center bg-[#c9a84c] text-navy px-[30px] py-[15px] text-[12px] uppercase tracking-[0.1em] font-medium [text-shadow:none] hover:bg-[#bd9f45] transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Explore the Resort
            </a>
            <a
              href="#enquire"
              className="w-full sm:w-auto sm:min-w-[190px] text-center bg-transparent border border-[#f6f2e9]/55 text-[#f6f2e9] px-[28px] py-[15px] text-[12px] uppercase tracking-[0.08em] font-medium hover:bg-white/10 transition-colors duration-300 font-[family-name:var(--font-inter)]"
            >
              Reserve Now
            </a>
          </div>
        </div>
      </div>

      {/* Play-video control — appears only when autoplay is suppressed (reduced-motion / blocked) */}
      {showPlayButton && (
        <button
          onClick={handlePlay}
          aria-label="Play hero video"
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 border border-gold/60 text-gold bg-navy/40 backdrop-blur-sm px-5 py-2.5 text-[10px] uppercase tracking-[3px] font-semibold hover:bg-gold hover:text-navy transition-colors duration-300 font-[family-name:var(--font-inter)]"
        >
          <span className="text-xs">▶</span> Play video
        </button>
      )}

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
