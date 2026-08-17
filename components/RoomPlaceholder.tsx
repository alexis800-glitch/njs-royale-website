// Premium branded placeholder shown until official photography is supplied for a
// room category. Replacing it later is a one-line change: set `mainImage` on the
// accommodation record and render an <Image> instead — no layout change required.

export default function RoomPlaceholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_38%,#132239_0%,#0A1628_70%)] px-6 text-center">
      {/* subtle gold hairline frame */}
      <div className="pointer-events-none absolute inset-3 border border-gold/20" />
      {/* official crest mark, quiet */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/njs-logos/njs-crest-mark.png"
        alt=""
        aria-hidden="true"
        className="h-9 w-auto opacity-80 mb-3"
      />
      <div className="font-[family-name:var(--font-cormorant)] text-white/90 text-lg tracking-[3px] uppercase">
        NJS Royale
      </div>
      <div className="mt-2 max-w-[16rem] font-[family-name:var(--font-cormorant)] text-gold text-base italic leading-snug">
        {label}
      </div>
      <div className="mt-4 text-white/40 text-[9px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]">
        Official imagery coming soon
      </div>
    </div>
  )
}
