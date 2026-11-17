'use client'

// The booking journey.
//
// This component owns the journey's state and nothing else. It never knows
// which provider it is talking to, and since the server-side boundary went in
// it never holds one either: it holds a BookingClient, which can do nothing
// but POST to /api/booking. No adapter, no credential and no provider factory
// reaches this bundle.
//
// Note what the client cannot express. It sends a quote REFERENCE to hold and
// a draft REFERENCE to confirm, never the quote or draft themselves, so the
// rate charged is the one the server calculated. And it sends a payment
// INTENT, never a payment outcome, so it cannot assert that money arrived.
// Both are properties of the types in lib/booking/client.ts rather than checks
// that could be forgotten.
//
// Guest details pass through this component's state on their way to the
// server, which validates them again and holds them against the draft. Nothing
// is written to a database: there isn't one.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBookingClient } from '@/lib/booking/client'
import { addDays } from '@/lib/booking/dates'
import { earliestSelectableArrival, type ProviderId } from '@/lib/booking/config'
import type {
  BookingDraft,
  BookingError,
  Confirmation,
  GuestDetails,
  Quote,
  RoomOffer,
  StayQuery,
} from '@/lib/booking/types'
import StepStay from './StepStay'
import StepRooms from './StepRooms'
import StepGuest from './StepGuest'
import StepReview, { type TestOutcome } from './StepReview'
import Confirmed from './Confirmed'
import { ErrorNotice, Stepper, StaySummary, type StepDefinition } from './ui'

const STEPS: StepDefinition[] = [
  { id: 'stay', label: 'Stay' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'guest', label: 'Details' },
  { id: 'review', label: 'Review' },
]

type Phase = 'stay' | 'rooms' | 'guest' | 'review' | 'confirmed'

/**
 * An idempotency key for one booking attempt.
 *
 * Generated once per draft and reused on every retry, so a double-tap or a
 * replayed request returns the first reservation rather than creating a second.
 * crypto.randomUUID is available in every browser this site supports; the
 * fallback covers an insecure context, where it is undefined.
 */
function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export default function BookingJourney({
  providerId,
  today,
}: {
  providerId: ProviderId
  /** Fixed on the server, so client and server agree on the earliest arrival. */
  today: string
}) {
  const client = useMemo(() => createBookingClient({ providerId }), [providerId])

  const initialQuery = useMemo<StayQuery>(() => {
    const arrival = earliestSelectableArrival(today)
    return { arrival, departure: addDays(arrival, 3), adults: 2, children: 0, rooms: 1 }
  }, [today])

  const [phase, setPhase] = useState<Phase>('stay')
  const [query, setQuery] = useState<StayQuery>(initialQuery)
  const [offers, setOffers] = useState<RoomOffer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [draft, setDraft] = useState<BookingDraft | null>(null)
  const [guest, setGuest] = useState<GuestDetails | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [outcome, setOutcome] = useState<TestOutcome>('authorised')
  const [error, setError] = useState<BookingError | null>(null)
  const [busy, setBusy] = useState(false)
  /** Fixed per draft, so retrying confirm cannot double-book. */
  const idempotencyKey = useRef<string>('')

  // The last thing we tried, so a retryable error can retry it.
  const retryRef = useRef<(() => void) | null>(null)
  const stepRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  // Move focus to the new step, so a keyboard or screen-reader user is not left
  // at the bottom of the previous one. Skipped on first render: stealing focus
  // on page load would be worse than not managing it at all.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    stepRef.current?.focus()
  }, [phase])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const search = useCallback(
    async (next: StayQuery) => {
      setBusy(true)
      setError(null)
      const result = await client.search(next)
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        retryRef.current = () => void search(next)
        return
      }
      setQuery(next)
      setOffers(result.value)
      setSelectedId(result.value[0]?.categoryId ?? null)
      setPhase('rooms')
    },
    [client],
  )

  const requestQuote = useCallback(
    async (categoryId: string) => {
      setBusy(true)
      setError(null)
      const result = await client.quote({ categoryId, query })
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        retryRef.current = () => void requestQuote(categoryId)
        return
      }
      setQuote(result.value)
      setPhase('guest')
    },
    [client, query],
  )

  const hold = useCallback(
    async (details: GuestDetails) => {
      if (!quote) return
      setBusy(true)
      setError(null)
      // A reference, not the quote: the server reads the rate from its own copy.
      const result = await client.hold(quote.quoteRef, details)
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        retryRef.current = () => void hold(details)
        return
      }
      setGuest(details)
      setDraft(result.value)
      idempotencyKey.current = newIdempotencyKey()
      setPhase('review')
    },
    [client, quote],
  )

  const confirm = useCallback(async () => {
    if (!draft) return
    setBusy(true)
    setError(null)

    // Payment happens on the server. This sends an intent — which outcome to
    // simulate — and never an outcome. The same key on every retry.
    const result = await client.confirm(draft.draftRef, {
      idempotencyKey: idempotencyKey.current || newIdempotencyKey(),
      simulate: outcome,
    })

    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      retryRef.current = () => void confirm()
      return
    }
    setConfirmation(result.value)
    setPhase('confirmed')
  }, [draft, outcome, client])

  const startAgain = () => {
    setPhase('stay')
    setQuery(initialQuery)
    setOffers([])
    setSelectedId(null)
    setQuote(null)
    setDraft(null)
    setGuest(null)
    setConfirmation(null)
    setOutcome('authorised')
    setError(null)
    retryRef.current = null
    idempotencyKey.current = ''
  }

  const stepIndex = STEPS.findIndex((s) => s.id === phase)

  return (
    <div>
      {phase !== 'confirmed' && (
        <div className="border-b border-white/10 pb-6">
          <Stepper steps={STEPS} currentIndex={stepIndex < 0 ? STEPS.length : stepIndex} />
          {phase !== 'stay' && (
            <div className="mt-4">
              <StaySummary query={query} />
            </div>
          )}
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {busy ? 'Checking availability' : ''}
      </div>

      {error && (
        <div ref={errorRef} tabIndex={-1} className="mt-6 focus:outline-none">
          <ErrorNotice
            error={error}
            onRetry={
              error.retryable
                ? () => {
                    const again = retryRef.current
                    setError(null)
                    again?.()
                  }
                : undefined
            }
          />
        </div>
      )}

      <div ref={stepRef} tabIndex={-1} className="mt-8 focus:outline-none">
        {phase === 'stay' && (
          <StepStay initial={query} today={today} onSubmit={(next) => void search(next)} />
        )}

        {phase === 'rooms' && (
          <StepRooms
            offers={offers}
            selectedId={selectedId}
            loading={busy}
            onSelect={setSelectedId}
            onBack={() => {
              setError(null)
              setPhase('stay')
            }}
            onContinue={() => selectedId && void requestQuote(selectedId)}
          />
        )}

        {phase === 'guest' && (
          <StepGuest
            onSubmit={(details) => void hold(details)}
            onBack={() => {
              setError(null)
              setPhase('rooms')
            }}
          />
        )}

        {phase === 'review' && quote && guest && (
          <StepReview
            quote={quote}
            guest={guest}
            outcome={outcome}
            submitting={busy}
            onOutcomeChange={setOutcome}
            onConfirm={() => void confirm()}
            onBack={() => {
              setError(null)
              setPhase('guest')
            }}
          />
        )}

        {phase === 'confirmed' && confirmation && (
          <Confirmed confirmation={confirmation} onStartAgain={startAgain} />
        )}
      </div>
    </div>
  )
}
