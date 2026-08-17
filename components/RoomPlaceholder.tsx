// Premium branded placeholder shown until official photography is supplied for a
// room category. The accommodation name is shown in the card heading beneath the
// image, so the placeholder focuses on brand + missing-imagery only.
// Replacing it later is a one-line change: set `mainImage` on the accommodation
// record and render an <Image> instead — no layout change required.

export default function RoomPlaceholder() {
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
        className="h-10 w-auto opacity-80 mb-4"
      />
      <div className="font-[family-name:var(--font-cormorant)] text-white/90 text-lg tracking-[4px] uppercase">
        NJS Royale
      </div>
      <div className="mt-3 text-white/40 text-[9px] uppercase tracking-[3px] font-[family-name:var(--font-inter)]">
        Official imagery coming soon
      </div>
    </div>
  )
}
