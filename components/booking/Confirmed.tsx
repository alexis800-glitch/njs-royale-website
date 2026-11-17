'use client'

// The confirmation screen.
//
// Two things here are deliberately not the usual reassuring hotel copy.
//
// First, it says plainly that no reservation exists. A convincing fake
// confirmation is the single most dangerous screen in a prototype: it is the
// one somebody screenshots.
//
// Second, it renders the absence of a provider reference as a visible state
// rather than hiding it. The July 2026 Aiosell sandbox push returned HTTP 200
// with no booking id, which means "accepted, with nothing to quote back" is a
// real outcome the live journey will have to handle. Hiding it in the prototype
// would mean discovering it in production.

import { Check } from 'lucide-react'
import type { Confirmation } from '@/lib/booking/types'
import { formatLongDate } from '@/lib/booking/dates'
import { eyebrow, displayHeading, card, primaryButton, RateTable } from './ui'

export default function Confirmed({
  confirmation,
  onStartAgain,
}: {
  confirmation: Confirmation
  onStartAgain: () => void
}) {
  const { query } = confirmation.selection

  return (
    <div>
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold text-navy"
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div>
          <p className={eyebrow}>Simulated confirmation</p>
          <h2 className={`${displayHeading} mt-2 text-[30px] sm:text-[36px]`}>
            This is how a confirmation would read
          </h2>
        </div>
      </div>

      <p
        role="status"
        className="mt-6 rounded-md border border-gold/40 bg-gold/[0.07] p-4 text-white/80 text-[14px] leading-relaxed font-[family-name:var(--font-inter)]"
      >
        No reservation has been created, no payment has been taken and nothing has been sent to the
        resort. The reference below is synthetic and will not be recognised by anyone.
      </p>

      <div className="mt-6 space-y-5">
        <section className={card} aria-labelledby="confirmed-ref">
          <h3
            id="confirmed-ref"
            className="text-white/50 text-[13px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]"
          >
            Reference
          </h3>
          <p className="mt-2 font-[family-name:var(--font-inter)] text-gold text-[20px] tracking-[1px]">
            {confirmation.reference}
          </p>
          <p className="mt-3 text-white/45 text-[12.5px] leading-relaxed font-[family-name:var(--font-inter)]">
            Booking-engine reference:{' '}
            {confirmation.providerReference === null ? (
              <span className="text-white/60">
                none returned — a real outcome the live journey must handle, and the reason
                reconciliation is on the list of details still needed from Aiosell
              </span>
            ) : (
              confirmation.providerReference
            )}
          </p>
        </section>

        <section className={card} aria-labelledby="confirmed-stay">
          <h3
            id="confirmed-stay"
            className="font-[family-name:var(--font-cormorant)] text-white text-[22px]"
          >
            {confirmation.selection.categoryId.replace(/-/g, ' ')}
          </h3>
          <p className="mt-2 text-white/60 text-[14px] font-[family-name:var(--font-inter)]">
            {formatLongDate(query.arrival)} to {formatLongDate(query.departure)} ·{' '}
            {confirmation.rate.nights} {confirmation.rate.nights === 1 ? 'night' : 'nights'} ·{' '}
            {query.rooms} {query.rooms === 1 ? 'room' : 'rooms'}
          </p>
          <p className="mt-1 text-white/60 text-[14px] font-[family-name:var(--font-inter)]">
            {confirmation.guest.firstName} {confirmation.guest.lastName} ·{' '}
            {confirmation.guest.email}
          </p>
          <div className="mt-5 border-t border-white/10 pt-5">
            <RateTable rate={confirmation.rate} />
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={onStartAgain}
        className={`${primaryButton} mt-8 w-full sm:w-auto`}
      >
        Start again
      </button>
    </div>
  )
}
