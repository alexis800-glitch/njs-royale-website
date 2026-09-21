import { mm, DRAFT_BAND_MM, SAFE_MM } from './mm'
import { DRAFT_PROOF_LABEL } from '@/lib/firstLook'

// Full-width red proof marker. The colour field runs to the trim; the wording is
// vertically centred in a band tall enough to keep it inside the print-safe area.
export default function DraftBand() {
  return (
    <p
      style={{
        position: 'relative',
        zIndex: 2,
        height: mm(DRAFT_BAND_MM),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${mm(SAFE_MM)} ${mm(SAFE_MM + 4)} ${mm(SAFE_MM - 3)}`,
        background: '#8B1E1E',
        color: '#fff',
        textAlign: 'center',
        fontSize: mm(2.6),
        lineHeight: 1.2,
        fontWeight: 600,
        letterSpacing: mm(0.35),
        textTransform: 'uppercase',
      }}
    >
      {DRAFT_PROOF_LABEL}
    </p>
  )
}
