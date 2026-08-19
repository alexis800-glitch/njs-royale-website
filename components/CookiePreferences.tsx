'use client'

import { useState, useEffect } from 'react'

// Cookie information panel.
//
// NJS Royale currently runs no analytics, advertising or tracking on this website, so
// there is no optional consent to give and nothing to store. Rather than show a
// functional-looking toggle that is wired to nothing, this panel simply explains the
// two categories. If optional analytics/advertising are introduced later, this component
// will be extended into a real consent manager before any such scripts are activated.
export default function CookiePreferences({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

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

          <div className="relative w-full max-w-md bg-[#0A1628] border border-gold/25 shadow-2xl">
            <div className="px-6 sm:px-8 pt-7 pb-6">
              <p className="text-gold text-[10px] uppercase tracking-[4px] mb-3 font-[family-name:var(--font-inter)]">
                Privacy
              </p>
              <h2 className="font-[family-name:var(--font-cormorant)] text-white text-2xl mb-4">
                Cookie Preferences
              </h2>

              {/* Essential website functionality */}
              <div className="mt-2 border-t border-white/10 pt-5">
                <p className="text-white/90 text-[13.5px] font-medium font-[family-name:var(--font-inter)]">
                  Essential website functionality
                </p>
                <p className="text-white/55 text-[12.5px] leading-relaxed mt-1.5 font-[family-name:var(--font-inter)]">
                  Required for the website to operate and cannot be disabled.
                </p>
              </div>

              {/* Analytics and advertising */}
              <div className="mt-4 border-t border-white/10 pt-5">
                <p className="text-white/90 text-[13.5px] font-medium font-[family-name:var(--font-inter)]">
                  Analytics and advertising
                </p>
                <p className="text-white/55 text-[12.5px] leading-relaxed mt-1.5 font-[family-name:var(--font-inter)]">
                  NJS Royale does not currently use optional analytics or advertising cookies on this
                  website.
                </p>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 border-t border-white/10 flex items-center justify-end">
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
