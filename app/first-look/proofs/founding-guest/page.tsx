import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProofShell from '../ProofShell'
import DraftBand from '../DraftBand'
import { mm, COPY_X_MM, DRAFT_BAND_MM, SAFE_MM } from '../mm'
import { FIRST_LOOK_DISPLAY_URL, FIRST_LOOK_QR_SRC, PROOFS_ENABLED } from '@/lib/firstLook'

// VIP proof. Founding Guest benefits live only in this file — never on the public
// /first-look page — and the route is noindex and 404s on Production.
export const metadata: Metadata = {
  title: 'Draft Proof — NJS Founding Guest Invitation',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

const NAVY = '#0A1628'
const NAVY_DEEP = '#060E1A'
const GOLD = '#C9A84C'
const GOLD_LIGHT = '#E3CD8B'
const CREAM = '#F5F0E8'
const serif = 'var(--font-cormorant), serif'
const sans = 'var(--font-inter), sans-serif'

// The resort building at night, confined to the top ~70mm of the card so the
// 1920×1080 source prints at roughly 330 dpi. The lit building has its own clear
// window; the crest and title sit below it on the deepened navy.
const PHOTO = '/images/njs-hero-night-poster.jpg'

const STAY = [
  { label: 'Check-in', value: '23 July 2027' },
  { label: 'Check-out', value: '25 July 2027' },
  { label: 'Stay', value: 'Two nights for two people' },
]

const ITINERARY = [
  { date: '23 July', item: 'NJS Grand Opening celebration' },
  { date: '24 July', item: 'Breakfast for two' },
  { date: '25 July', item: 'Breakfast for two' },
]

const TERMS = ['By personal invitation', 'Non-transferable', 'Advance RSVP and invitation verification required']

const EDGE = mm(-1.6)
const CORNERS = [
  { top: EDGE, left: EDGE },
  { top: EDGE, right: EDGE },
  { bottom: EDGE, left: EDGE },
  { bottom: EDGE, right: EDGE },
]

function Ornament() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mm(2), margin: `${mm(2.2)} 0 0` }}>
      <span style={{ height: 1, width: mm(18), background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
      <span style={{ height: mm(1.1), width: mm(1.1), background: GOLD, transform: 'rotate(45deg)' }} />
      <span style={{ height: mm(1.8), width: mm(1.8), border: `1px solid ${GOLD}`, transform: 'rotate(45deg)' }} />
      <span style={{ height: mm(1.1), width: mm(1.1), background: GOLD, transform: 'rotate(45deg)' }} />
      <span style={{ height: 1, width: mm(18), background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
    </div>
  )
}

export default function FoundingGuestProof() {
  if (!PROOFS_ENABLED) notFound()

  return (
    <ProofShell
      title="NJS Founding Guest invitation (VIP)"
      other={{ href: '/first-look/proofs/standard', label: 'View standard proof' }}
    >
      <article
        className="proof-card relative mx-auto flex flex-col overflow-hidden rounded-sm shadow-2xl"
        style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, color: '#fff', fontFamily: sans }}
        aria-label="NJS Founding Guest invitation proof"
      >
        {/* ── Photographic header: the resort at night ── */}
        <header style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHOTO}
            alt=""
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: mm(70), objectFit: 'cover', objectPosition: '50% 35%' }}
          />
          {/* Light veil over sky and building; deep navy where the title sits, then
              seamless into the navy body. */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: mm(70.5),
              background: `linear-gradient(180deg, rgba(6,14,26,0.45) 0%, rgba(6,14,26,0.18) 30%, rgba(6,14,26,0.22) 55%, rgba(10,22,40,0.80) 78%, ${NAVY} 100%)`,
            }}
          />

          <DraftBand />

          <div style={{ position: 'relative', padding: `0 ${mm(COPY_X_MM)}`, textAlign: 'center' }}>
            {/* clear window onto the building — no wording over the photograph's subject */}
            <div aria-hidden="true" style={{ height: mm(32) }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/njs-logos/njs-crest-mark.png" alt="NJS Royale crest" style={{ width: mm(13), height: mm(13), margin: '0 auto' }} />
            <p style={{ marginTop: mm(1.8), color: GOLD_LIGHT, fontSize: mm(2.5), fontWeight: 600, letterSpacing: mm(0.8), textTransform: 'uppercase' }}>
              By Personal Invitation
            </p>
            <h2 style={{ fontFamily: serif, fontSize: mm(10.4), lineHeight: 1, marginTop: mm(1.2), fontWeight: 500, color: GOLD }}>
              NJS Founding Guest
            </h2>
            <Ornament />
          </div>
        </header>

        {/* ── Navy body ── */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: `${mm(3)} ${mm(COPY_X_MM)} ${mm(SAFE_MM + 5)}`,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: mm(2.6), color: 'rgba(255,255,255,0.88)' }}>
            Presented to{' '}
            <span style={{ display: 'inline-block', width: mm(52), borderBottom: `1px solid ${GOLD}` }}>&nbsp;</span>
          </p>

          <div style={{ fontFamily: serif, fontSize: mm(3.55), lineHeight: 1.3, color: CREAM }}>
            <p>
              You were among the distinguished guests who witnessed NJS Royale before its doors fully opened.
            </p>
            <p style={{ marginTop: mm(1.6) }}>
              It would be our honour to welcome you back for the unveiling of the complete NJS Royale Beach
              Resort on 23 July 2027.
            </p>
            <p style={{ marginTop: mm(1.6) }}>
              As our Founding Guest, you will receive a complimentary two-night stay for two, including the NJS
              Grand Opening celebration and breakfast on both mornings.
            </p>
          </div>

          <div>
            {/* Stay summary */}
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.3fr',
                border: `1px solid ${GOLD}`,
                background: 'rgba(201,168,76,0.10)',
              }}
            >
              {STAY.map((s, i) => (
                <div key={s.label} style={{ padding: `${mm(1.8)} ${mm(1.4)}`, borderLeft: i ? `1px solid ${GOLD}` : undefined }}>
                  <dt style={{ fontSize: mm(2.1), letterSpacing: mm(0.4), textTransform: 'uppercase', color: GOLD_LIGHT, fontWeight: 600 }}>{s.label}</dt>
                  <dd style={{ marginTop: mm(0.8), fontFamily: serif, fontSize: mm(3.9), lineHeight: 1.1, fontWeight: 600 }}>{s.value}</dd>
                </div>
              ))}
            </dl>

            {/* Itinerary */}
            <ul style={{ marginTop: mm(2), textAlign: 'left', fontSize: mm(2.8) }}>
              {ITINERARY.map((it) => (
                <li
                  key={it.date + it.item}
                  style={{ display: 'flex', gap: mm(3), padding: `${mm(0.9)} ${mm(1.4)}`, borderBottom: '1px solid rgba(255,255,255,0.16)' }}
                >
                  <span style={{ width: mm(16), flexShrink: 0, color: GOLD, fontWeight: 600 }}>{it.date}</span>
                  <span>{it.item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* QR + terms — QR in its own clean white panel with quiet space */}
          <div style={{ display: 'flex', alignItems: 'center', gap: mm(4), textAlign: 'left' }}>
            <div style={{ flexShrink: 0, background: '#fff', padding: mm(1.6), border: `1px solid ${GOLD}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FIRST_LOOK_QR_SRC} alt={`QR code linking to ${FIRST_LOOK_DISPLAY_URL}`} style={{ width: mm(23), height: mm(23), display: 'block' }} />
            </div>
            <div style={{ minWidth: 0, fontSize: mm(2.55), lineHeight: 1.45 }}>
              <ul>
                {TERMS.map((t) => (
                  <li key={t} style={{ display: 'flex', alignItems: 'baseline', gap: mm(1.4) }}>
                    <span aria-hidden="true" style={{ flexShrink: 0, height: mm(1), width: mm(1), background: GOLD, transform: 'rotate(45deg) translateY(-15%)' }} />
                    {t}
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: mm(1.4), color: 'rgba(255,255,255,0.88)' }}>
                RSVP: <span style={{ color: GOLD_LIGHT, fontWeight: 600 }}>{FIRST_LOOK_DISPLAY_URL}</span>
              </p>
              <p style={{ marginTop: mm(0.8), color: 'rgba(255,255,255,0.88)' }}>
                Invitation code:{' '}
                <span style={{ display: 'inline-block', width: mm(22), borderBottom: `1px solid ${GOLD}` }}>&nbsp;</span>
              </p>
            </div>
          </div>

          <p style={{ fontSize: mm(2.1), letterSpacing: mm(0.45), textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
            NJS Royale Beach Resort · Ibeju-Lekki, Lagos
          </p>
        </div>

        {/* Gold frame with corner diamonds, on the print-safe line (decorative) */}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: `${mm(DRAFT_BAND_MM + 2)} ${mm(SAFE_MM)} ${mm(SAFE_MM)}`, border: `${mm(0.6)} solid ${GOLD}`, pointerEvents: 'none' }}
        >
          <div style={{ position: 'absolute', inset: mm(1.4), border: `${mm(0.2)} solid rgba(201,168,76,0.8)` }} />
          {CORNERS.map((pos, i) => (
            <span
              key={i}
              style={{ position: 'absolute', ...pos, height: mm(3.2), width: mm(3.2), background: GOLD, transform: 'rotate(45deg)' }}
            />
          ))}
        </div>
      </article>
    </ProofShell>
  )
}
