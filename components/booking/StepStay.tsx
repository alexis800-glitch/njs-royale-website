'use client'

// Step 1 — the stay: arrival, departure, party and rooms.
//
// The arrival input carries a `min` so the native date picker will not even
// offer a date before guest rooms open, and the departure input's `min` moves
// with the arrival. Neither is trusted: validateStayQuery enforces both rules
// again, because `min` is a hint a browser may ignore and anyone can edit the
// DOM. The attributes are there for the guest's convenience, not for safety.

import { useMemo, useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { FieldError, hintBase, inputBase, labelBase } from '@/components/registration/fields'
import { EARLIEST_ARRIVAL, LIMITS, earliestSelectableArrival } from '@/lib/booking/config'
import { addDays, formatLongDate, isIsoDate, nightsBetween } from '@/lib/booking/dates'
import { validateStayQuery, type FieldErrors } from '@/lib/booking/validate'
import type { StayQuery } from '@/lib/booking/types'
import { eyebrow, displayHeading, body, primaryButton } from './ui'

const FIELD_ORDER = ['arrival', 'departure', 'adults', 'children', 'rooms'] as const

function numbers(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

export default function StepStay({
  initial,
  today,
  onSubmit,
}: {
  initial: StayQuery
  /** Fixed by the server render so the client cannot disagree across midnight. */
  today: string
  onSubmit: (query: StayQuery) => void
}) {
  const [values, setValues] = useState<StayQuery>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [attempted, setAttempted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const minArrival = useMemo(() => earliestSelectableArrival(today), [today])
  const minDeparture = isIsoDate(values.arrival) ? addDays(values.arrival, 1) : minArrival
  const nights = nightsBetween(values.arrival, values.departure)

  const set = <K extends keyof StayQuery>(key: K, value: StayQuery[K]) => {
    const next = { ...values, [key]: value }
    // Keep the departure after the arrival as the arrival moves, rather than
    // leaving the guest with an invalid pair to discover at submit.
    if (key === 'arrival' && isIsoDate(value as string)) {
      if (nightsBetween(value as string, next.departure) === 0) {
        next.departure = addDays(value as string, 1)
      }
    }
    setValues(next)
    if (attempted) {
      const checked = validateStayQuery(next)
      setErrors(checked.ok ? {} : checked.errors)
    }
  }

  const describedBy = (field: string, hint?: boolean) =>
    [hint ? `bk-${field}-hint` : '', errors[field] ? `bk-${field}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setAttempted(true)
    const checked = validateStayQuery(values)
    if (!checked.ok) {
      setErrors(checked.errors)
      // Move focus to the first field that is actually wrong, in reading order.
      const first = FIELD_ORDER.find((f) => checked.errors[f])
      if (first) {
        formRef.current?.querySelector<HTMLElement>(`#bk-${first}`)?.focus()
      }
      return
    }
    setErrors({})
    onSubmit(checked.value)
  }

  const borderFor = (field: string) =>
    errors[field] ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'

  return (
    <div>
      <p className={eyebrow}>Step one</p>
      <h2 className={`${displayHeading} mt-3 text-[30px] sm:text-[36px]`}>Your stay</h2>
      <p className={`${body} mt-3 max-w-xl`}>
        Guest rooms and accommodation open on {formatLongDate(EARLIEST_ARRIVAL)}. Arrivals before
        that date are not available.
      </p>

      <form ref={formRef} noValidate onSubmit={handleSubmit} className="mt-8 space-y-7">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-5">
          <div className="min-w-0">
            <label htmlFor="bk-arrival" className={labelBase}>
              Arrival
            </label>
            <p id="bk-arrival-hint" className={hintBase}>
              On or after {formatLongDate(EARLIEST_ARRIVAL)}.
            </p>
            <input
              id="bk-arrival"
              name="arrival"
              type="date"
              required
              min={minArrival}
              value={values.arrival}
              onChange={(e) => set('arrival', e.target.value)}
              aria-invalid={!!errors.arrival}
              aria-describedby={describedBy('arrival', true)}
              className={`${inputBase} ${borderFor('arrival')}`}
            />
            <FieldError id="bk-arrival-error" message={errors.arrival} />
          </div>

          <div className="min-w-0">
            <label htmlFor="bk-departure" className={labelBase}>
              Departure
            </label>
            <p id="bk-departure-hint" className={hintBase}>
              At least one night after your arrival.
            </p>
            <input
              id="bk-departure"
              name="departure"
              type="date"
              required
              min={minDeparture}
              value={values.departure}
              onChange={(e) => set('departure', e.target.value)}
              aria-invalid={!!errors.departure}
              aria-describedby={describedBy('departure', true)}
              className={`${inputBase} ${borderFor('departure')}`}
            />
            <FieldError id="bk-departure-error" message={errors.departure} />
          </div>
        </div>

        <div aria-live="polite" className="min-h-[20px]">
          {nights > 0 && (
            <p className="flex items-center gap-2 text-white/60 text-[13.5px] font-[family-name:var(--font-inter)]">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-gold" strokeWidth={1.75} />
              {nights} {nights === 1 ? 'night' : 'nights'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-5">
          <div className="min-w-0">
            <label htmlFor="bk-adults" className={labelBase}>
              Adults
            </label>
            <select
              id="bk-adults"
              name="adults"
              value={values.adults}
              onChange={(e) => set('adults', Number(e.target.value))}
              aria-invalid={!!errors.adults}
              aria-describedby={describedBy('adults')}
              className={`${inputBase} ${borderFor('adults')}`}
            >
              {numbers(1, LIMITS.maxAdults).map((n) => (
                <option key={n} value={n} className="bg-navy">
                  {n}
                </option>
              ))}
            </select>
            <FieldError id="bk-adults-error" message={errors.adults} />
          </div>

          <div className="min-w-0">
            <label htmlFor="bk-children" className={labelBase}>
              Children
            </label>
            <select
              id="bk-children"
              name="children"
              value={values.children}
              onChange={(e) => set('children', Number(e.target.value))}
              aria-invalid={!!errors.children}
              aria-describedby={describedBy('children')}
              className={`${inputBase} ${borderFor('children')}`}
            >
              {numbers(0, LIMITS.maxChildren).map((n) => (
                <option key={n} value={n} className="bg-navy">
                  {n}
                </option>
              ))}
            </select>
            <FieldError id="bk-children-error" message={errors.children} />
          </div>

          <div className="min-w-0">
            <label htmlFor="bk-rooms" className={labelBase}>
              Rooms
            </label>
            <select
              id="bk-rooms"
              name="rooms"
              value={values.rooms}
              onChange={(e) => set('rooms', Number(e.target.value))}
              aria-invalid={!!errors.rooms}
              aria-describedby={describedBy('rooms')}
              className={`${inputBase} ${borderFor('rooms')}`}
            >
              {numbers(1, LIMITS.maxRooms).map((n) => (
                <option key={n} value={n} className="bg-navy">
                  {n}
                </option>
              ))}
            </select>
            <FieldError id="bk-rooms-error" message={errors.rooms} />
          </div>
        </div>

        <button type="submit" className={`${primaryButton} w-full sm:w-auto`}>
          Search rooms
        </button>
      </form>
    </div>
  )
}
