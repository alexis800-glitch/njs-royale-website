'use client'

// The booking journey.
//
// This component owns the journey's state and nothing else. It never knows
// which provider it is talking to: it holds a BookingProvider and calls the six
// interface methods. Swapping the mock for a real adapter changes the factory
// call on one line here and nothing else in this file — which is the whole
// claim the integration foundation is making, so it is worth stating where it
// can be checked.
//
// Guest details live in this component's state and nowhere else. Nothing is
// posted, stored or persisted: there is no route behind this, by design, and no
// reservation database. Closing the tab discards everything.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createMockPaymentProvider } from '@/lib/booking/mock/payment'
import { resolveProvider } from '@/lib/booking'
import { addDays, earliestSelectableArrival } from '@/lib/booking'
import type { ProviderId } from '@/lib/booking/config'
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

/** The scripted outcome, expressed as the email marker the mock reads. */
function emailFor(outcome: TestOutcome, real: string): string {
  switch (outcome) {
    case 'declined':
      return 'decline@example.test'
    case 'abandoned':
      return 'abandon@example.test'
    case 'processor-outage':
      return 'outage@example.test'
    case 'authorised':
      return real
  }
}

export default function BookingJourney({
  providerId,
  today,
}: {
  providerId: ProviderId
  /** Fixed on the server, so client and server agree on the earliest arrival. */
  today: string
}) {
  const provider = useMemo(() => resolveProvider(providerId), [providerId])

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
      const result = await provider.search(next)
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
    [provider],
  )

  const requestQuote = useCallback(
    async (categoryId: string) => {
      setBusy(true)
      setError(null)
      const result = await provider.quote({ categoryId, query })
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        retryRef.current = () => void requestQuote(categoryId)
        return
      }
      setQuote(result.value)
      setPhase('guest')
    },
    [provider, query],
  )

  const hold = useCallback(
    async (details: GuestDetails) => {
      if (!quote) return
      setBusy(true)
      setError(null)
      const result = await provider.hold(quote, details)
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        retryRef.current = () => void hold(details)
        return
      }
      setGuest(details)
      setDraft(result.value)
      setPhase('review')
    },
    [provider, quote],
  )

  const confirm = useCallback(async () => {
    if (!draft || !guest || !quote) return
    setBusy(true)
    setError(null)

    const payments = createMockPaymentProvider({ guestEmail: emailFor(outcome, guest.email) })
    const paid = await payments.pay({
      amount: quote.rate.total,
      currency: 'NGN',
      reference: draft.draftRef,
      description: `${quote.offer.name} — ${quote.rate.nights} nights`,
    })

    if (!paid.ok) {
      setBusy(false)
      setError(paid.error)
      retryRef.current = () => void confirm()
      return
    }

    const result = await provider.confirm(draft, paid.value)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      retryRef.current = () => void confirm()
      return
    }
    setConfirmation(result.value)
    setPhase('confirmed')
  }, [draft, guest, quote, outcome, provider])

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
