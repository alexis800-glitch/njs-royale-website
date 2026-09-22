import type { CSSProperties } from 'react'
import DraftSlug from '../DraftSlug'
import ProofJourney from '../ProofJourney'
import { mm, COPY_X_MM, FRAME_INSET_MM, FRAME_MM } from '../mm'
import { CAMPAIGN } from '@/lib/firstLook'
import { FOUNDING_GUEST, FOUNDING_GUEST_INVITATION, STAY_BENEFIT, TURN_OVER } from '@/lib/foundingGuest'

// Shared pieces of the Founding Guest invitation proof: palette, frame, ornament and
// the front side. The front takes only its photograph as input, so alternative
// photographs can be compared in an otherwise identical layout.

export const NAVY = '#0A1628'
export const NAVY_DEEP = '#060E1A'
export const GOLD = '#C9A84C'
export const GOLD_LIGHT = '#E3CD8B'
export const CREAM = '#F5F0E8'
export const serif = 'var(--font-cormorant), serif'
export const sans = 'var(--font-inter), sans-serif'

export type FrontPhoto = { src: string; style: CSSProperties }

// Approved front photograph: Higgsfield asset 61b3f34b (entrance-side blue hour,
// original 2752×1536, 23 August 2026; stored as a full-resolution q92 JPEG).
// Cropped in layout — about 2180px across the 130.8mm frame (≈420 dpi) — centred between
// the façade and entrance canopy, full roofline and both ends of the hotel in view,
// the canopy and roundabout sitting just above the crest. Clipped to a 60mm band.
export const APPROVED_FRONT_PHOTO: FrontPhoto = {
  src: '/images/njs-founding-guest-front-entrance-blue-hour.jpg',
  style: { position: 'absolute', width: '126.2%', left: '-13.16%', top: mm(-25), maxWidth: 'none' },
}

const EDGE = mm(FRAME_MM / 2 - 1.6)
const CORNERS = [
  { top: EDGE, left: EDGE },
  { top: EDGE, right: EDGE },
  { bottom: EDGE, left: EDGE },
  { bottom: EDGE, right: EDGE },
]

export function Ornament() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mm(2), margin: `${mm(2)} 0 0` }}>
      <span style={{ height: 1, width: mm(18), background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
      <span style={{ height: mm(1.1), width: mm(1.1), background: GOLD, transform: 'rotate(45deg)' }} />
      <span style={{ height: mm(1.8), width: mm(1.8), border: `1px solid ${GOLD}`, transform: 'rotate(45deg)' }} />
      <span style={{ height: mm(1.1), width: mm(1.1), background: GOLD, transform: 'rotate(45deg)' }} />
      <span style={{ height: 1, width: mm(18), background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
    </div>
  )
}

// One A5 side: navy card, one continuous gold frame with corner diamonds, and the
// draft slug beneath the artwork. Both sides share it, so the frame geometry is
// identical front and back. Content is clipped to the frame's inner edge.
export function Side({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <article
      className="proof-card relative mx-auto flex flex-col overflow-hidden rounded-sm shadow-2xl"
      style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, color: '#fff', fontFamily: sans }}
      aria-label={label}
    >
      <div style={{ position: 'absolute', inset: mm(FRAME_INSET_MM) }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `${mm(FRAME_MM)} solid ${GOLD}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>

        {CORNERS.map((pos, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{ position: 'absolute', ...pos, height: mm(3.2), width: mm(3.2), background: GOLD, transform: 'rotate(45deg)' }}
          />
        ))}
      </div>

      <DraftSlug />
    </article>
  )
}

// Screen-only caption above each side (hidden in print with the toolbar).
export function SideCaption({ first, children }: { first?: boolean; children: React.ReactNode }) {
  return (
    <p
      className={`proof-toolbar mx-auto mb-2 max-w-[148mm] text-gold text-[10px] uppercase tracking-[3px] font-[family-name:var(--font-inter)] ${first ? '' : 'mt-10'}`}
    >
      {children}
    </p>
  )
}

// Page 1 — the Founding Guest front.
export function FrontSide({ photo, label = 'NJS Royale Founding Guest invitation — front' }: { photo: FrontPhoto; label?: string }) {
  return (
    <Side label={label}>
      {/* ── Photographic header: the resort at night ── */}
      <header style={{ position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: mm(60), overflow: 'hidden' }}>
          <img src={photo.src} alt="" style={photo.style} />
        </div>
        {/* Light veil over sky and building; deepening from just below the entrance so
            the car park recedes behind the crest and title, then seamless into the
            navy body. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: mm(60.5),
            background: `linear-gradient(180deg, rgba(6,14,26,0.45) 0%, rgba(6,14,26,0.18) 30%, rgba(6,14,26,0.34) 48%, rgba(10,22,40,0.88) 72%, ${NAVY} 100%)`,
          }}
        />

        <div style={{ position: 'relative', padding: `0 ${mm(COPY_X_MM)}`, textAlign: 'center' }}>
          {/* clear window onto the building — no wording over the photograph's subject */}
          <div aria-hidden="true" style={{ height: mm(30) }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/njs-logos/njs-crest-mark.png" alt="NJS Royale crest" style={{ width: mm(12), height: mm(12), margin: '0 auto' }} />
          <p style={{ marginTop: mm(1.6), color: GOLD_LIGHT, fontSize: mm(2.5), fontWeight: 600, letterSpacing: mm(0.8), textTransform: 'uppercase' }}>
            {FOUNDING_GUEST.kicker}
          </p>
          <h2 style={{ fontFamily: serif, fontSize: mm(8.6), lineHeight: 1.05, marginTop: mm(1.2), fontWeight: 500, color: GOLD }}>
            {FOUNDING_GUEST.title}
          </h2>
          <Ornament />
        </div>
      </header>

      {/* ── Navy body: note → journey → invitation → the stay → turn over ── */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: `${mm(3.2)} ${mm(COPY_X_MM + 2)} ${mm(6)}`,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: mm(2.8), fontWeight: 600, color: GOLD_LIGHT }}>{FOUNDING_GUEST.registeredNote}</p>

        {/* Shared journey */}
        <div>
          <p style={{ fontSize: mm(2.4), fontWeight: 600, letterSpacing: mm(0.45), textTransform: 'uppercase', color: '#fff' }}>
            {CAMPAIGN.tagline}
          </p>
          <div style={{ marginTop: mm(2) }}>
            <ProofJourney current="grand-opening" ink="rgba(255,255,255,0.9)" accent={GOLD_LIGHT} rule="rgba(201,168,76,0.6)" />
          </div>
        </div>

        <p className="text-balance" style={{ fontFamily: serif, fontSize: mm(4), lineHeight: 1.35, color: CREAM }}>{FOUNDING_GUEST_INVITATION}</p>

        {/* The benefit, as one block */}
        <div style={{ border: `1px solid ${GOLD}`, background: 'rgba(201,168,76,0.10)', padding: `${mm(4)} ${mm(5)}` }}>
          <p style={{ fontSize: mm(2.6), fontWeight: 600, letterSpacing: mm(0.55), textTransform: 'uppercase', color: GOLD_LIGHT }}>
            {STAY_BENEFIT.heading}
          </p>
          <p style={{ marginTop: mm(1.6), fontFamily: serif, fontSize: mm(7), lineHeight: 1.05, fontWeight: 600 }}>{STAY_BENEFIT.dates}</p>
          <p className="text-balance" style={{ marginTop: mm(2), fontSize: mm(2.8), lineHeight: 1.4, color: 'rgba(255,255,255,0.92)' }}>{STAY_BENEFIT.includes}</p>
          <p style={{ marginTop: mm(1.4), fontSize: mm(2.6), color: 'rgba(255,255,255,0.85)' }}>{FOUNDING_GUEST.categoryNote}</p>
        </div>

        {/* Discreet turn-over cue */}
        <div>
          <div aria-hidden="true" style={{ margin: `0 auto ${mm(2.2)}`, height: 1, width: mm(36), background: 'rgba(201,168,76,0.6)' }} />
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: mm(3.5), color: GOLD_LIGHT }}>{TURN_OVER}</p>
        </div>
      </div>
    </Side>
  )
}
