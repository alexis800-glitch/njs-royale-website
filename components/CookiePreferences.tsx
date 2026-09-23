'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useConsent } from './consent/ConsentProvider'
import { META_PIXEL_ID } from '@/lib/meta/config'

// Cookie preference manager.
//
// Marketing (Meta Pixel) consent can be given, changed or withdrawn here at any
// time. Withdrawing stops further tracking and deletes the Meta cookies this
// browser can see. Essential cookies are described but cannot be switched off,
// because the site cannot work without them.

function Row({
  title,
  children,
  control,
}: {
  title: string
  children: React.ReactNode
  control?: React.ReactNode
}) {
  return (
    <div className="mt-4 border-t border-white/10 pt-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-white/90 text-[13.5px] font-medium font-[family-name:var(--font-inter)]">{title}</p>
        {control}
      </div>
      <div className="text-white/55 text-[12.5px] leading-relaxed mt-1.5 font-[family-name:var(--font-inter)]">
        {children}
      </div>
    </div>
  )
}

export default function CookiePreferences({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const { marketing, ready, grantMarketing, withdrawMarketing } = useConsent()

  // Lock scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const granted = marketing === 'granted'
  const statusLabel = !ready ? '—' : granted ? 'Allowed' : marketing === 'denied' ? 'Not allowed' : 'Not set'

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Cookie Preferences
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie Preferences"
          className="fixed inset-0 z-[120] flex items-center justify-center p-5"
        >
          <div className="absolute inset-0 bg-[#060E1A]/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-md max-h-[86vh] overflow-y-auto bg-[#0A1628] border border-gold/25 shadow-2xl">
            <div className="px-6 sm:px-8 pt-7 pb-6">
              <p className="text-gold text-[10px] uppercase tracking-[4px] mb-3 font-[family-name:var(--font-inter)]">
                Privacy
              </p>
              <h2 className="font-[family-name:var(--font-cormorant)] text-white text-2xl mb-4">
                Cookie Preferences
              </h2>

              {/* Essential — always on */}
              <div className="mt-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-white/90 text-[13.5px] font-medium font-[family-name:var(--font-inter)]">
                    Essential website functionality
                  </p>
                  <span className="flex-shrink-0 text-white/45 text-[11px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]">
                    Always on
                  </span>
                </div>
                <p className="text-white/55 text-[12.5px] leading-relaxed mt-1.5 font-[family-name:var(--font-inter)]">
                  Required for the website to operate and cannot be disabled. These set no marketing cookies.
                </p>
              </div>

              {/* Marketing — the real choice */}
              {META_PIXEL_ID ? (
                <Row
                  title="Marketing (Meta Pixel)"
                  control={
                    <span
                      className={`flex-shrink-0 text-[11px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)] ${granted ? 'text-gold' : 'text-white/45'}`}
                    >
                      {statusLabel}
                    </span>
                  }
                >
                  <p>
                    Lets us measure how our adverts on Facebook and Instagram perform. If you allow it, Meta
                    sets the cookies <span className="text-white/75">_fbp</span> and{' '}
                    <span className="text-white/75">_fbc</span> and receives your IP address, browser details
                    and the page address. Nothing loads until you allow it.
                  </p>
                  <div className="mt-3.5 flex gap-3">
                    <button
                      type="button"
                      onClick={withdrawMarketing}
                      disabled={!ready || marketing === 'denied'}
                      className="min-h-[42px] flex-1 border border-gold px-4 text-[11px] uppercase tracking-[0.1em] font-semibold text-gold transition-colors duration-300 hover:bg-gold hover:text-navy disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
                    >
                      {marketing === 'denied' ? 'Not allowed' : 'Withdraw'}
                    </button>
                    <button
                      type="button"
                      onClick={grantMarketing}
                      disabled={!ready || granted}
                      className="min-h-[42px] flex-1 border border-gold bg-gold px-4 text-[11px] uppercase tracking-[0.1em] font-semibold text-navy transition-colors duration-300 hover:bg-[#d8bb66] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
                    >
                      {granted ? 'Allowed' : 'Allow'}
                    </button>
                  </div>
                  <p className="mt-3 text-white/45 text-[11.5px] leading-relaxed font-[family-name:var(--font-inter)]">
                    Withdrawing stops further tracking and deletes these cookies from this browser. Data Meta
                    already received is covered in our{' '}
                    <Link href="/privacy" className="text-gold underline underline-offset-2 hover:text-white">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </Row>
              ) : (
                <Row title="Analytics and advertising">
                  <p>
                    NJS Royale does not currently use optional analytics or advertising cookies on this
                    website.
                  </p>
                </Row>
              )}

              {/* Click-to-load map */}
              <Row title="Google Maps (only if you open it)">
                <p>
                  The location map loads only after you choose &ldquo;View Interactive Map&rdquo;. Google may
                  then receive technical information such as your IP address and device details, and may set
                  its own cookies.
                </p>
              </Row>
            </div>

            <div className="sticky bottom-0 bg-[#0A1628] px-6 sm:px-8 py-4 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-[#c9a84c] hover:bg-[#bd9f45] text-navy text-[11px] uppercase tracking-[0.1em] font-medium transition-colors duration-300 font-[family-name:var(--font-inter)] min-h-[42px] px-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
