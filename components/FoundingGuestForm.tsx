'use client'

import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { FieldError, checkBase, hintBase, inputBase, isEmail, isPhone, labelBase } from './previewForm'

// PREVIEW ONLY — same safeguards as the /first-look form. This form never
// transmits, emails, saves or stores anything: there is no action, no fetch and no
// storage, and no input carries a `name`. The submit button stays disabled until
// hydration, which also blocks implicit (Enter-key) native submits.
// The final registration and data-management method is still to be chosen.

type Values = {
  code: string
  primaryName: string
  email: string
  phone: string
  secondName: string
  attendance: boolean
  arrival: string
  arrivalNotes: string
  conditionsAck: boolean
  updates: boolean
}

type Field = keyof Values
type Errors = Partial<Record<Field, string>>

const INITIAL: Values = {
  code: '',
  primaryName: '',
  email: '',
  phone: '',
  secondName: '',
  attendance: false,
  arrival: '',
  arrivalNotes: '',
  conditionsAck: false,
  updates: false,
}

// Order used to move focus to the first invalid field.
const FIELD_ORDER: Field[] = ['code', 'primaryName', 'email', 'phone', 'secondName', 'attendance', 'arrival', 'conditionsAck']

const ARRIVAL_OPTIONS = [
  'Morning (before 12:00 noon)',
  'Afternoon (12:00 noon – 4:00 p.m.)',
  'Early evening (4:00 p.m. – 7:00 p.m.)',
  'Later in the evening (after 7:00 p.m.)',
]

const PREVIEW_MESSAGE = 'Draft preview only — your Founding Guest registration has not been submitted.'

function validate(v: Values): Errors {
  const e: Errors = {}
  if (!v.code.trim()) e.code = 'Enter the invitation or reference code shown on your Founding Guest invitation.'
  if (!v.primaryName.trim()) e.primaryName = 'Enter the primary guest’s full name.'
  if (!v.email.trim()) e.email = 'Enter your email address.'
  else if (!isEmail(v.email)) e.email = 'Enter an email address in the format name@example.com.'
  if (!v.phone.trim()) e.phone = 'Enter your mobile or WhatsApp number.'
  else if (!isPhone(v.phone))
    e.phone = 'Enter a valid mobile or WhatsApp number, including the country code if outside Nigeria.'
  if (!v.secondName.trim()) e.secondName = 'Enter the second guest’s full name.'
  if (!v.attendance) e.attendance = 'Please confirm attendance from 23 to 25 July 2027.'
  if (!v.arrival) e.arrival = 'Select your expected arrival time on 23 July 2027.'
  if (!v.conditionsAck) e.conditionsAck = 'Please accept the Founding Guest accommodation conditions.'
  return e
}

export default function FoundingGuestForm() {
  const [values, setValues] = useState<Values>(INITIAL)
  const [errors, setErrors] = useState<Errors>({})
  const [attempted, setAttempted] = useState(false)
  const [previewShown, setPreviewShown] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const noticeRef = useRef<HTMLDivElement>(null)

  useEffect(() => setHydrated(true), [])

  const set = <K extends Field>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value }
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
      document.getElementById(`fg-${first}`)?.focus()
      return
    }
    // Nothing is sent anywhere — acknowledge the draft submit and stop.
    setPreviewShown(true)
    requestAnimationFrame(() => noticeRef.current?.focus())
  }

  const describedBy = (field: Field, hint?: boolean) =>
    [hint ? `fg-${field}-hint` : '', errors[field] ? `fg-${field}-error` : ''].filter(Boolean).join(' ') ||
    undefined

  const border = (field: Field) => (errors[field] ? 'border-[#ffb4a8]' : 'border-white/20 hover:border-white/35')
  const errorCount = Object.keys(errors).length

  const text = (field: 'code' | 'primaryName' | 'secondName', label: string, hint?: string, extra?: object) => (
    <div>
      <label htmlFor={`fg-${field}`} className={labelBase}>
        {label}
      </label>
      {hint && (
        <p id={`fg-${field}-hint`} className={hintBase}>
          {hint}
        </p>
      )}
      <input
        id={`fg-${field}`}
        type="text"
        value={values[field]}
        onChange={(e) => set(field, e.target.value)}
        aria-invalid={!!errors[field]}
        aria-describedby={describedBy(field, !!hint)}
        className={`${inputBase} ${border(field)}`}
        {...extra}
      />
      <FieldError id={`fg-${field}-error`} message={errors[field]} />
    </div>
  )

  return (
    <div className="mt-8">
      {/* Preview notice — does not claim that information is collected */}
      <div className="mb-8 flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4 text-white/85 text-[14px] leading-relaxed font-[family-name:var(--font-inter)]">
        <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" strokeWidth={1.75} />
        <p>
          <strong className="font-semibold text-white">Design preview.</strong> Founding Guest activation is not
          yet open. Nothing entered in this form is sent, emailed, saved or stored.
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

      <form noValidate onSubmit={onSubmit} aria-labelledby="activate-heading" className="space-y-7">
        <p className="text-white/55 text-[13px] font-[family-name:var(--font-inter)]">
          All fields are required unless marked optional.
        </p>

        {text('code', 'Invitation or reference code', 'Printed on your Founding Guest invitation.', {
          autoComplete: 'off',
          autoCapitalize: 'characters',
          spellCheck: false,
          className: `${inputBase} uppercase tracking-[2px] ${border('code')}`,
        })}

        <fieldset className="space-y-7 border-t border-white/10 pt-7">
          <legend className="text-gold text-[11px] uppercase tracking-[3px] font-semibold font-[family-name:var(--font-inter)]">
            Guests
          </legend>
          {text('primaryName', 'Primary guest’s full name', 'As shown on government-issued identification.', {
            autoComplete: 'name',
          })}

          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-5">
            <div className="min-w-0">
              <label htmlFor="fg-email" className={labelBase}>
                Email address
              </label>
              <input
                id="fg-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={describedBy('email')}
                className={`${inputBase} ${border('email')}`}
              />
              <FieldError id="fg-email-error" message={errors.email} />
            </div>
            <div className="min-w-0">
              <label htmlFor="fg-phone" className={labelBase}>
                Mobile/WhatsApp number
              </label>
              <input
                id="fg-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+234"
                value={values.phone}
                onChange={(e) => set('phone', e.target.value)}
                aria-invalid={!!errors.phone}
                aria-describedby={describedBy('phone')}
                className={`${inputBase} ${border('phone')}`}
              />
              <FieldError id="fg-phone-error" message={errors.phone} />
            </div>
          </div>

          {text('secondName', 'Second guest’s full name', 'As shown on government-issued identification.', {
            autoComplete: 'off',
          })}
        </fieldset>

        <fieldset className="space-y-7 border-t border-white/10 pt-7">
          <legend className="text-gold text-[11px] uppercase tracking-[3px] font-semibold font-[family-name:var(--font-inter)]">
            Your stay
          </legend>

          <div>
            <div className="flex items-start gap-3 rounded-md py-2 text-white/90 text-[15px] leading-relaxed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-navy font-[family-name:var(--font-inter)]">
              <label htmlFor="fg-attendance" className="-m-3 flex flex-shrink-0 cursor-pointer p-3">
                <input
                  id="fg-attendance"
                  type="checkbox"
                  checked={values.attendance}
                  onChange={(e) => set('attendance', e.target.checked)}
                  aria-invalid={!!errors.attendance}
                  aria-describedby={errors.attendance ? 'fg-attendance-error' : undefined}
                  className={`${checkBase} cursor-pointer`}
                />
              </label>
              <label htmlFor="fg-attendance" className="flex-1 min-h-[44px] cursor-pointer">
                I confirm our attendance from check-in on <strong className="font-semibold text-white">23 July 2027</strong>{' '}
                to check-out on <strong className="font-semibold text-white">25 July 2027</strong>.
              </label>
            </div>
            <FieldError id="fg-attendance-error" message={errors.attendance} />
          </div>

          <div>
            <label htmlFor="fg-arrival" className={labelBase}>
              Expected arrival time on 23 July 2027
            </label>
            <select
              id="fg-arrival"
              value={values.arrival}
              onChange={(e) => set('arrival', e.target.value)}
              aria-invalid={!!errors.arrival}
              aria-describedby={describedBy('arrival')}
              className={`${inputBase} ${border('arrival')} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10`}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C9A84C' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              }}
            >
              <option value="" className="bg-navy">
                Select a time
              </option>
              {ARRIVAL_OPTIONS.map((o) => (
                <option key={o} value={o} className="bg-navy">
                  {o}
                </option>
              ))}
            </select>
            <FieldError id="fg-arrival-error" message={errors.arrival} />
          </div>

          <div>
            <label htmlFor="fg-arrivalNotes" className={labelBase}>
              Arrival notes <span className="font-normal text-white/60">(optional)</span>
            </label>
            <p id="fg-arrivalNotes-hint" className={hintBase}>
              For example, how you plan to travel. Transportation and airfare are not included.
            </p>
            <textarea
              id="fg-arrivalNotes"
              rows={3}
              value={values.arrivalNotes}
              onChange={(e) => set('arrivalNotes', e.target.value)}
              aria-describedby="fg-arrivalNotes-hint"
              className={`${inputBase} ${border('arrivalNotes')} py-3`}
            />
          </div>
        </fieldset>

        <div className="space-y-3 border-t border-white/10 pt-7">
          {/* Required acceptance of the conditions */}
          <div>
            <div className="flex items-start gap-3 rounded-md py-2 text-white/85 text-[14px] leading-relaxed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-navy font-[family-name:var(--font-inter)]">
              <label htmlFor="fg-conditionsAck" className="-m-3 flex flex-shrink-0 cursor-pointer p-3">
                <input
                  id="fg-conditionsAck"
                  type="checkbox"
                  checked={values.conditionsAck}
                  onChange={(e) => set('conditionsAck', e.target.checked)}
                  aria-invalid={!!errors.conditionsAck}
                  aria-describedby={errors.conditionsAck ? 'fg-conditionsAck-error' : undefined}
                  className={`${checkBase} cursor-pointer`}
                />
              </label>
              <label htmlFor="fg-conditionsAck" className="flex-1 min-h-[44px] cursor-pointer">
                I have read and accept the{' '}
                <a
                  href="#conditions"
                  className="text-gold underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-sm"
                >
                  Founding Guest accommodation conditions
                </a>
                .
              </label>
            </div>
            <FieldError id="fg-conditionsAck-error" message={errors.conditionsAck} />
          </div>

          {/* Optional consent — never preselected */}
          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-md py-2 text-white/85 text-[14px] leading-relaxed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-navy font-[family-name:var(--font-inter)]">
            <input
              type="checkbox"
              checked={values.updates}
              onChange={(e) => set('updates', e.target.checked)}
              className={checkBase}
            />
            <span>
              Keep me informed with relevant NJS Royale updates. <span className="text-white/60">(Optional)</span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!hydrated}
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-md bg-gold px-8 text-navy text-[13px] uppercase tracking-[2px] font-semibold transition-colors duration-300 hover:bg-[#d8bb66] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
        >
          Activate my invitation
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
      </form>
    </div>
  )
}
