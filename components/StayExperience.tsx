// Two-night positioning, framed as an experience rather than a booking rule.
// Public copy only — internal stay exceptions are handled in the reservations system.

export default function StayExperience() {
  return (
    <section className="bg-sand py-24 md:py-28 px-8">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-gold text-[10px] uppercase tracking-[4px] mb-5 font-[family-name:var(--font-inter)]">
          The NJS Royale Experience
        </p>
        <h2
          className="font-[family-name:var(--font-cormorant)] text-navy leading-tight mb-6"
          style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}
        >
          Two-Night Minimum Stay
        </h2>
        <p className="text-navy/60 leading-relaxed font-[family-name:var(--font-inter)]">
          NJS Royale is designed as a destination, not simply an overnight stay. A
          two-night minimum invites you to settle into the rhythm of the coast — unhurried
          mornings by the water, long golden afternoons, and evenings that unfold at their
          own pace — arriving slowly and leaving restored.
        </p>
        <div className="mt-8">
          <a
            href="#enquire"
            className="inline-flex items-center justify-center bg-navy text-[#f6f2e9] px-7 py-[14px] text-[12px] uppercase tracking-[0.08em] font-medium hover:bg-gold hover:text-navy transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Plan Your Stay
          </a>
        </div>
      </div>
    </section>
  )
}
