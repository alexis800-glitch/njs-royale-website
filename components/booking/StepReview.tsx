'use client'

// Step 4 — review and confirm.
//
// The last screen before a reservation would be created, so it restates
// everything the guest is agreeing to and nothing they are not. In particular
// it does not show a payment form: no processor has been selected, and the
// payment boundary (lib/booking/payment.ts) is an interface rather than an
// integration. What it shows instead is a scripted-outcome selector, so a
// reviewer can walk the authorised, declined and abandoned paths on demand.
//
// That selector is prototype furniture. It lives behind the same gate as the
// rest of the journey and is labelled as a test control, because a control that
// looks like a payment choice is worse than no control at all.

import { Loader2, ShieldCheck } from 'lucide-react'
import { choiceBase, radioBase } from '@/components/registration/fields'
import type { GuestDetails, Quote } from '@/lib/booking/types'
import type { PaymentOption } from '@/lib/booking/payment'
import { formatLongDate, nightsBetween, todayIso } from '@/lib/booking/dates'
import { UNCONFIRMED_POLICY, cancellationSummary, noShowSummary, payNowSummary } from '@/lib/booking/policy'
import { eyebrow, displayHeading, body, card, primaryButton, secondaryButton, RateTable } from './ui'

/** The scripted payment outcomes the mock processor understands. */
export type TestOutcome = 'authorised' | 'declined' | 'abandoned' | 'processor-outage'

const OUTCOMES: { id: TestOutcome; label: string }[] = [
  { id: 'authorised', label: 'Authorised' },
  { id: 'declined', label: 'Declined' },
  { id: 'abandoned', label: 'Abandoned' },
  { id: 'processor-outage', label: 'Processor unreachable' },
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5">
      <dt className="text-white/50 text-[13px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]">
        {label}
      </dt>
      <dd className="text-white/85 text-[14.5px] font-[family-name:var(--font-inter)]">{children}</dd>
    </div>
  )
}

/**
 * What a card guarantee means, said plainly.
 *
 * The hard part is the gap. A card check made at booking does not stay valid
 * until a stay that may be most of a year away, and no authorisation holds
 * money for that long. Rather than quote a window nobody has confirmed, this
 * states the real number of days to arrival — which is a fact — and says the
 * card would need checking again closer to the date, by a process still to be
 * agreed. Nothing here invents a deadline, a charge or a policy.
 */
function GuaranteeExplainer({ arrival }: { arrival: string }) {
  const daysToArrival = nightsBetween(todayIso(), arrival)

  return (
    <div className="mt-4 rounded-md border border-gold/30 bg-gold/[0.05] p-4">
      <p className="flex items-center gap-2 text-gold text-[11px] uppercase tracking-[2.5px] font-semibold font-[family-name:var(--font-inter)]">
        <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        What a card guarantee means
      </p>
      <ul className="mt-3 space-y-2 text-white/75 text-[13.5px] leading-relaxed font-[family-name:var(--font-inter)]">
        <li>
          <strong className="text-white">Nothing is charged today</strong>, and no money is held on
          your card.
        </li>
        {daysToArrival > 0 && (
          <li>
            Your arrival is <strong className="text-white">{daysToArrival} days</strong> away. A card
            check made today does not stay valid that long, so your card would need checking again
            closer to your stay. That process is to be confirmed.
          </li>
        )}
        <li>{cancellationSummary(UNCONFIRMED_POLICY)}</li>
        <li>{noShowSummary(UNCONFIRMED_POLICY)}</li>
        <li>
          Card details would be entered on the payment provider&rsquo;s own secure form. NJS never
          receives or stores your card number or security code.
        </li>
      </ul>
      <p className="mt-3 border-t border-gold/20 pt-3 text-white/50 text-[12.5px] leading-relaxed font-[family-name:var(--font-inter)]">
        In this prototype no card form is shown and no card is collected, because no payment
        provider is connected.
      </p>
    </div>
  )
}

export default function StepReview({
  quote,
  guest,
  outcome,
  paymentOption,
  submitting,
  onOutcomeChange,
  onPaymentOptionChange,
  onConfirm,
  onBack,
}: {
  quote: Quote
  guest: GuestDetails
  outcome: TestOutcome
  paymentOption: PaymentOption
  submitting: boolean
  onOutcomeChange: (outcome: TestOutcome) => void
  onPaymentOptionChange: (option: PaymentOption) => void
  onConfirm: () => void
  onBack: () => void
}) {
  const { query } = quote.selection

  return (
    <div>
      <p className={eyebrow}>Step four</p>
      <h2 className={`${displayHeading} mt-3 text-[30px] sm:text-[36px]`}>Review your booking</h2>
      <p className={`${body} mt-3 max-w-xl`}>
        Nothing is reserved and no payment is taken. This prototype creates no reservation anywhere.
      </p>

      <div className="mt-8 space-y-5">
        <section className={card} aria-labelledby="review-stay">
          <h3
            id="review-stay"
            className="font-[family-name:var(--font-cormorant)] text-white text-[22px]"
          >
            {quote.offer.name}
          </h3>
          <dl className="mt-3 divide-y divide-white/10">
            <Row label="Arrival">{formatLongDate(query.arrival)}</Row>
            <Row label="Departure">{formatLongDate(query.departure)}</Row>
            <Row label="Guests">
              {query.adults} {query.adults === 1 ? 'adult' : 'adults'}
              {query.children > 0
                ? `, ${query.children} ${query.children === 1 ? 'child' : 'children'}`
                : ''}
            </Row>
            <Row label="Rooms">{query.rooms}</Row>
          </dl>
        </section>

        <section className={card} aria-labelledby="review-rate">
          <h3
            id="review-rate"
            className="text-white/50 text-[13px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]"
          >
            Rate
          </h3>
          <div className="mt-4">
            <RateTable rate={quote.rate} />
          </div>
        </section>

        <section className={card} aria-labelledby="review-guest">
          <h3
            id="review-guest"
            className="text-white/50 text-[13px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]"
          >
            Guest
          </h3>
          <dl className="mt-2 divide-y divide-white/10">
            <Row label="Name">
              {guest.firstName} {guest.lastName}
            </Row>
            <Row label="Email">{guest.email}</Row>
            <Row label="Mobile">{guest.phoneDisplay}</Row>
            {guest.specialRequests && <Row label="Requests">{guest.specialRequests}</Row>}
          </dl>
        </section>

        <section className={card} aria-labelledby="review-payment">
          <h3
            id="review-payment"
            className="text-white/50 text-[13px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]"
          >
            How would you like to secure this reservation?
          </h3>

          <fieldset className="mt-4">
            <legend className="sr-only">Payment option</legend>
            <div className="space-y-3">
              <label
                className={`${choiceBase} !min-h-[auto] items-start py-4 ${
                  paymentOption === 'pay-now'
                    ? 'border-gold bg-gold/[0.07]'
                    : 'border-white/20 hover:border-white/35'
                }`}
              >
                <input
                  type="radio"
                  name="payment-option"
                  value="pay-now"
                  checked={paymentOption === 'pay-now'}
                  onChange={() => onPaymentOptionChange('pay-now')}
                  className={`${radioBase} mt-0.5`}
                />
                <span className="min-w-0">
                  <span className="block text-white text-[15px]">Pay now</span>
                  <span className="mt-1 block text-white/55 text-[13px] leading-relaxed">
                    Pay the required amount at the time of booking.{' '}
                    {payNowSummary(UNCONFIRMED_POLICY)}
                  </span>
                </span>
              </label>

              <label
                className={`${choiceBase} !min-h-[auto] items-start py-4 ${
                  paymentOption === 'card-guarantee'
                    ? 'border-gold bg-gold/[0.07]'
                    : 'border-white/20 hover:border-white/35'
                }`}
              >
                <input
                  type="radio"
                  name="payment-option"
                  value="card-guarantee"
                  checked={paymentOption === 'card-guarantee'}
                  onChange={() => onPaymentOptionChange('card-guarantee')}
                  className={`${radioBase} mt-0.5`}
                />
                <span className="min-w-0">
                  <span className="block text-white text-[15px]">Pay later, card guaranteed</span>
                  <span className="mt-1 block text-white/55 text-[13px] leading-relaxed">
                    Reserve now with a card. Nothing is charged today.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          {paymentOption === 'card-guarantee' && <GuaranteeExplainer arrival={query.arrival} />}
        </section>

        <section
          className="rounded-md border border-dashed border-white/25 p-5"
          aria-labelledby="review-outcome"
        >
          <h3
            id="review-outcome"
            className="text-white/60 text-[11px] uppercase tracking-[2.5px] font-[family-name:var(--font-inter)]"
          >
            Test control — simulated payment result
          </h3>
          <p className="mt-2 text-white/45 text-[12.5px] leading-relaxed font-[family-name:var(--font-inter)]">
            No processor is connected and no money moves. Choose a result to see how the journey
            handles it, under whichever option is selected above.
          </p>
          <fieldset className="mt-4">
            <legend className="sr-only">Simulated payment result</legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {OUTCOMES.map((option) => (
                <label
                  key={option.id}
                  className={`${choiceBase} ${
                    outcome === option.id
                      ? 'border-gold bg-gold/[0.07]'
                      : 'border-white/20 hover:border-white/35'
                  }`}
                >
                  <input
                    type="radio"
                    name="test-outcome"
                    value={option.id}
                    checked={outcome === option.id}
                    onChange={() => onOutcomeChange(option.id)}
                    className={radioBase}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          aria-busy={submitting}
          className={`${primaryButton} w-full sm:w-auto`}
        >
          {submitting && (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              strokeWidth={2.5}
            />
          )}
          {submitting ? 'Confirming…' : 'Confirm booking'}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className={`${secondaryButton} w-full sm:w-auto`}
        >
          Back to details
        </button>
      </div>
    </div>
  )
}
