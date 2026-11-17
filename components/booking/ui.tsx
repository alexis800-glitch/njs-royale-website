// Shared presentation for the booking journey.
//
// Everything here is presentation only: no provider, no validation, no dates
// arithmetic. The field styles come from components/registration/fields.tsx
// rather than being restated, so the booking form and the RSVP forms cannot
// drift apart.

import { AlertCircle, Check, Info } from 'lucide-react'
import { formatNaira } from '@/lib/accommodation'
import { PROTOTYPE_NOTICE } from '@/lib/booking/config'
import type { BookingError, RateBreakdown, StayQuery } from '@/lib/booking/types'
import { formatShortDate, nightsBetween } from '@/lib/booking/dates'

export const eyebrow =
  'text-gold text-[10px] uppercase tracking-[3.5px] font-medium font-[family-name:var(--font-inter)]'
export const displayHeading =
  'font-[family-name:var(--font-cormorant)] text-white leading-tight'
export const body =
  'text-white/60 text-[15px] leading-relaxed font-[family-name:var(--font-inter)]'

export const primaryButton =
  'inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-md bg-gold px-8 text-navy text-[13px] uppercase tracking-[2px] font-semibold transition-colors duration-300 hover:bg-[#d8bb66] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]'

export const secondaryButton =
  'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md border border-white/25 px-7 text-white/85 text-[13px] uppercase tracking-[2px] transition-colors duration-300 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]'

export const card = 'rounded-md border border-white/10 bg-white/[0.03] p-5 sm:p-6'

// ---------------------------------------------------------------------------

/**
 * The prototype banner.
 *
 * Deliberately loud, and deliberately first. Anyone who opens a preview link
 * sees what this is before they see a room. The one thing worse than no
 * prototype is a prototype somebody mistakes for a booking system.
 */
export function PrototypeBanner() {
  return (
    <aside
      aria-labelledby="prototype-heading"
      className="rounded-md border border-gold/50 bg-gold/[0.07] p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" strokeWidth={2} />
        <div>
          <h2
            id="prototype-heading"
            className="text-gold text-[11px] uppercase tracking-[2.5px] font-semibold font-[family-name:var(--font-inter)]"
          >
            {PROTOTYPE_NOTICE.heading}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {PROTOTYPE_NOTICE.points.map((point) => (
              <li
                key={point}
                className="text-white/70 text-[13.5px] leading-relaxed font-[family-name:var(--font-inter)]"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------

export interface StepDefinition {
  id: string
  label: string
}

/**
 * Progress through the journey.
 *
 * An ordered list, so the structure is in the markup and not only in the
 * styling. aria-current marks the step the guest is on; completed steps carry a
 * visually-hidden word so a screen reader is not left to infer it from a tick.
 */
export function Stepper({
  steps,
  currentIndex,
}: {
  steps: StepDefinition[]
  currentIndex: number
}) {
  return (
    <nav aria-label="Booking progress">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-3">
        {steps.map((step, index) => {
          const done = index < currentIndex
          const current = index === currentIndex
          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3">
              <span
                aria-current={current ? 'step' : undefined}
                className={`flex items-center gap-2 text-[11px] uppercase tracking-[2px] font-[family-name:var(--font-inter)] ${
                  current ? 'text-gold' : done ? 'text-white/70' : 'text-white/35'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[11px] ${
                    current
                      ? 'border-gold bg-gold text-navy font-semibold'
                      : done
                        ? 'border-white/40 text-white/70'
                        : 'border-white/20 text-white/35'
                  }`}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
                </span>
                <span>{step.label}</span>
                {done && <span className="sr-only">(completed)</span>}
              </span>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className="hidden h-px w-6 bg-white/15 sm:block" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ---------------------------------------------------------------------------

/** The stay, restated at every step so the guest never loses their place. */
export function StaySummary({ query }: { query: StayQuery }) {
  const nights = nightsBetween(query.arrival, query.departure)
  const parts = [
    `${formatShortDate(query.arrival)} – ${formatShortDate(query.departure)}`,
    `${nights} ${nights === 1 ? 'night' : 'nights'}`,
    `${query.adults} ${query.adults === 1 ? 'adult' : 'adults'}`,
    ...(query.children > 0
      ? [`${query.children} ${query.children === 1 ? 'child' : 'children'}`]
      : []),
    `${query.rooms} ${query.rooms === 1 ? 'room' : 'rooms'}`,
  ]
  return (
    <p className="text-white/55 text-[13px] font-[family-name:var(--font-inter)]">
      {parts.join('  ·  ')}
    </p>
  )
}

// ---------------------------------------------------------------------------

/**
 * A provider or payment failure, as the guest sees it.
 *
 * role="alert" and a focusable container, so the message is announced and can
 * be reached. The retry affordance appears only for errors the provider marked
 * retryable: offering "try again" on a rejected query trains guests to hammer a
 * button that cannot help them.
 */
export function ErrorNotice({
  error,
  onRetry,
}: {
  error: BookingError
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      tabIndex={-1}
      className="flex items-start gap-3 rounded-md border border-[#ffb4a8]/60 bg-[#ffb4a8]/10 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
    >
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#ffb4a8]"
        strokeWidth={2}
      />
      <div className="min-w-0">
        <p className="text-white text-[14.5px] leading-relaxed font-[family-name:var(--font-inter)]">
          {error.message}
        </p>
        {error.retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-[44px] text-gold text-[12px] uppercase tracking-[2px] underline underline-offset-4 hover:text-[#d8bb66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

/**
 * The money.
 *
 * `taxesAndFees` is null while the tax and service position is unconfirmed, and
 * this component says so rather than printing a zero. A guest reading "₦0
 * taxes" has been told something false; a guest reading "exclusive of taxes and
 * service, to be confirmed" has been told the truth.
 */
export function RateTable({ rate }: { rate: RateBreakdown }) {
  const perNight = `${formatNaira(rate.nightlyRate)} × ${rate.nights} ${
    rate.nights === 1 ? 'night' : 'nights'
  }${rate.rooms > 1 ? ` × ${rate.rooms} rooms` : ''}`

  return (
    <div className="font-[family-name:var(--font-inter)]">
      <dl className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-white/55 text-[13.5px]">{perNight}</dt>
          <dd className="text-white/85 text-[14px] tabular-nums">{formatNaira(rate.roomSubtotal)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-white/55 text-[13.5px]">Taxes and service</dt>
          <dd className="text-white/55 text-[13px]">
            {rate.taxesAndFees === null ? 'To be confirmed' : formatNaira(rate.taxesAndFees)}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-white/10 pt-4">
        <span className="text-white text-[13px] uppercase tracking-[2px]">Total</span>
        <span className="font-[family-name:var(--font-cormorant)] text-gold text-[26px] tabular-nums">
          {formatNaira(rate.total)}
        </span>
      </div>
      {rate.taxesAndFees === null && (
        <p className="mt-2 text-white/45 text-[12.5px] leading-snug">
          Exclusive of taxes and service charge, which the resort has not yet confirmed.
        </p>
      )}
    </div>
  )
}
