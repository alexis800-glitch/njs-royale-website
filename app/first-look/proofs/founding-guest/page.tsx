import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProofShell from '../ProofShell'
import { mm, COPY_X_MM } from '../mm'
import { PROOFS_ENABLED } from '@/lib/firstLook'
import { APPROVED_FRONT_PHOTO, CREAM, FrontSide, GOLD, GOLD_LIGHT, NAVY_DEEP, Ornament, Side, SideCaption, serif } from './parts'
import {
  ACTIVATION_HEADING,
  CONDITIONS_CARD,
  FOUNDING_GUEST_DISPLAY_URL,
  FOUNDING_GUEST_QR_SRC,
  REGISTRATION_DEADLINE_SENTENCE,
} from '@/lib/foundingGuest'

// VIP proof: a two-sided A5 invitation. Page 1 (front) invites; page 2 (back)
// carries the QR, activation details and conditions. Founding Guest benefits never
// appear on the public /first-look page; this route is noindex and 404s on
// Production.
export const metadata: Metadata = {
  title: 'Draft Proof — NJS Royale Founding Guest Invitation',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

// On the back the photograph fades out within the top BACK_PHOTO_MM of the frame,
// ending above the QR panel.
const BACK_PHOTO_MM = 50
// Back: the elevated entrance-side night view (Higgsfield asset 9638c541, original
// 2752×1536, stored as a full-resolution q92 JPEG). Cropped in layout — about 1780px
// across the frame (≈345 dpi) — around the illuminated hotel and entrance.
const BACK_PHOTO = '/images/njs-founding-guest-night-entrance.jpg'
// Solid navy inside the back's frame; the photograph's veil ends on exactly this
// colour, so the fade has no seam.
const BACK_FIELD = '#0B1424'

export default function FoundingGuestProof() {
  if (!PROOFS_ENABLED) notFound()

  return (
    <ProofShell
      title="NJS Royale Founding Guest invitation (VIP) · two-sided"
      other={{ href: '/first-look/proofs/standard', label: 'View standard proof' }}
    >
      {/* Print background = the card's own navy, so the ~0.15mm of page Chrome adds
          below the artwork (whole-pixel page rounding) never shows as a white hairline. */}
      <style>{`@media print { html, body, .proof-page { background: ${NAVY_DEEP} !important; } }`}</style>

      {/* ════════════ Page 1 — Front ════════════ */}
      <SideCaption first>Page 1 · Front</SideCaption>
      <FrontSide photo={APPROVED_FRONT_PHOTO} />

      {/* ════════════ Page 2 — Back ════════════ */}
      <SideCaption>Page 2 · Back</SideCaption>
      <Side label="NJS Royale Founding Guest invitation — back">
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: BACK_FIELD }} />
        {/* Subtle façade: the illuminated hotel and entrance sit behind the crest and
            heading under a controlled navy veil, which fades to solid navy before the
            QR panel, so the QR quiet zone and the conditions stay on plain dark navy. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: mm(BACK_PHOTO_MM),
            overflow: 'hidden',
          }}
        >
          {/* The photograph is clipped at 80% of the box, where the veil above it is
              already fully opaque, so its edge can never show as a hairline. */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80%', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BACK_PHOTO}
              alt=""
              style={{ position: 'absolute', width: '154.6%', left: '-49.4%', top: mm(-26.4), maxWidth: 'none' }}
            />
          </div>
          {/* Veil (prints reliably, unlike CSS masks): strong behind the crest and
              heading, then opaque by the box's foot, ending on BACK_FIELD. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                `linear-gradient(180deg, rgba(6,14,26,0.44) 0%, rgba(6,14,26,0.50) 40%, ${BACK_FIELD}E6 66%, ${BACK_FIELD} 78%, ${BACK_FIELD} 100%)`,
            }}
          />
        </div>
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: `${mm(9)} ${mm(COPY_X_MM + 4)} ${mm(10)}`,
            textAlign: 'center',
          }}
        >
          {/* Heading */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/njs-logos/njs-crest-mark.png" alt="NJS Royale crest" style={{ width: mm(12.5), height: mm(12.5), margin: '0 auto' }} />
            <h2 style={{ marginTop: mm(3), fontFamily: serif, fontSize: mm(7.4), lineHeight: 1.08, fontWeight: 500, color: GOLD }}>
              {ACTIVATION_HEADING}
            </h2>
            <Ornament />
          </div>

          {/* QR in its own clean white panel, with the printed destination */}
          <div>
            <div style={{ display: 'inline-block', background: '#fff', padding: mm(2), border: `1px solid ${GOLD}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FOUNDING_GUEST_QR_SRC} alt={`QR code linking to ${FOUNDING_GUEST_DISPLAY_URL}`} style={{ width: mm(30), height: mm(30), display: 'block' }} />
            </div>
            <p style={{ marginTop: mm(2.6), fontSize: mm(2.6), color: 'rgba(255,255,255,0.9)' }}>Scan the code or visit</p>
            <p style={{ marginTop: mm(0.6), fontSize: mm(3.2), fontWeight: 600, color: GOLD_LIGHT }}>{FOUNDING_GUEST_DISPLAY_URL}</p>
            <p style={{ marginTop: mm(3.4), fontSize: mm(2.9), color: 'rgba(255,255,255,0.9)' }}>
              Invitation code:{' '}
              <span style={{ display: 'inline-block', width: mm(44), borderBottom: `1px solid ${GOLD}` }}>&nbsp;</span>
            </p>
          </div>

          {/* Deadline */}
          <div style={{ margin: '0 auto', padding: `${mm(2.6)} ${mm(7)}`, border: `1px solid ${GOLD}`, background: 'rgba(201,168,76,0.10)' }}>
            <p style={{ fontSize: mm(2.4), letterSpacing: mm(0.55), textTransform: 'uppercase', color: GOLD_LIGHT, fontWeight: 600 }}>
              Registration deadline
            </p>
            <p style={{ marginTop: mm(1.2), fontFamily: serif, fontSize: mm(4.6), lineHeight: 1.2, fontWeight: 600 }}>
              {REGISTRATION_DEADLINE_SENTENCE}
            </p>
          </div>

          {/* Important conditions — heading aligned with the text column */}
          <div style={{ textAlign: 'left', paddingLeft: mm(3.1) }}>
            <p style={{ fontSize: mm(2.4), letterSpacing: mm(0.55), textTransform: 'uppercase', color: GOLD_LIGHT, fontWeight: 600 }}>
              Important conditions
            </p>
            <ul style={{ marginTop: mm(2.4), marginLeft: mm(-3.1), fontSize: mm(3), lineHeight: 1.42, color: CREAM }}>
              {CONDITIONS_CARD.map((c, i) => (
                <li key={c} style={{ display: 'flex', alignItems: 'baseline', gap: mm(2), marginTop: i ? mm(1.2) : 0 }}>
                  <span aria-hidden="true" style={{ flexShrink: 0, height: mm(1.1), width: mm(1.1), background: GOLD, transform: 'rotate(45deg) translateY(-20%)' }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Side>
    </ProofShell>
  )
}
