import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#050D18] py-11 px-8 border-t border-white/4">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex-shrink-0 rounded-sm overflow-hidden">
            <Image
              src="/njs-logos/njs-royale-logo-gold-dark.jpg"
              alt="NJS Royale"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-[family-name:var(--font-cormorant)] text-white/40 text-lg">
            NJS Royale
          </span>
        </div>

        <p className="text-white/25 text-[11px] font-[family-name:var(--font-inter)] text-center">
          © {new Date().getFullYear()} NJS Royale Beach Resort. All rights reserved.
        </p>

        <div className="flex gap-6">
          <a
            href="#"
            className="text-white/30 hover:text-gold text-[11px] uppercase tracking-widest transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Privacy
          </a>
          <a
            href="#"
            className="text-white/30 hover:text-gold text-[11px] uppercase tracking-widest transition-colors duration-300 font-[family-name:var(--font-inter)]"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
