'use client'

// Step 2 — choose a room.
//
// Availability and rates are presented together, because a guest choosing a
// room is choosing a price. Each card states only what the resort has actually
// confirmed: the category, the view, the opening rate and the total. Room size,
// occupancy, bed type and the cancellation policy are not confirmed for any
// category, so the card says so instead of filling the space with plausible
// numbers. See lib/booking/mock/inventory.ts.
//
// The list is a radio group, not a row of buttons: it is a single choice among
// several, arrow keys should move between the options, and a screen reader
// should hear "2 of 9".

import { useId } from 'react'
import { BedDouble, Loader2 } from 'lucide-react'
import { formatNaira } from '@/lib/accommodation'
import type { RoomOffer } from '@/lib/booking/types'
import { eyebrow, displayHeading, body, primaryButton, secondaryButton } from './ui'

function Unconfirmed({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-white/40 text-[12.5px] font-[family-name:var(--font-inter)]">
      {children}
    </span>
  )
}

function OfferCard({
  offer,
  selected,
  name,
  onSelect,
}: {
  offer: RoomOffer
  selected: boolean
  name: string
  onSelect: () => void
}) {
  const id = `offer-${offer.categoryId}`
  return (
    <label
      htmlFor={id}
      className={`block cursor-pointer rounded-md border p-5 transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-navy sm:p-6 ${
        selected ? 'border-gold bg-gold/[0.06]' : 'border-white/12 bg-white/[0.02] hover:border-white/30'
      }`}
    >
      <div className="flex items-start gap-4">
        <input
          id={id}
          type="radio"
          name={name}
          value={offer.categoryId}
          checked={selected}
          onChange={onSelect}
          className="mt-1.5 h-5 w-5 flex-shrink-0 accent-[#C9A84C] focus:outline-none"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-[family-name:var(--font-cormorant)] text-white text-[22px] leading-snug sm:text-[24px]">
              {offer.name}
            </h3>
            <p className="font-[family-name:var(--font-inter)] text-gold text-[15px] tabular-nums">
              {formatNaira(offer.nightlyRate)}
              <span className="text-white/45 text-[12.5px]"> / night</span>
            </p>
          </div>

          <p className="mt-1 text-white/50 text-[12.5px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]">
            {offer.category}
            {offer.view ? ` · ${offer.view}` : ''}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="flex items-center gap-1.5 text-white/65 text-[13px] font-[family-name:var(--font-inter)]">
              <BedDouble aria-hidden="true" className="h-4 w-4 text-gold/70" strokeWidth={1.75} />
              {offer.roomsAvailable} {offer.roomsAvailable === 1 ? 'room' : 'rooms'} available
            </span>
            <Unconfirmed>Room size to be confirmed</Unconfirmed>
            <Unconfirmed>Occupancy to be confirmed</Unconfirmed>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/10 pt-4">
            <span className="text-white/55 text-[13px] font-[family-name:var(--font-inter)]">
              {offer.rate.nights} {offer.rate.nights === 1 ? 'night' : 'nights'}
              {offer.rate.rooms > 1 ? `, ${offer.rate.rooms} rooms` : ''}
            </span>
            <span className="font-[family-name:var(--font-inter)] text-white text-[15px] tabular-nums">
              {formatNaira(offer.rate.total)}
              <span className="text-white/45 text-[12.5px]"> total</span>
            </span>
          </div>

          {offer.cancellationPolicy === null && (
            <p className="mt-2 text-white/40 text-[12.5px] leading-snug font-[family-name:var(--font-inter)]">
              Cancellation terms and the taxes and service position are to be confirmed by the resort.
            </p>
          )}
        </div>
      </div>
    </label>
  )
}

export default function StepRooms({
  offers,
  selectedId,
  loading,
  onSelect,
  onBack,
  onContinue,
}: {
  offers: RoomOffer[]
  selectedId: string | null
  loading: boolean
  onSelect: (categoryId: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const groupName = useId()

  return (
    <div>
      <p className={eyebrow}>Step two</p>
      <h2 className={`${displayHeading} mt-3 text-[30px] sm:text-[36px]`}>Choose your room</h2>
      <p className={`${body} mt-3 max-w-xl`}>
        {offers.length} {offers.length === 1 ? 'category' : 'categories'} available for your dates,
        at the resort&rsquo;s opening rates.
      </p>

      <fieldset className="mt-8">
        <legend className="sr-only">Available room categories</legend>
        <div className="space-y-4">
          {offers.map((offer) => (
            <OfferCard
              key={offer.categoryId}
              offer={offer}
              name={groupName}
              selected={selectedId === offer.categoryId}
              onSelect={() => onSelect(offer.categoryId)}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedId || loading}
          aria-busy={loading}
          className={`${primaryButton} w-full sm:w-auto`}
        >
          {loading && (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              strokeWidth={2.5}
            />
          )}
          {loading ? 'Checking…' : 'Continue'}
        </button>
        <button type="button" onClick={onBack} className={`${secondaryButton} w-full sm:w-auto`}>
          Change dates
        </button>
      </div>
    </div>
  )
}
