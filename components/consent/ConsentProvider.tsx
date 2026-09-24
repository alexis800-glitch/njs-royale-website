'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION, META_COOKIES } from '@/lib/meta/config'

// Marketing consent for the Meta Pixel (and, later, the Conversions API).
//
// 'unknown'  — not yet asked, or the stored record is from an older version
// 'granted'  — the visitor actively accepted
// 'denied'   — the visitor actively declined; no Meta code loads, no Meta cookies
export type ConsentState = 'unknown' | 'granted' | 'denied'

export type StoredConsent = { version: number; marketing: boolean; decidedAt: string }

type ConsentContextValue = {
  /** Current choice. 'unknown' until the visitor decides (or while hydrating). */
  marketing: ConsentState
  /** False until the stored record has been read, so nothing renders server/client mismatched. */
  ready: boolean
  grantMarketing: () => void
  denyMarketing: () => void
  /** Withdraw a previous grant: stop future tracking and drop accessible Meta cookies. */
  withdrawMarketing: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

/**
 * The stored consent record, or null if there is no usable one.
 *
 * Registrations echo this record to the server, which re-checks it before sending
 * anything to Meta. That is why the whole record is returned and not just a
 * boolean: the server will not act on a bare flag.
 */
export function readConsentRecord(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredConsent>
    if (parsed?.version !== CONSENT_VERSION) return null
    if (typeof parsed.marketing !== 'boolean' || typeof parsed.decidedAt !== 'string') return null
    return { version: parsed.version, marketing: parsed.marketing, decidedAt: parsed.decidedAt }
  } catch {
    // Private mode, blocked storage or corrupt JSON.
    return null
  }
}

function readStored(): ConsentState {
  // Absent or unusable record: treat as undecided, which keeps tracking off
  // until the visitor actively accepts.
  const record = readConsentRecord()
  if (!record) return 'unknown'
  return record.marketing ? 'granted' : 'denied'
}

function writeStored(marketing: boolean) {
  try {
    const record: StoredConsent = { version: CONSENT_VERSION, marketing, decidedAt: new Date().toISOString() }
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Storage unavailable: the choice still applies for this page view.
  }
}

/**
 * Delete the Meta cookies this browser can see. Cookies are cleared on the exact
 * host and on the registrable domain (with and without a leading dot), because
 * the Pixel sets them on the parent domain.
 */
function clearMetaCookies() {
  if (typeof document === 'undefined') return
  const host = window.location.hostname
  const parts = host.split('.')
  // null = current host with no domain attribute; the rest cover the parent
  // domain the Pixel writes to, with and without a leading dot.
  const domains: (string | null)[] = [null, host]
  if (parts.length > 2) {
    const registrable = parts.slice(-2).join('.')
    domains.push(registrable, `.${registrable}`)
  } else if (parts.length === 2) {
    domains.push(`.${host}`)
  }

  META_COOKIES.forEach((name) => {
    domains.forEach((domain) => {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    })
  })
}

export default function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [marketing, setMarketing] = useState<ConsentState>('unknown')
  const [ready, setReady] = useState(false)

  // Read the stored choice after mount: the server cannot know it, and reading
  // during render would cause a hydration mismatch.
  useEffect(() => {
    setMarketing(readStored())
    setReady(true)
  }, [])

  const grantMarketing = useCallback(() => {
    writeStored(true)
    setMarketing('granted')
  }, [])

  const denyMarketing = useCallback(() => {
    writeStored(false)
    setMarketing('denied')
    // Nothing should exist yet, but clear defensively in case consent was
    // granted earlier in this browser.
    clearMetaCookies()
  }, [])

  const withdrawMarketing = useCallback(() => {
    writeStored(false)
    setMarketing('denied')
    // Tell the Pixel to stop, then remove the cookies we can reach. The already
    // loaded script cannot be unloaded, so MetaPixel also stops sending events.
    try {
      window.fbq?.('consent', 'revoke')
    } catch {
      // Pixel not loaded: nothing to revoke.
    }
    clearMetaCookies()
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({ marketing, ready, grantMarketing, denyMarketing, withdrawMarketing }),
    [marketing, ready, grantMarketing, denyMarketing, withdrawMarketing],
  )

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used inside ConsentProvider')
  return ctx
}
