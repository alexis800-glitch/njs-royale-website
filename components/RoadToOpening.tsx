// The deliberate, phased rollout to Grand Opening. Dates and scope are exactly as
// approved — no invented Phase III date, no per-category floor assignments.

const phases = [
  {
    date: 'December 12, 2026',
    title: 'Daycation Soft Opening',
    body: 'The rooftop, beach and leisure clubs, and pool-deck leisure experiences welcome their first guests.',
  },
  {
    date: 'December 2026 – January 2027',
    title: 'Daycation Season',
    body: 'Thursday to Sunday Daycation operations by the coast.',
  },
  {
    date: 'February 2027',
    title: 'Accommodation Begins',
    body: 'Initial accommodation inventory begins opening progressively, including the lower accommodation floors.',
  },
  {
    date: 'April – July 2027',
    title: 'Resort Ramp-Up',
    body: 'Accommodation, leisure and dining expand under controlled occupancy.',
  },
  {
    date: 'July 2027',
    title: 'Grand Opening',
    body: 'All floors 1–6 and the complete 262-key NJS Royale Beach Resort.',
  },
]

export default function RoadToOpening() {
  return (
    <section id="rollout" className="bg-[#0A1628] py-28 md:py-32 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold text-[10px] uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            A Deliberate Opening
          </p>
          <h2
            className="font-[family-name:var(--font-cormorant)] text-white leading-tight"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            The Road to Grand Opening
          </h2>
        </div>

        <ol className="relative border-l border-gold/25 ml-3 sm:ml-6">
          {phases.map((p, i) => (
            <li key={p.title} className={`relative pl-8 sm:pl-10 ${i === phases.length - 1 ? '' : 'pb-12'}`}>
              {/* node */}
              <span
                aria-hidden="true"
                className={`absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border ${
                  p.title === 'Grand Opening'
                    ? 'bg-gold border-gold'
                    : 'bg-[#0A1628] border-gold/70'
                }`}
              />
              <div className="text-gold text-[11px] uppercase tracking-[2.5px] font-[family-name:var(--font-inter)]">
                {p.date}
              </div>
              <h3 className="mt-2 font-[family-name:var(--font-cormorant)] text-white text-2xl leading-snug">
                {p.title}
              </h3>
              <p className="mt-2 text-white/55 text-[15px] leading-relaxed font-[family-name:var(--font-inter)] max-w-xl">
                {p.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
