// NJS Royale — the confirmed two-phase opening.
//
// One source of truth, because the same facts appear in the page sections, the
// announcement ribbon, the opening timeline, the metadata and the social cards.
// When they were written out separately they drifted: Phase One was described in
// several places as the second-floor swimming-pool area alone, which understated
// it considerably.
//
// PHASE ONE IS NOT LIMITED TO THE POOL AREA. On 12 December 2026 the resort opens
// to guests: the venues below, the lounges, the entertainment and the beach. Only
// guest rooms and accommodation wait for Phase Two.
//
// Keep factual descriptions of the second-floor pool where a section is describing
// that facility — it is part of Phase One, simply not the whole of it.

export const PHASE_ONE_DATE = 'December 12, 2026'
export const PHASE_ONE_ISO = '2026-12-12'

export const PHASE_TWO_DATE = 'July 23, 2027'
export const PHASE_TWO_ISO = '2027-07-23'

/** The principal message. Use it, or a close paraphrase, wherever the opening is summarised. */
export const OPENING_MESSAGE =
  'NJS Royale opens December 12, 2026. Come experience the resort before the rooms open.'

/** What opens on December 12, 2026. */
export const PHASE_ONE_INCLUDES = [
  'Yahweh Heights',
  'Voyage',
  'Royale Horizon',
  'Resort lounges',
  'Live entertainment',
  'The private beach',
] as const

/**
 * What opens on July 23, 2027.
 *
 * Deliberately *not* called the "full resort opening": Phase Two opens the guest
 * rooms and accommodation, and calling it the full opening implied that little of
 * the resort was available before it.
 */
export const PHASE_TWO_SCOPE = 'Guest rooms and accommodation'
