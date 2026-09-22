'use client'

import { useEffect, useState } from 'react'
import { mm, SLUG_MM } from './mm'
import { DRAFT_PROOF_LABEL } from '@/lib/firstLook'

// Restrained proof marker in the bottom margin, beneath the framed artwork.
// Absolutely positioned on a neutral strip, so it never moves the artwork.
// Review exports show it; final distribution exports are made from the same page
// with `?final=1`, which removes it (after hydration, so review renders are
// unchanged and there is no hydration mismatch).
export default function DraftSlug() {
  const [final, setFinal] = useState(false)
  useEffect(() => setFinal(new URLSearchParams(window.location.search).get('final') === '1'), [])
  if (final) return null

  return (
    <p
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: mm(SLUG_MM),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ECEAE6',
        color: '#8A4B4B',
        fontFamily: 'var(--font-inter), sans-serif',
        fontSize: mm(1.9),
        fontWeight: 600,
        letterSpacing: mm(0.45),
        textTransform: 'uppercase',
        lineHeight: 1,
      }}
    >
      {DRAFT_PROOF_LABEL}
    </p>
  )
}
