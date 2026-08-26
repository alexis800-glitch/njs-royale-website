'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

/**
 * Lazy, viewport-aware background video for content sections.
 * - preload="none": nothing downloads until the section scrolls into view
 * - autoplays muted + loops while visible, pauses when scrolled away
 * - playsInline, no controls
 * - prefers-reduced-motion → static poster image only (no video, no autoplay)
 */
// Basename of each section clip. The two hero-derived clips keep their original
// filenames; the arrival clip is its own asset, so the name is mapped rather than
// interpolated into a single hard-coded pattern.
const SOURCES = {
  daytime: 'njs-hero-daytime',
  sunset: 'njs-hero-sunset',
  arrival: 'njs-arrival-carpark',
} as const

export default function SectionVideo({
  name,
  poster,
  alt,
  frameClassName = '',
}: {
  name: keyof typeof SOURCES
  poster: string
  alt: string
  /** Optional per-section reframing (a transform), applied to both the video and
   *  the reduced-motion poster so the two stay framed identically. */
  frameClassName?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [tier, setTier] = useState<'desktop' | 'mobile'>('desktop')
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mobileMq = window.matchMedia('(max-width: 767px)')
    const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyTier = () => setTier(mobileMq.matches ? 'mobile' : 'desktop')
    applyTier()
    setReduced(reduceMq.matches)
    mobileMq.addEventListener('change', applyTier)
    return () => mobileMq.removeEventListener('change', applyTier)
  }, [])

  useEffect(() => {
    if (reduced) return
    const v = videoRef.current
    if (!v) return
    const tryPlay = () => v.play().catch(() => {/* deferred; retries on canplay/loadeddata */})
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.load()      // preload="none" → begin fetching only now
          tryPlay()
        } else {
          v.pause()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(v)
    v.addEventListener('canplay', tryPlay)
    v.addEventListener('loadeddata', tryPlay)
    return () => {
      io.disconnect()
      v.removeEventListener('canplay', tryPlay)
      v.removeEventListener('loadeddata', tryPlay)
    }
  }, [reduced, tier])

  if (reduced) {
    return (
      <Image src={poster} alt={alt} fill priority={false}
             className={`object-cover ${frameClassName}`} />
    )
  }

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      aria-label={alt}
      className={`absolute inset-0 w-full h-full object-cover ${frameClassName}`}
    >
      <source src={`/videos/${SOURCES[name]}-${tier}.mp4`} type="video/mp4" />
      <source src={`/videos/${SOURCES[name]}-desktop.mp4`} type="video/mp4" />
    </video>
  )
}
