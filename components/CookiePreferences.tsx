'use client'

import { useState, useEffect } from 'react'

// Honest, functional cookie-preferences control.
//
// This site currently sets no analytics, advertising or tracking cookies (see the
// Privacy Policy). There is therefore nothing to disable today. Rather than present a
// fake consent manager, this dialog states the real position and lets a guest record a
// forward-looking choice for optional analytics — which will apply only if such cookies
// are ever introduced. The preference is stored locally in the browser.
const STORAGE_KEY = 'njs-cookie-preferences'

export default function CookiePreferences({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load any saved preference when the dialog opens.
  useEffect(() => {
    if (!open) return
    setSaved(false)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setAnalytics(Boolean(JSON.parse(raw).analytics))
    } catch {
      /* ignore unavailable storage */
    }
  }, [open])

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

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics, updatedAt: new Date().toISOString() }))
    } catch {
      /* ignore unavailable storage */
    }
    setSaved(true)
    setTimeout(() => setOpen(false), 850)
  }

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
              <p className="text-white/60 text-[13.5px] leading-relaxed font-[family-name:var(--font-inter)]">
                This website currently uses only cookies that are strictly necessary for it to work. We do
                not use analytics, advertising or tracking cookies. If that changes, we will ask for your
                consent, and the choice below will apply.
              </p>

              {/* Strictly necessary — always on */}
              <div className="mt-6 border-t border-white/10 pt-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/90 text-[13.5px] font-medium font-[family-name:var(--font-inter)]">
                    Strictly necessary
                  </p>
                  <p className="text-white/45 text-[12px] leading-relaxed mt-1 font-[family-name:var(--font-inter)]">
                    Required for the website to function. These cannot be switched off.
                  </p>
                </div>
                <span className="shrink-0 text-gold/80 text-[10px] uppercase tracking-[2px] mt-1 font-[family-name:var(--font-inter)]">
                  Always on
                </span>
              </div>

              {/* Optional analytics — forward-looking toggle */}
              <div className="mt-4 border-t border-white/10 pt-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/90 text-[13.5px] font-medium font-[family-name:var(--font-inter)]">
                    Analytics
                  </p>
                  <p className="text-white/45 text-[12px] leading-relaxed mt-1 font-[family-name:var(--font-inter)]">
                    Not currently in use. Your choice will apply only if optional analytics are introduced in
                    future.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analytics}
                  aria-label="Allow analytics cookies"
                  onClick={() => setAnalytics((v) => !v)}
                  className={`shrink-0 mt-1 relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    analytics ? 'bg-gold' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#0A1628] transition-transform duration-300 ${
                      analytics ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/55 hover:text-white text-[11px] uppercase tracking-[0.15em] transition-colors duration-300 font-[family-name:var(--font-inter)] py-2 px-3"
              >
                Close
              </button>
              <button
                type="button"
                onClick={save}
                className="bg-[#c9a84c] hover:bg-[#bd9f45] text-navy text-[11px] uppercase tracking-[0.1em] font-medium transition-colors duration-300 font-[family-name:var(--font-inter)] min-h-[42px] px-6"
              >
                {saved ? 'Saved' : 'Save preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
