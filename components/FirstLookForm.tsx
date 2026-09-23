'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import {
  FieldError,
  Honeypot,
  checkBase,
  choiceBase,
  hintBase,
  inputBase,
  isEmail,
  isPhone,
  labelBase,
  radioBase,
} from './registration/fields'
import { useRegistrationSubmit } from './registration/useRegistrationSubmit'
import { FIRST_ESCAPE } from '@/lib/firstLook'

// First Look guest RSVP for the Phase I opening on 12 December 2026.
//
// The form posts to /api/registrations, which validates everything again and
// stores the registration in Postgres. The guest is told it succeeded only once
// the server confirms the row was written. A Meta CompleteRegistration event
// follows, browser and server sharing one id, and only with marketing consent.

type Attending = '' | 'yes' | 'no'
type Party = '' | '1' | '2'

type Values = {
  code: string
  fullName: string
  email: string
  phone: string
  attending: Attending
  party: Party
  companion: string
  grandOpeningUpdates: boolean
  privacyAck: boolean
}

type Field = keyof Values
type Errors = Partial<Record<Field, string>>

const INITIAL: Values = {
  code: '',
  fullName: '',
  email: '',
  phone: '',
  attending: '',
  party: '',
  companion: '',
  grandOpeningUpdates: false,
  privacyAck: false,
}

// Order used to move focus to the first invalid field.
const FIELD_ORDER: Field[] = [
  'code',
  'fullName',
  'email',
  'phone',
  'attending',
  'party',
  'companion',
  'privacyAck',
]

function validate(v: Values): Errors {
  const e: Errors = {}
  if (!v.code.trim()) e.code = 'Enter the invitation or reference code shown on your invitation.'
  if (!v.fullName.trim()) e.fullName = 'Enter your full name.'
  if (!v.email.trim()) e.email = 'Enter your email address.'
  else if (!isEmail(v.email))
    e.email = 'Enter an email address in the format name@example.com.'
  if (!v.phone.trim()) e.phone = 'Enter your mobile or WhatsApp number.'
  else if (!isPhone(v.phone))
    e.phone = 'Enter a valid mobile or WhatsApp number, including the country code if outside Nigeria.'
  if (!v.attending) e.attending = 'Tell us whether you will attend on 12 December 2026.'
  if (v.attending === 'yes') {
    if (!v.party) e.party = 'Select how many people will attend.'
    if (v.party === '2' && !v.companion.trim()) e.companion = 'Enter your companion’s full name.'
  }
  if (!v.privacyAck) e.privacyAck = 'Please confirm that you have read the Privacy Policy.'
  return e
}

export default function FirstLookForm() {
  const [values, setValues] = useState<Values>(INITIAL)
  const [errors, setErrors] = useState<Errors>({})
  const [attempted, setAttempted] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const noticeRef = useRef<HTMLDivElement>(null)
  const { submit, submitting, succeeded, message } = useRegistrationSubmit('first-look')

  useEffect(() => setHydrated(true), [])

  // Announce the outcome to screen readers by moving focus to it.
  useEffect(() => {
    if (succeeded || message) requestAnimationFrame(() => noticeRef.current?.focus())
  }, [succeeded, message])

  const set = <K extends Field>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value }
    // Clear dependent answers so hidden fields never hold stale values.
    if (key === 'attending' && value !== 'yes') {
      next.party = ''
      next.companion = ''
    }
    if (key === 'party' && value !== '2') next.companion = ''
    setValues(next)
    if (attempted) setErrors(validate(next))
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // A second submit while the first is in flight would be a second guest.
    if (submitting) return

    setAttempted(true)
    const found = validate(values)
    setErrors(found)
    const first = FIELD_ORDER.find((f) => found[f])
    if (first) {
      document.getElementById(`fl-${first}`)?.focus()
      return
    }

    const result = await submit({ ...values }, honeypot)
    // Entered values are kept; only the errors change, so nothing is retyped.
    if (!result.ok && result.errors) {
      setErrors(result.errors as Errors)
      const firstFromServer = FIELD_ORDER.find((f) => result.errors?.[f])
      if (firstFromServer) document.getElementById(`fl-${firstFromServer}`)?.focus()
    }
  }

  const describedBy = (field: Field, hint?: boolean) =>
    [hint ? `fl-${field}-hint` : '', errors[field] ? `fl-${field}-error` : ''].filter(Boolean).join(' ') ||
    undefined

  const errorCount = Object.keys(errors).length
  const showCompanion = values.attending === 'yes' && values.party === '2'

  // Stored and confirmed by the server: the form is replaced so it cannot be
  // sent a second time.
  if (succeeded) {
    return (
      <div className="mt-8">
        <div
          ref={noticeRef}
          tabIndex={-1}
          role="status"
          className="rounded-lg border border-gold bg-sand p-6 text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy text-gold">
              <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-[family-name:var(--font-cormorant)] text-[26px] leading-tight">
                Thank you &mdash; your RSVP is registered.
              </p>
              <p className="mt-2 text-[15px] leading-relaxed">
                We have your details for {FIRST_ESCAPE.date}. We will be in touch to confirm your
                invitation and your guest privileges.
              </p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-navy/70">
                Registration does not by itself guarantee entry or benefits. Invitations and guest
                privileges remain subject to invitation verification and RSVP confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mt-8">
      {attempted && errorCount > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-[#ffb4a8]/50 bg-[#ffb4a8]/10 p-4 text-white text-[14px] font-[family-name:var(--font-inter)]"
        >
          Please check {errorCount === 1 ? 'one field' : `${errorCount} fields`} below.
        </div>
      )}

      <form noValidate onSubmit={onSubmit} aria-labelledby="register-heading" className="space-y-7">
        <p className="text-white/55 text-[13px] font-[family-name:var(--font-inter)]">
          All fields are required unless marked optional.
        </p>

        {/* Invitation code */}
        <div>
          <label htmlFor="fl-code" className={labelBase}>
            Invitation or reference code
          </label>
          <p id="fl-code-hint" className={hintBase}>
            Printed on your First Look invitation.
          </p>
          <input
            id="fl-code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={values.code}
            onChange={(e) => set('code', e.target.value)}
            aria-invalid={!!errors.code}
            aria-describedby={describedBy('code', true)}
            className={`${inputBase} uppercase tracking-[2px] ${errors.code ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'}`}
          />
          <FieldError id="fl-code-error" message={errors.code} />
        </div>

        {/* Full name */}
        <div>
          <label htmlFor="fl-fullName" className={labelBase}>
            Full name
          </label>
          <input
            id="fl-fullName"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            aria-invalid={!!errors.fullName}
            aria-describedby={describedBy('fullName')}
            className={`${inputBase} ${errors.fullName ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'}`}
          />
          <FieldError id="fl-fullName-error" message={errors.fullName} />
        </div>

        {/* Email + phone */}
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-5">
          <div className="min-w-0">
            <label htmlFor="fl-email" className={labelBase}>
              Email address
            </label>
            <input
              id="fl-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={describedBy('email')}
              className={`${inputBase} ${errors.email ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'}`}
            />
            <FieldError id="fl-email-error" message={errors.email} />
          </div>
          <div className="min-w-0">
            <label htmlFor="fl-phone" className={labelBase}>
              Mobile/WhatsApp number
            </label>
            <input
              id="fl-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+234"
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              aria-invalid={!!errors.phone}
              aria-describedby={describedBy('phone')}
              className={`${inputBase} ${errors.phone ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'}`}
            />
            <FieldError id="fl-phone-error" message={errors.phone} />
          </div>
        </div>

        {/* Attending */}
        <fieldset aria-describedby={errors.attending ? 'fl-attending-error' : undefined}>
          <legend className={labelBase}>Will you attend on 12 December 2026?</legend>
          <div className="mt-2 flex gap-3">
            {(['yes', 'no'] as const).map((opt, i) => (
              <label
                key={opt}
                className={`${choiceBase} ${
                  values.attending === opt ? 'border-gold bg-gold/10' : errors.attending ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'
                }`}
              >
                <input
                  id={i === 0 ? 'fl-attending' : undefined}
                  type="radio"
                  name="fl-attending"
                  value={opt}
                  checked={values.attending === opt}
                  onChange={() => set('attending', opt)}
                  aria-invalid={!!errors.attending}
                  className={radioBase}
                />
                {opt === 'yes' ? 'Yes' : 'No'}
              </label>
            ))}
          </div>
          <FieldError id="fl-attending-error" message={errors.attending} />
        </fieldset>

        {/* Number attending — only relevant when attending */}
        {values.attending === 'yes' && (
          <fieldset aria-describedby={['fl-party-hint', errors.party ? 'fl-party-error' : ''].filter(Boolean).join(' ')}>
            <legend className={labelBase}>Number attending</legend>
            <p id="fl-party-hint" className={hintBase}>
              Your invitation admits you and one companion.
            </p>
            <div className="mt-2 flex gap-3">
              {(['1', '2'] as const).map((opt, i) => (
                <label
                  key={opt}
                  className={`${choiceBase} ${
                    values.party === opt ? 'border-gold bg-gold/10' : errors.party ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'
                  }`}
                >
                  <input
                    id={i === 0 ? 'fl-party' : undefined}
                    type="radio"
                    name="fl-party"
                    value={opt}
                    checked={values.party === opt}
                    onChange={() => set('party', opt)}
                    aria-invalid={!!errors.party}
                    className={radioBase}
                  />
                  {opt === '1' ? '1 — just me' : '2 — me and a companion'}
                </label>
              ))}
            </div>
            <FieldError id="fl-party-error" message={errors.party} />
          </fieldset>
        )}

        {/* Companion — shown only when two people are selected */}
        {showCompanion && (
          <div>
            <label htmlFor="fl-companion" className={labelBase}>
              Companion’s full name
            </label>
            <input
              id="fl-companion"
              type="text"
              autoComplete="off"
              value={values.companion}
              onChange={(e) => set('companion', e.target.value)}
              aria-invalid={!!errors.companion}
              aria-describedby={describedBy('companion')}
              className={`${inputBase} ${errors.companion ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35'}`}
            />
            <FieldError id="fl-companion-error" message={errors.companion} />
          </div>
        )}

        <div className="space-y-3 border-t border-white/10 pt-7">
          {/* Optional consent — never preselected */}
          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-md py-2 text-white/85 text-[14px] leading-relaxed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-navy font-[family-name:var(--font-inter)]">
            <input
              type="checkbox"
              checked={values.grandOpeningUpdates}
              onChange={(e) => set('grandOpeningUpdates', e.target.checked)}
              className={checkBase}
            />
            <span>
              Keep me informed about the NJS Royale Grand Opening on 23 July 2027.{' '}
              <span className="text-white/50">(Optional)</span>
            </span>
          </label>

          {/* Required privacy acknowledgement */}
          <div>
            <div className="flex items-start gap-3 rounded-md py-2 text-white/85 text-[14px] leading-relaxed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-navy font-[family-name:var(--font-inter)]">
              {/* Padded wrapper gives the checkbox itself a 44px hit area. */}
              <label htmlFor="fl-privacyAck" className="-m-3 flex flex-shrink-0 cursor-pointer p-3">
              <input
                id="fl-privacyAck"
                type="checkbox"
                checked={values.privacyAck}
                onChange={(e) => set('privacyAck', e.target.checked)}
                aria-invalid={!!errors.privacyAck}
                aria-describedby={errors.privacyAck ? 'fl-privacyAck-error' : undefined}
                className={`${checkBase} cursor-pointer`}
              />
              </label>
              <label htmlFor="fl-privacyAck" className="flex-1 min-h-[44px] cursor-pointer">
                I have read and acknowledge the{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener"
                  className="text-gold underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-sm"
                >
                  Privacy Policy
                  <span className="sr-only"> (opens in a new tab)</span>
                </Link>
                .
              </label>
            </div>
            <FieldError id="fl-privacyAck-error" message={errors.privacyAck} />
          </div>
        </div>

        <Honeypot idPrefix="fl" value={honeypot} onChange={setHoneypot} />

        <button
          type="submit"
          disabled={!hydrated || submitting}
          aria-busy={submitting}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-md bg-gold px-8 text-navy text-[13px] uppercase tracking-[2px] font-semibold transition-colors duration-300 hover:bg-[#d8bb66] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
        >
          {submitting && (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={2.5} />
          )}
          {submitting ? 'Sending\u2026' : 'Send my RSVP'}
        </button>

        <div aria-live="polite">
          {message && (
            <div
              ref={noticeRef}
              tabIndex={-1}
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-[#ffb4a8]/60 bg-[#ffb4a8]/10 p-4 text-white text-[14.5px] leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#ffb4a8]" strokeWidth={2} />
              <p>{message}</p>
            </div>
          )}
        </div>

        <p className="text-white/55 text-[13px] leading-relaxed font-[family-name:var(--font-inter)]">
          Registration does not by itself guarantee entry or benefits. Invitations and guest privileges
          remain subject to invitation verification and RSVP confirmation.
        </p>
      </form>
    </div>
  )
}
