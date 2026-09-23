import { AlertCircle } from 'lucide-react'
import { HONEYPOT_FIELD, HONEYPOT_LABEL } from '@/lib/registrations/honeypot'

// Shared building blocks for the registration forms (/first-look and
// /founding-guest): field styling, accessible error messages, the client-side
// validators and the spam honeypot.

export const inputBase =
  'mt-2 block w-full min-h-[48px] rounded-md border bg-white/[0.04] px-4 text-white text-base placeholder:text-white/35 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]'
export const labelBase = 'block text-white text-[14px] font-medium font-[family-name:var(--font-inter)]'
export const hintBase = 'mt-1 text-white/55 text-[13px] leading-snug font-[family-name:var(--font-inter)]'
export const errorBase =
  'mt-2 flex items-start gap-1.5 text-[#ffb4a8] text-[13px] leading-snug font-[family-name:var(--font-inter)]'
export const choiceBase =
  'relative flex min-h-[48px] flex-1 cursor-pointer items-center gap-3 rounded-md border px-4 text-white text-[15px] transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-navy font-[family-name:var(--font-inter)]'
export const radioBase = 'h-5 w-5 flex-shrink-0 accent-[#C9A84C] focus:outline-none'
export const checkBase = 'mt-0.5 h-5 w-5 flex-shrink-0 rounded accent-[#C9A84C] focus:outline-none'

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className={errorBase}>
      <AlertCircle aria-hidden="true" className="mt-px h-4 w-4 flex-shrink-0" strokeWidth={2} />
      <span>{message}</span>
    </p>
  )
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export const isPhone = (v: string) => {
  const digits = v.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15 && !/[^\d\s()+-]/.test(v)
}

/**
 * Spam honeypot.
 *
 * Off-screen, clipped, hidden from assistive technology and skipped by the
 * keyboard, so no guest can see or reach it; automated form-fillers fill it
 * anyway, and the server refuses anything non-empty.
 *
 * Its name, id and label are deliberately meaningless. An earlier version called
 * itself "company", which browser autofill and password managers recognise and
 * filled for real guests — silently blocking every registration made with
 * autofill. The vendor opt-out attributes below are belt and braces on top of a
 * name that gives autofill nothing to match.
 */
export function Honeypot({
  value,
  onChange,
  idPrefix,
}: {
  value: string
  onChange: (value: string) => void
  idPrefix: string
}) {
  const id = `${idPrefix}-${HONEYPOT_FIELD}`
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={id}>{HONEYPOT_LABEL}</label>
      <input
        id={id}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
