// What works on mocks, and what is blocked.
//
// Rendered on the prototype page from the same data the tests assert on
// (lib/booking/aiosell/provider.ts), so the gap cannot quietly drift out of
// date: a function that moves from blocked to mocked moves here too, and a
// blocked function with no stated reason fails a test.

import { CircleDashed, CircleCheck } from 'lucide-react'
import { BLOCKED_PENDING_AIOSELL } from '@/lib/booking/aiosell/provider'
import { eyebrow, displayHeading, body } from './ui'

export default function IntegrationStatus() {
  const mocked = BLOCKED_PENDING_AIOSELL.filter((f) => f.state === 'mocked')
  const blocked = BLOCKED_PENDING_AIOSELL.filter((f) => f.state === 'blocked')

  return (
    <section aria-labelledby="integration-status">
      <p className={eyebrow}>Integration status</p>
      <h2 id="integration-status" className={`${displayHeading} mt-3 text-[26px] sm:text-[30px]`}>
        What is built, and what is waiting on Aiosell
      </h2>
      <p className={`${body} mt-3 max-w-2xl`}>
        {mocked.length} of {BLOCKED_PENDING_AIOSELL.length} integration functions are complete
        against the mock adapter. The remaining {blocked.length} cannot be written without
        Aiosell&rsquo;s documentation, and nothing here guesses at them.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <h3 className="flex items-center gap-2 text-white text-[13px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
            <CircleCheck aria-hidden="true" className="h-4 w-4 text-gold" strokeWidth={2} />
            Complete on mocks
          </h3>
          <ul className="mt-4 space-y-3">
            {mocked.map((f) => (
              <li
                key={f.id}
                className="rounded-md border border-gold/25 bg-gold/[0.04] px-4 py-3 text-white/80 text-[14px] leading-relaxed font-[family-name:var(--font-inter)]"
              >
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-white text-[13px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
            <CircleDashed aria-hidden="true" className="h-4 w-4 text-white/45" strokeWidth={2} />
            Blocked, pending written confirmation
          </h3>
          <ul className="mt-4 space-y-3">
            {blocked.map((f) => (
              <li
                key={f.id}
                className="rounded-md border border-white/12 bg-white/[0.02] px-4 py-3 font-[family-name:var(--font-inter)]"
              >
                <p className="text-white/85 text-[14px] leading-relaxed">{f.label}</p>
                <p className="mt-1.5 text-white/50 text-[13px] leading-relaxed">{f.needs}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
