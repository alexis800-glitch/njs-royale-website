import { mm } from './mm'
import { JOURNEY, type JourneyStage } from '@/lib/firstLook'

// Compact First Look → Phase I → Grand Opening row for the A5 proofs. The current
// stage is set in the accent colour; the others stay legible at full contrast.
// `small` is the footer treatment used on the Founding Guest invitation back.
export default function ProofJourney({
  current,
  ink,
  accent,
  rule,
  small = false,
}: {
  current: JourneyStage
  ink: string
  accent: string
  rule: string
  small?: boolean
}) {
  const k = small ? 0.92 : 1
  return (
    <ol
      aria-label="The NJS Royale journey"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: mm(2.4 * k),
        fontFamily: 'var(--font-inter), sans-serif',
        textAlign: 'center',
        borderTop: `1px solid ${rule}`,
        borderBottom: `1px solid ${rule}`,
        padding: `${mm(1.5 * k)} 0`,
      }}
    >
      {JOURNEY.map((stage, i) => {
        const on = stage.id === current
        return (
          <li key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: mm(2.4 * k) }}>
            {i > 0 && (
              <span aria-hidden="true" style={{ color: accent, fontSize: mm(3 * k), lineHeight: 1 }}>
                →
              </span>
            )}
            <span style={{ display: 'block' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: mm(2.2 * k),
                  fontWeight: 600,
                  letterSpacing: mm(0.35),
                  textTransform: 'uppercase',
                  color: on ? accent : ink,
                }}
              >
                {stage.label}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: mm(0.5 * k),
                  fontSize: mm(2.5 * k),
                  fontWeight: on ? 700 : 500,
                  letterSpacing: mm(0.2),
                  textTransform: 'uppercase',
                  color: on ? accent : ink,
                }}
              >
                {stage.date}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
