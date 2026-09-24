'use client'

import { useCallback, useRef, useState } from 'react'
import { readConsentRecord, useConsent } from '@/components/consent/ConsentProvider'
import { trackCompleteRegistration } from '@/lib/meta/browser'
import type { RegistrationKind } from '@/lib/registrations/validate'

// Submitting a registration, shared by both forms.
//
// The server stores the registration and decides everything about Meta: whether
// consent is valid, what the event id is, and whether a browser event should fire
// at all. This hook only obeys the answer. If the server says no — declined
// consent, a duplicate submission, a Pixel that is not configured — nothing is
// sent from the browser either.

export type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export type SubmitResult = {
  ok: boolean
  /** Field-level errors from the server, keyed the same way as the client's own. */
  errors?: Record<string, string>
}

type ApiResponse = {
  ok?: boolean
  errors?: Record<string, string>
  message?: string
  eventId?: string | null
  trackBrowserEvent?: boolean
}

const GENERIC_ERROR =
  'Something went wrong and your registration was not saved. Please try again, or call us on 0707 533 4158.'

function newUuid(): string {
  const webCrypto = globalThis.crypto
  if (webCrypto && typeof webCrypto.randomUUID === 'function') return webCrypto.randomUUID()
  // Older browsers, or a page served over plain http: still needs to be unique
  // enough to make a retry idempotent.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function useRegistrationSubmit(kind: RegistrationKind) {
  const { marketing } = useConsent()
  const [state, setState] = useState<SubmitState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  // Guards a second submit while the first is still in the air: a double-click,
  // a second Enter press, or an impatient tap.
  const inFlight = useRef(false)
  // Kept across retries so a resubmission after a network error lands on the
  // same row rather than registering the guest twice.
  const submissionId = useRef<string>('')
  // When this form appeared. Used only to reject submissions faster than a human.
  const renderedAt = useRef<number>(0)
  if (renderedAt.current === 0 && typeof window !== 'undefined') renderedAt.current = Date.now()

  const submit = useCallback(
    async (fields: Record<string, unknown>, formToken: string): Promise<SubmitResult> => {
      if (inFlight.current) return { ok: false }
      inFlight.current = true
      setState('submitting')
      setMessage(null)

      if (!submissionId.current) submissionId.current = newUuid()

      try {
        const response = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            kind,
            submissionId: submissionId.current,
            fields,
            // Echoed so the server can check the record is complete and current.
            // It cannot prove the record genuine; see lib/meta/consent.ts.
            consent: readConsentRecord(),
            // Neutrally named on the wire too, matching the field itself.
            formToken,
            renderedAt: renderedAt.current,
          }),
        })

        let data: ApiResponse = {}
        try {
          data = (await response.json()) as ApiResponse
        } catch {
          // Leave data empty; the status below decides.
        }

        if (response.ok && data.ok === true) {
          // The browser half of the deduplicated pair, under the server's id.
          if (data.trackBrowserEvent === true && typeof data.eventId === 'string' && marketing === 'granted') {
            trackCompleteRegistration(data.eventId)
          }
          setState('success')
          return { ok: true }
        }

        setState('error')
        setMessage(data.message ?? GENERIC_ERROR)
        return { ok: false, errors: data.errors }
      } catch {
        // Offline, DNS, a cancelled request: the registration may not have been
        // stored, so say so rather than claiming success.
        setState('error')
        setMessage(GENERIC_ERROR)
        return { ok: false }
      } finally {
        inFlight.current = false
      }
    },
    [kind, marketing],
  )

  return { state, message, submit, submitting: state === 'submitting', succeeded: state === 'success' }
}
