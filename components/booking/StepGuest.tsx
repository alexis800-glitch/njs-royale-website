'use client'

// Step 3 — the guest.
//
// The fields and their messages are the registration forms' own, through
// components/registration/fields.tsx and lib/booking/validate.ts, so a guest
// who has already registered for the opening meets the same form behaviour
// here. Validation runs on submit and then on every change, which is the
// pattern FirstLookForm uses: validating from the first keystroke tells someone
// their email is invalid while they are still typing the @.

import { useRef, useState } from 'react'
import { FieldError, hintBase, inputBase, labelBase } from '@/components/registration/fields'
import { validateGuestDetails, type FieldErrors } from '@/lib/booking/validate'
import type { GuestDetails } from '@/lib/booking/types'
import { eyebrow, displayHeading, body, primaryButton, secondaryButton } from './ui'

const FIELD_ORDER = ['firstName', 'lastName', 'email', 'phone'] as const

interface Values {
  firstName: string
  lastName: string
  email: string
  phone: string
  specialRequests: string
}

const INITIAL: Values = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialRequests: '',
}

export default function StepGuest({
  onSubmit,
  onBack,
}: {
  onSubmit: (guest: GuestDetails) => void
  onBack: () => void
}) {
  const [values, setValues] = useState<Values>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [attempted, setAttempted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const set = (key: keyof Values, value: string) => {
    const next = { ...values, [key]: value }
    setValues(next)
    if (attempted) {
      const checked = validateGuestDetails(next)
      setErrors(checked.ok ? {} : checked.errors)
    }
  }

  const describedBy = (field: string, hint?: boolean) =>
    [hint ? `bg-${field}-hint` : '', errors[field] ? `bg-${field}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined

  const borderFor = (field: string) =>
    errors[field] ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setAttempted(true)
    const checked = validateGuestDetails(values)
    if (!checked.ok) {
      setErrors(checked.errors)
      const first = FIELD_ORDER.find((f) => checked.errors[f])
      if (first) formRef.current?.querySelector<HTMLElement>(`#bg-${first}`)?.focus()
      return
    }
    setErrors({})
    onSubmit(checked.value)
  }

  return (
    <div>
      <p className={eyebrow}>Step three</p>
      <h2 className={`${displayHeading} mt-3 text-[30px] sm:text-[36px]`}>Guest details</h2>
      <p className={`${body} mt-3 max-w-xl`}>
        For the reservation and for the resort to reach you before you arrive.
      </p>

      <form ref={formRef} noValidate onSubmit={handleSubmit} className="mt-8 space-y-7">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-5">
          <div className="min-w-0">
            <label htmlFor="bg-firstName" className={labelBase}>
              First name
            </label>
            <input
              id="bg-firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={values.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              aria-invalid={!!errors.firstName}
              aria-describedby={describedBy('firstName')}
              className={`${inputBase} ${borderFor('firstName')}`}
            />
            <FieldError id="bg-firstName-error" message={errors.firstName} />
          </div>

          <div className="min-w-0">
            <label htmlFor="bg-lastName" className={labelBase}>
              Last name
            </label>
            <input
              id="bg-lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={values.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              aria-invalid={!!errors.lastName}
              aria-describedby={describedBy('lastName')}
              className={`${inputBase} ${borderFor('lastName')}`}
            />
            <FieldError id="bg-lastName-error" message={errors.lastName} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-5">
          <div className="min-w-0">
            <label htmlFor="bg-email" className={labelBase}>
              Email
            </label>
            <input
              id="bg-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={describedBy('email')}
              className={`${inputBase} ${borderFor('email')}`}
            />
            <FieldError id="bg-email-error" message={errors.email} />
          </div>

          <div className="min-w-0">
            <label htmlFor="bg-phone" className={labelBase}>
              Mobile or WhatsApp
            </label>
            <p id="bg-phone-hint" className={hintBase}>
              Include the country code if outside Nigeria.
            </p>
            <input
              id="bg-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              aria-invalid={!!errors.phone}
              aria-describedby={describedBy('phone', true)}
              className={`${inputBase} ${borderFor('phone')}`}
            />
            <FieldError id="bg-phone-error" message={errors.phone} />
          </div>
        </div>

        <div>
          <label htmlFor="bg-specialRequests" className={labelBase}>
            Anything we should know? <span className="text-white/45">(optional)</span>
          </label>
          <p id="bg-specialRequests-hint" className={hintBase}>
            A request is noted, never guaranteed.
          </p>
          <textarea
            id="bg-specialRequests"
            name="specialRequests"
            rows={3}
            maxLength={1000}
            value={values.specialRequests}
            onChange={(e) => set('specialRequests', e.target.value)}
            aria-describedby="bg-specialRequests-hint"
            className={`${inputBase} min-h-[96px] resize-y py-3 border-white/20 hover:border-white/35`}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" className={`${primaryButton} w-full sm:w-auto`}>
            Review booking
          </button>
          <button type="button" onClick={onBack} className={`${secondaryButton} w-full sm:w-auto`}>
            Back to rooms
          </button>
        </div>
      </form>
    </div>
  )
}
