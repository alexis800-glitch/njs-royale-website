const items = [
  'Daycation opens December 12, 2026',
  'Thursday to Sunday',
  'Accommodation from February 2027',
  'Grand Opening July 2027',
]

function Item({ label }: { label: string }) {
  return (
    <span className="flex items-center">
      <span className="text-[10.5px] sm:text-[11px] font-medium uppercase tracking-[2.5px] text-navy font-[family-name:var(--font-inter)] whitespace-nowrap">
        {label}
      </span>
      <span className="mx-5 sm:mx-7 text-[#a8842f] text-[10px]" aria-hidden="true">
        &bull;
      </span>
    </span>
  )
}

function Group() {
  return (
    <div className="flex items-center py-3.5 shrink-0">
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
      className="relative isolate overflow-hidden border-y border-gold/45 bg-[linear-gradient(90deg,#F6EFDC_0%,#ECDFC2_50%,#F6EFDC_100%)]"
    >
      {/* Soft inner depth: top highlight fading to a faint warm shade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0)_48%,rgba(90,70,20,0.06))]"
      />

      {/* Extremely subtle slow satin sweep — motion-safe only, behind the text */}
      <div
        aria-hidden="true"
        className="ribbon-satin pointer-events-none absolute inset-y-0 left-0 hidden w-1/4 motion-safe:block"
      />
      <style>{`
        @keyframes ribbon-satin {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(440%); }
        }
        .ribbon-satin {
          background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
          animation: ribbon-satin 16s ease-in-out infinite;
        }
      `}</style>

      {/* Accessible, non-visual copy (read once by screen readers) */}
      <p className="sr-only">
        Daycation opens December 12, 2026, Thursday to Sunday. Accommodation opens
        progressively from February 2027, with Grand Opening in July 2027.
      </p>

      {/* Animated seamless marquee — only when motion is allowed (slow, smooth) */}
      <div
        aria-hidden="true"
        className="relative z-10 hidden motion-safe:flex w-max animate-marquee [animation-duration:60s] will-change-transform"
      >
        <Group />
        <Group />
      </div>

      {/* Static, centred fallback — shown when the visitor prefers reduced motion */}
      <div
        aria-hidden="true"
        className="relative z-10 motion-safe:hidden flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-3.5 px-4 text-center"
      >
        {items.map((label, i) => (
          <span key={label} className="flex items-center">
            <span className="text-[10.5px] sm:text-[11px] font-medium uppercase tracking-[2.5px] text-navy font-[family-name:var(--font-inter)]">
              {label}
            </span>
            {i < items.length - 1 && (
              <span className="mx-4 text-[#a8842f] text-[10px]" aria-hidden="true">
                &bull;
              </span>
            )}
          </span>
        ))}
      </div>
    </section>
  )
}
