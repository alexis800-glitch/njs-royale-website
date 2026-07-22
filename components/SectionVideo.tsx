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
export default function SectionVideo({
  name,
  poster,
  alt,
}: {
  name: 'daytime' | 'sunset'
  poster: string
  alt: string
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
    return <Image src={poster} alt={alt} fill priority={false} className="object-cover" />
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
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src={`/videos/njs-hero-${name}-${tier}.mp4`} type="video/mp4" />
      <source src={`/videos/njs-hero-${name}-desktop.mp4`} type="video/mp4" />
    </video>
  )
}
