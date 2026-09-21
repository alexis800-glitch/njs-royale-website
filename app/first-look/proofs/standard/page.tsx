import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProofShell from '../ProofShell'
import { mm } from '../mm'
import {
  CAMPAIGN,
  DRAFT_PROOF_LABEL,
  FIRST_ESCAPE,
  FIRST_LOOK_DISPLAY_URL,
  FIRST_LOOK_QR_SRC,
  GRAND_OPENING,
  GUEST_PRIVILEGES,
  PROOFS_ENABLED,
} from '@/lib/firstLook'

export const metadata: Metadata = {
  title: 'Draft Proof — First Look Invitation',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

const NAVY = '#0A1628'
const GOLD = '#C9A84C'
const GOLD_INK = '#8a6d22' // gold dark enough for small text on cream
const CREAM = '#F5F0E8'
const serif = 'var(--font-cormorant), serif'
const sans = 'var(--font-inter), sans-serif'

function Rule() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mm(2.5), margin: `${mm(2.6)} 0` }}>
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
        {/* Draft marker — printed on the proof */}
        <p
          style={{
            background: '#8B1E1E',
            color: '#fff',
            textAlign: 'center',
            fontSize: mm(2.6),
            fontWeight: 600,
            letterSpacing: mm(0.35),
            textTransform: 'uppercase',
            padding: `${mm(1.6)} ${mm(4)}`,
          }}
        >
          {DRAFT_PROOF_LABEL}
        </p>

        {/* Double gold frame */}
        <div
          style={{
            position: 'absolute',
            inset: `${mm(12)} ${mm(6)} ${mm(6)}`,
            border: `${mm(0.5)} solid ${GOLD}`,
            outline: `${mm(0.25)} solid ${GOLD}`,
            outlineOffset: mm(1.2),
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `${mm(8)} ${mm(14)} ${mm(12)}`, textAlign: 'center' }}>
          <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/njs-logos/njs-crest-mark.png" alt="NJS Royale crest" style={{ width: mm(19), height: mm(19), margin: '0 auto' }} />

          <p style={{ marginTop: mm(2.6), color: GOLD_INK, fontSize: mm(2.5), fontWeight: 600, letterSpacing: mm(0.7), textTransform: 'uppercase' }}>
            Exclusive First Look Invitation
          </p>
          <h2 style={{ fontFamily: serif, fontSize: mm(9.4), lineHeight: 1.02, marginTop: mm(1.8), fontWeight: 500 }}>
            NJS Royale
            <span style={{ display: 'block', color: GOLD_INK, fontStyle: 'italic' }}>The First Escape</span>
          </h2>
          <Rule />
          <p style={{ fontSize: mm(2.75), fontWeight: 600, letterSpacing: mm(0.45), textTransform: 'uppercase' }}>
            {CAMPAIGN.tagline}
          </p>
          </div>

          <div>
          <p style={{ marginTop: mm(3), fontFamily: serif, fontSize: mm(3.9), lineHeight: 1.3, color: 'rgba(10,22,40,0.85)' }}>
            Thank you for joining us for the First Look of NJS Royale Beach Resort. What you experienced
            was only the beginning.
          </p>

          {/* Date */}
          <div style={{ marginTop: mm(3.6), borderTop: `1px solid ${GOLD}`, borderBottom: `1px solid ${GOLD}`, padding: `${mm(2.6)} 0` }}>
            <p style={{ fontFamily: serif, fontSize: mm(8.4), lineHeight: 1, fontWeight: 600 }}>{FIRST_ESCAPE.date}</p>
            <p style={{ marginTop: mm(1.6), fontSize: mm(2.9), fontWeight: 500 }}>
              Doors open at 11:00 a.m.; the experience continues until midnight
            </p>
            <p style={{ marginTop: mm(1.2), fontSize: mm(2.75), color: GOLD_INK, fontWeight: 600 }}>
              This invitation admits the invitee and one guest
            </p>
          </div>

          {/* Privileges */}
          <p style={{ marginTop: mm(3), fontSize: mm(2.4), fontWeight: 600, letterSpacing: mm(0.5), textTransform: 'uppercase', color: GOLD_INK }}>
            Your First Look guest privilege
          </p>
          <ul style={{ marginTop: mm(1.4), display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: `${mm(0.8)} ${mm(3.2)}`, fontSize: mm(2.95), fontWeight: 500 }}>
            {GUEST_PRIVILEGES.map((p) => (
              <li key={p} style={{ display: 'flex', alignItems: 'center', gap: mm(1.2) }}>
                <span aria-hidden="true" style={{ height: mm(1.2), width: mm(1.2), background: GOLD, transform: 'rotate(45deg)' }} />
                {p}
              </li>
            ))}
          </ul>
          </div>

          <div>
          {/* QR + RSVP */}
          <div style={{ marginTop: mm(4), display: 'flex', alignItems: 'center', gap: mm(4), textAlign: 'left' }}>
            <div style={{ flexShrink: 0, background: '#fff', padding: mm(0.8), border: `1px solid ${GOLD}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FIRST_LOOK_QR_SRC} alt={`QR code linking to ${FIRST_LOOK_DISPLAY_URL}`} style={{ width: mm(25), height: mm(25), display: 'block' }} />
            </div>
            <div style={{ minWidth: 0, fontSize: mm(2.6), lineHeight: 1.45 }}>
              <p style={{ fontWeight: 600, fontSize: mm(3), textTransform: 'uppercase', letterSpacing: mm(0.3) }}>RSVP</p>
              <p>Scan the code or visit</p>
              <p style={{ fontWeight: 600, color: GOLD_INK }}>{FIRST_LOOK_DISPLAY_URL}</p>
              <p style={{ marginTop: mm(1.6) }}>
                Invitation code:{' '}
                <span style={{ display: 'inline-block', width: mm(26), borderBottom: `1px solid ${NAVY}` }}>&nbsp;</span>
              </p>
              <p style={{ marginTop: mm(1.2), fontWeight: 600 }}>Invitation verification required.</p>
            </div>
          </div>

          <p style={{ marginTop: mm(3.4), fontSize: mm(2.6), letterSpacing: mm(0.4), textTransform: 'uppercase', fontWeight: 600 }}>
            Grand Opening: <span style={{ color: GOLD_INK }}>{GRAND_OPENING.date}</span>
          </p>

          <p style={{ marginTop: mm(2.6), fontFamily: serif, fontStyle: 'italic', fontSize: mm(3.9), lineHeight: 1.3 }}>
            Thank you for being part of the beginning of our story.
            <br />
            We look forward to welcoming you back.
          </p>

          <p style={{ marginTop: mm(2.4), fontSize: mm(2.1), letterSpacing: mm(0.45), textTransform: 'uppercase', color: 'rgba(10,22,40,0.6)' }}>
            NJS Royale Beach Resort · Ibeju-Lekki, Lagos
          </p>
          </div>
        </div>
      </article>
    </ProofShell>
  )
}
