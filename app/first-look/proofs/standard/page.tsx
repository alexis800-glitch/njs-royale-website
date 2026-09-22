import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProofShell from '../ProofShell'
import DraftSlug from '../DraftSlug'
import ProofJourney from '../ProofJourney'
import { mm, COPY_X_MM, FRAME_INSET_MM, FRAME_MM } from '../mm'
import {
  CAMPAIGN,
  FIRST_ESCAPE,
  FIRST_LOOK_DISPLAY_URL,
  FIRST_LOOK_QR_SRC,
  GUEST_PRIVILEGES,
  INVITATION_VALIDITY,
  PRIVILEGES_HEADING,
  PROOFS_ENABLED,
} from '@/lib/firstLook'

export const metadata: Metadata = {
  title: 'Draft Proof — First Look Invitation',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

const NAVY = '#0A1628'
const GOLD = '#C9A84C'
const GOLD_LIGHT = '#E3CD8B' // gold for wording on the photograph
const GOLD_INK = '#7d621c' // gold dark enough for small text on cream
const CREAM = '#F5F0E8'
const serif = 'var(--font-cormorant), serif'
const sans = 'var(--font-inter), sans-serif'

// Pool at sunset, confined to the header band inside the frame so the
// 1920×1080 source prints at roughly 320 dpi.
const PHOTO = '/images/njs-hero-sunset-poster.jpg'

function Rule() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mm(2.5), margin: `${mm(1.8)} 0` }}>
      <span style={{ height: 1, width: mm(14), background: GOLD }} />
      <span style={{ height: mm(1.3), width: mm(1.3), background: GOLD, transform: 'rotate(45deg)' }} />
      <span style={{ height: 1, width: mm(14), background: GOLD }} />
    </div>
  )
}

export default function StandardInvitationProof() {
  if (!PROOFS_ENABLED) notFound()

  return (
    <ProofShell
      title="Standard First Look invitation"
      other={{ href: '/first-look/proofs/founding-guest', label: 'View Founding Guest proof' }}
    >
      <article
        className="proof-card relative mx-auto flex flex-col overflow-hidden rounded-sm shadow-2xl"
        style={{ background: CREAM, color: NAVY, fontFamily: sans }}
        aria-label="Standard First Look invitation proof"
      >
        {/* One continuous gold frame. Photograph and body are clipped to its inner
            edge, so both verticals run unbroken from top to bottom. */}
        <div
          style={{
            position: 'absolute',
            inset: mm(FRAME_INSET_MM),
            border: `${mm(FRAME_MM)} solid ${GOLD}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── Photographic header: campaign title over the sunset pool ── */}
          <header style={{ position: 'relative', color: '#fff' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTO}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '38% 55%' }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(70% 60% at 50% 55%, rgba(10,22,40,0.50) 0%, rgba(10,22,40,0) 100%), linear-gradient(180deg, rgba(10,22,40,0.62) 0%, rgba(10,22,40,0.58) 40%, rgba(10,22,40,0.78) 80%, rgba(10,22,40,0.90) 100%)',
              }}
            />

            <div style={{ position: 'relative', padding: `${mm(4)} ${mm(COPY_X_MM)} ${mm(4.5)}`, textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/njs-logos/njs-crest-mark.png" alt="NJS Royale crest" style={{ width: mm(12.5), height: mm(12.5), margin: '0 auto' }} />
              <p style={{ marginTop: mm(2.4), color: GOLD_LIGHT, fontSize: mm(2.5), fontWeight: 600, letterSpacing: mm(0.7), textTransform: 'uppercase' }}>
                Exclusive First Look Invitation
              </p>
              <h2 style={{ fontFamily: serif, fontSize: mm(9.4), lineHeight: 1.02, marginTop: mm(1.6), fontWeight: 500 }}>
                NJS Royale
                <span style={{ display: 'block', color: GOLD_LIGHT, fontStyle: 'italic' }}>The First Escape</span>
              </h2>
              <Rule />
              <p style={{ fontSize: mm(2.75), fontWeight: 600, letterSpacing: mm(0.45), textTransform: 'uppercase' }}>
                {CAMPAIGN.tagline}
              </p>
              <p style={{ marginTop: mm(2.4), fontFamily: serif, fontSize: mm(3.9), lineHeight: 1.3, color: CREAM }}>
                Thank you for joining us for the First Look of NJS Royale Beach Resort. What you experienced
                was only the beginning.
              </p>
            </div>
            {/* gold seam between photograph and cream */}
            <div aria-hidden="true" style={{ position: 'relative', height: mm(0.6), background: GOLD }} />
          </header>

          {/* ── Cream body ── */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: `${mm(3.4)} ${mm(COPY_X_MM)} ${mm(3.6)}`,
              textAlign: 'center',
            }}
          >
            {/* First Look → Phase I → Grand Opening */}
            <ProofJourney current="phase-one" ink={NAVY} accent={GOLD_INK} rule={GOLD} />

            {/* Phase I Opening */}
            <div>
              <p style={{ fontSize: mm(2.5), fontWeight: 600, letterSpacing: mm(0.6), textTransform: 'uppercase', color: GOLD_INK }}>
                {FIRST_ESCAPE.label}
              </p>
              <p style={{ marginTop: mm(1), fontFamily: serif, fontSize: mm(8.4), lineHeight: 1, fontWeight: 600 }}>{FIRST_ESCAPE.date}</p>
              <p style={{ marginTop: mm(1.4), fontFamily: serif, fontSize: mm(3.8), lineHeight: 1.28 }}>{FIRST_ESCAPE.intro}</p>
              <p style={{ marginTop: mm(1.1), fontSize: mm(2.9), fontWeight: 500 }}>{FIRST_ESCAPE.doors}</p>
            </div>

            {/* Privileges */}
            <div>
              <p style={{ fontSize: mm(2.4), fontWeight: 600, letterSpacing: mm(0.5), textTransform: 'uppercase', color: GOLD_INK }}>
                {PRIVILEGES_HEADING}
              </p>
              <ul style={{ marginTop: mm(1.6), display: 'inline-block', textAlign: 'left', fontSize: mm(2.9), fontWeight: 500, lineHeight: 1.5 }}>
                {GUEST_PRIVILEGES.map((p) => (
                  <li key={p} style={{ display: 'flex', alignItems: 'center', gap: mm(1.6) }}>
                    <span aria-hidden="true" style={{ flexShrink: 0, height: mm(1.2), width: mm(1.2), background: GOLD, transform: 'rotate(45deg)' }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* QR + RSVP — clean white panel on cream, never over the photograph */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: mm(4),
                textAlign: 'left',
                background: '#fff',
                border: `1px solid ${GOLD}`,
                padding: mm(1.8),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FIRST_LOOK_QR_SRC} alt={`QR code linking to ${FIRST_LOOK_DISPLAY_URL}`} style={{ flexShrink: 0, width: mm(24), height: mm(24), display: 'block' }} />
              <div style={{ minWidth: 0, fontSize: mm(2.6), lineHeight: 1.4 }}>
                <p style={{ fontWeight: 600, fontSize: mm(3), textTransform: 'uppercase', letterSpacing: mm(0.3) }}>RSVP</p>
                <p style={{ marginTop: mm(0.4), fontWeight: 700, color: GOLD_INK, fontSize: mm(2.8) }}>{INVITATION_VALIDITY}</p>
                <p style={{ marginTop: mm(0.8) }}>Scan the code or visit</p>
                <p style={{ fontWeight: 600, color: GOLD_INK }}>{FIRST_LOOK_DISPLAY_URL}</p>
                <p style={{ marginTop: mm(1.2) }}>
                  Invitation code:{' '}
                  <span style={{ display: 'inline-block', width: mm(26), borderBottom: `1px solid ${NAVY}` }}>&nbsp;</span>
                </p>
                <p style={{ marginTop: mm(1), fontWeight: 600 }}>Invitation verification required.</p>
              </div>
            </div>

            <div>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: mm(3.9), lineHeight: 1.3 }}>
                Thank you for being part of the beginning of our story.
                <br />
                We look forward to welcoming you back.
              </p>
              <p style={{ marginTop: mm(1.8), fontSize: mm(2.1), letterSpacing: mm(0.45), textTransform: 'uppercase', color: 'rgba(10,22,40,0.72)' }}>
                NJS Royale Beach Resort · Ibeju-Lekki, Lagos
              </p>
            </div>
          </div>
        </div>

        <DraftSlug />
      </article>
    </ProofShell>
  )
}
