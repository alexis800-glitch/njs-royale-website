import { CAMPAIGN, JOURNEY, type JourneyStage } from '@/lib/firstLook'

// First Look → Phase I → Grand Opening. Stacked as a compact timeline on phones,
// a single row from sm up. `current` is highlighted and marked aria-current.
export default function CampaignJourney({
  current,
  showTagline = true,
}: {
  current: JourneyStage
  showTagline?: boolean
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {showTagline && (
        <p className="text-white text-[12px] sm:text-sm uppercase tracking-[2.5px] sm:tracking-[3.5px] font-medium text-balance font-[family-name:var(--font-inter)]">
          {CAMPAIGN.tagline}
        </p>
      )}

      <ol
        aria-label="The NJS Royale journey"
        className="mx-auto mt-6 flex max-w-[260px] flex-col items-stretch gap-0 sm:max-w-none sm:flex-row sm:items-center sm:justify-center"
      >
        {JOURNEY.map((stage, i) => {
          const isCurrent = stage.id === current
          return (
            <li key={stage.id} aria-current={isCurrent ? 'step' : undefined} className="flex flex-col items-center sm:flex-row">
              {i > 0 && (
                <span aria-hidden="true" className="py-1 text-gold text-lg leading-none sm:px-4 sm:py-0">
                  <span className="sm:hidden">↓</span>
                  <span className="hidden sm:inline">→</span>
                </span>
              )}
              <div
                className={`w-full rounded-lg border px-5 py-3 sm:w-auto sm:min-w-[150px] ${
                  isCurrent ? 'border-gold bg-gold/15' : 'border-white/20 bg-white/[0.03]'
                }`}
              >
                <p className={`text-[11px] uppercase tracking-[2.5px] font-semibold font-[family-name:var(--font-inter)] ${isCurrent ? 'text-gold' : 'text-white/80'}`}>
                  {stage.label}
                </p>
                <p className="mt-1 font-[family-name:var(--font-cormorant)] text-white text-xl sm:text-[22px] leading-tight">
                  {stage.dateLong}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
