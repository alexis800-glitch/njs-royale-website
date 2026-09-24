// The confirmed opening programme: exactly two phases. Do not add intermediate stages
// or a third phase. Phase One opens the resort to guests; only the rooms wait for
// Phase Two. Dates and scope come from lib/opening.ts.

import { PHASE_ONE_DATE, PHASE_ONE_ISO, PHASE_TWO_DATE, PHASE_TWO_ISO } from '@/lib/opening'

const phases = [
  {
    name: 'Phase One',
    date: PHASE_ONE_DATE,
    isoDate: PHASE_ONE_ISO,
    title: 'The Resort Opens',
    body: 'Yahweh Heights, Voyage and Royale Horizon open, with the resort lounges, live entertainment and the private beach. Come experience the resort before the rooms open.',
    final: false,
  },
  {
    name: 'Phase Two',
    date: PHASE_TWO_DATE,
    isoDate: PHASE_TWO_ISO,
    title: 'Guest Rooms & Accommodation',
    body: 'Guest rooms and accommodation open across eleven categories, from Royale Rooms to the Presidential Suite.',
    final: true,
  },
]

export default function RoadToOpening() {
  return (
    <section id="rollout" className="bg-[#0A1628] py-28 md:py-32 px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            The Opening Programme
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Opening in Two Phases
          </h2>
        </div>

        <ol className="grid gap-6 md:grid-cols-2">
          {phases.map((p) => (
            <li
              key={p.name}
              className={`flex flex-col border p-8 sm:p-10 ${
                p.final ? 'border-gold/50 bg-[#060E1A]/50' : 'border-gold/25'
              }`}
            >
              <p className="text-gold/75 text-[10px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]">
                {p.name}
              </p>
              <p
                className="mt-4 font-[family-name:var(--font-cormorant)] text-gold leading-none"
                style={{ fontSize: 'clamp(30px, 3.4vw, 42px)' }}
              >
                <time dateTime={p.isoDate}>{p.date}</time>
              </p>
              <div aria-hidden="true" className="my-6 h-px w-12 bg-gold/30" />
              <h3 className="font-[family-name:var(--font-cormorant)] text-white text-2xl leading-snug">
                {p.title}
              </h3>
              <p className="mt-3 text-white/55 text-[15px] leading-relaxed font-[family-name:var(--font-inter)]">
                {p.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
