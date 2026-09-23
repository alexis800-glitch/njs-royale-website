'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useConsent } from '@/components/consent/ConsentProvider'
import { META_PIXEL_ID, isTrackableRoute } from '@/lib/meta/config'

// Meta Pixel loader.
//
// Nothing here runs — and no Meta script, request or cookie exists — until the
// visitor grants marketing consent. PageView fires once when consent is granted
// and again on each client-side route change, but only on trackable routes:
// print/proof artwork, internal drafts and `?final=1` are excluded.

function loadPixel(pixelId: string) {
  if (window.fbq) return

  /* eslint-disable */
  // Meta's standard loader, kept close to the published snippet.
  const n: any = (window.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
  })
  if (!window._fbq) window._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
  /* eslint-enable */

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  // Initialise without automatic PageView: this component decides when a route
  // is trackable, and Meta's automatic first PageView cannot be route-filtered.
  window.fbq?.('init', pixelId)
}

function MetaPixelInner() {
  const { marketing } = useConsent()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const loadedRef = useRef(false)
  const lastTrackedRef = useRef<string | null>(null)

  useEffect(() => {
    if (marketing !== 'granted') return
    if (!META_PIXEL_ID) return

    const search = searchParams?.toString() ?? ''
    if (!isTrackableRoute(pathname ?? '', search)) return

    if (!loadedRef.current) {
      loadPixel(META_PIXEL_ID)
      loadedRef.current = true
    }

    // One PageView per distinct route, so a re-render never double-counts.
    const key = `${pathname}?${search}`
    if (lastTrackedRef.current === key) return
    lastTrackedRef.current = key

    window.fbq?.('track', 'PageView')
  }, [marketing, pathname, searchParams])

  // Consent withdrawn after the script loaded: stop future events. The script
  // itself cannot be unloaded, so revoke and forget the last tracked route.
  useEffect(() => {
    if (marketing === 'granted' || !loadedRef.current) return
    lastTrackedRef.current = null
    try {
      window.fbq?.('consent', 'revoke')
    } catch {
      // Pixel not present: nothing to revoke.
    }
  }, [marketing])

  return null
}

export default function MetaPixel() {
  // useSearchParams needs a Suspense boundary so the static pages around it are
  // not forced into client-side rendering.
  return (
    <Suspense fallback={null}>
      <MetaPixelInner />
    </Suspense>
  )
}
