import Link from 'next/link'
import PrintButton from './PrintButton'

// Screen/print frame for an A5 invitation proof. On screen the card scales to the
// viewport; everything inside is sized in container units (1mm ≈ 0.6757cqw) so the
// printed A5 sheet and the on-screen proof are the same composition.
export default function ProofShell({
  title,
  other,
  children,
}: {
  title: string
  other: { href: string; label: string }
  children: React.ReactNode
}) {
  return (
    <main className="proof-page min-h-screen bg-[#1b2433] px-4 py-6 sm:py-10">
      {/* Page size: A5 at the nearest whole-pixel size Chrome can print (560 × 794px,
          148.2 × 210.1mm). An exact 148mm page is rounded up to 560px in the PDF,
          which would leave an uncovered sliver at the right edge. */}
      <style>{`
        @page { size: 560px 794px; margin: 0; }
        .proof-card { container-type: inline-size; width: min(148mm, 100%); aspect-ratio: 148 / 210;
          -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          html, body, .proof-page { background: #fff !important; padding: 0 !important; margin: 0 !important; }
          .proof-toolbar { display: none !important; }
          .proof-card { width: 100vw; height: 100vh; aspect-ratio: auto; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
          .proof-card ~ .proof-card { break-before: page; }
        }
      `}</style>

      <div className="proof-toolbar mx-auto mb-6 flex max-w-[148mm] flex-wrap items-center justify-between gap-3 text-white/80 text-[13px] font-[family-name:var(--font-inter)]">
        <div className="min-w-0">
          <p className="text-gold text-[10px] uppercase tracking-[3px]">Draft proof · A5 portrait</p>
          <h1 className="text-white text-base font-medium">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={other.href}
            className="inline-flex min-h-[44px] items-center rounded-md border border-white/20 px-4 hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {other.label}
          </Link>
          <PrintButton />
        </div>
      </div>

      {children}
    </main>
  )
}
