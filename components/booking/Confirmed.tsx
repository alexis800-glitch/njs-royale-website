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

import { Check, CreditCard, ShieldCheck } from 'lucide-react'
import { formatNaira } from '@/lib/accommodation'
import type { Confirmation } from '@/lib/booking/types'
import { formatLongDate } from '@/lib/booking/dates'
import { UNCONFIRMED_POLICY, cancellationSummary, noShowSummary } from '@/lib/booking/policy'
import { eyebrow, displayHeading, card, primaryButton, RateTable } from './ui'

/**
 * How the reservation was secured.
 *
 * A guarantee and a payment are different states and are shown differently. The
 * one thing both must never do is imply money is set aside: a guarantee holds
 * nothing, and this says so in the first line rather than in a footnote.
 */
function HowItWasSecured({ payment }: { payment: Confirmation['payment'] }) {
  if (payment.option === 'card-guarantee') {
    const card = payment.guarantee?.card
    return (
      <section className="rounded-md border border-gold/30 bg-gold/[0.05] p-5" aria-labelledby="secured-by">
        <h3
          id="secured-by"
          className="flex items-center gap-2 text-gold text-[11px] uppercase tracking-[2.5px] font-semibold font-[family-name:var(--font-inter)]"
        >
          <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          Secured by card guarantee
        </h3>
        <p className="mt-3 text-white text-[14.5px] leading-relaxed font-[family-name:var(--font-inter)]">
          Nothing has been charged, and no money is held on the card.
        </p>
        {card && (
          <p className="mt-2 flex items-center gap-2 text-white/65 text-[13.5px] font-[family-name:var(--font-inter)]">
            <CreditCard aria-hidden="true" className="h-4 w-4 text-gold/70" strokeWidth={1.75} />
            {card.brand ? card.brand.toUpperCase() : 'Card'} ending {card.last4 ?? '••••'} — a
            fictional test card, held only as a token
          </p>
        )}
        <ul className="mt-4 space-y-1.5 border-t border-gold/20 pt-3 text-white/55 text-[12.5px] leading-relaxed font-[family-name:var(--font-inter)]">
          <li>{cancellationSummary(UNCONFIRMED_POLICY)}</li>
          <li>{noShowSummary(UNCONFIRMED_POLICY)}</li>
          <li>
            The card would need checking again closer to arrival; that process is to be confirmed.
          </li>
        </ul>
      </section>
    )
  }

  return (
    <section className="rounded-md border border-white/10 bg-white/[0.03] p-5" aria-labelledby="secured-by">
      <h3
        id="secured-by"
        className="flex items-center gap-2 text-white/50 text-[13px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]"
      >
        <CreditCard aria-hidden="true" className="h-4 w-4 text-gold/70" strokeWidth={1.75} />
        Paid at booking
      </h3>
      <p className="mt-3 text-white text-[14.5px] font-[family-name:var(--font-inter)]">
        {formatNaira(payment.amountPaid)}{' '}
        <span className="text-white/50 text-[13px]">— simulated; no money moved</span>
      </p>
    </section>
  )
}

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
        <HowItWasSecured payment={confirmation.payment} />

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
