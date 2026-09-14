// The confirmed opening programme: exactly two phases. Do not add intermediate stages
// or a third phase, and keep Phase One to the scope NJS has confirmed.

const phases = [
  {
    name: 'Phase One',
    date: 'December 12, 2026',
    isoDate: '2026-12-12',
    title: 'Second-Floor Pool Opening',
    body: 'The second-floor swimming-pool area opens, together with its associated support spaces.',
    final: false,
  },
  {
    name: 'Phase Two',
    date: 'July 23, 2027',
    isoDate: '2027-07-23',
    title: 'Full Resort Opening',
    body: 'The complete resort opens, including all accommodation and the remaining resort operations.',
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
