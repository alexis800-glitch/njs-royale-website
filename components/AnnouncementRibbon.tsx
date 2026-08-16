const items = [
  'Daycation opens this December',
  'Thursday to Sunday',
  'Rooms open July 2027',
]

function Item({ label }: { label: string }) {
  return (
    <span className="flex items-center">
      <span className="text-[10.5px] sm:text-[11px] uppercase tracking-[2.5px] text-[#f6f2e9]/90 font-[family-name:var(--font-inter)] whitespace-nowrap">
        {label}
      </span>
      <span className="mx-5 sm:mx-7 text-gold/70 text-[10px]" aria-hidden="true">
        &bull;
      </span>
    </span>
  )
}

function Group() {
  return (
    <div className="flex items-center py-3 shrink-0">
      {items.map((label) => (
        <Item key={label} label={label} />
      ))}
    </div>
  )
}

export default function AnnouncementRibbon() {
  return (
    <section
      id="opening"
      aria-label="Opening announcements"
      className="relative bg-navyDark border-y border-gold/25 overflow-hidden"
    >
      {/* Accessible, non-visual copy (read once by screen readers) */}
      <p className="sr-only">
        Daycation opens this December, Thursday to Sunday. Rooms open July 2027.
      </p>

      {/* Animated seamless marquee — only when motion is allowed */}
      <div
        aria-hidden="true"
        className="hidden motion-safe:flex w-max animate-marquee will-change-transform"
      >
        <Group />
        <Group />
      </div>

      {/* Static, centred fallback — shown when the visitor prefers reduced motion */}
      <div
        aria-hidden="true"
        className="motion-safe:hidden flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-3 px-4 text-center"
      >
        {items.map((label, i) => (
          <span key={label} className="flex items-center">
            <span className="text-[10.5px] sm:text-[11px] uppercase tracking-[2.5px] text-[#f6f2e9]/90 font-[family-name:var(--font-inter)]">
              {label}
            </span>
            {i < items.length - 1 && (
              <span className="mx-4 text-gold/70 text-[10px]" aria-hidden="true">
                &bull;
              </span>
            )}
          </span>
        ))}
      </div>
    </section>
  )
}
