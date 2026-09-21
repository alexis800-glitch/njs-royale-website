'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-gold px-4 text-navy font-semibold hover:bg-[#d8bb66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2433]"
    >
      <Printer aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      Print / Save PDF
    </button>
  )
}
