'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import {
  FieldError,
  checkBase,
  choiceBase,
  hintBase,
  inputBase,
  isEmail,
  isPhone,
  labelBase,
  radioBase,
} from './previewForm'

// PREVIEW ONLY. This form never transmits, emails, saves or stores anything:
// there is no action, no fetch and no storage. Only the two radio groups carry a
// `name` (for native grouping); no personal-data input does. The submit button stays
// disabled until hydration, which also blocks implicit (Enter-key) native submits.
// The final registration and data-management method is still to be chosen.

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

const PREVIEW_MESSAGE = 'Draft preview only — no information has been submitted.'

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
  const [previewShown, setPreviewShown] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const noticeRef = useRef<HTMLDivElement>(null)

  useEffect(() => setHydrated(true), [])

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
    setPreviewShown(false)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAttempted(true)
    const found = validate(values)
    setErrors(found)
    const first = FIELD_ORDER.find((f) => found[f])
    if (first) {
      setPreviewShown(false)
      document.getElementById(`fl-${first}`)?.focus()
      return
    }
    // Nothing is sent anywhere — acknowledge the draft submit and stop.
    setPreviewShown(true)
    requestAnimationFrame(() => noticeRef.current?.focus())
  }

  const describedBy = (field: Field, hint?: boolean) =>
    [hint ? `fl-${field}-hint` : '', errors[field] ? `fl-${field}-error` : ''].filter(Boolean).join(' ') ||
    undefined

  const errorCount = Object.keys(errors).length
  const showCompanion = values.attending === 'yes' && values.party === '2'

  return (
    <div className="mt-8">
      {/* Preview notice — does not claim that information is collected */}
      <div className="mb-8 flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4 text-white/85 text-[14px] leading-relaxed font-[family-name:var(--font-inter)]">
        <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" strokeWidth={1.75} />
        <p>
          <strong className="font-semibold text-white">Design preview.</strong> Registration is not yet
          open. Nothing entered in this form is sent, emailed, saved or stored.
        </p>
      </div>

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

        <button
          type="submit"
          disabled={!hydrated}
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-md bg-gold px-8 text-navy text-[13px] uppercase tracking-[2px] font-semibold transition-colors duration-300 hover:bg-[#d8bb66] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
        >
          Send my RSVP
        </button>

        <div aria-live="polite">
          {previewShown && (
            <div
              ref={noticeRef}
              tabIndex={-1}
              role="status"
              className="flex items-start gap-3 rounded-lg border border-gold bg-sand p-4 text-navy text-[15px] font-medium leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
            >
              <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8a6d22]" strokeWidth={2} />
              <p>{PREVIEW_MESSAGE}</p>
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
