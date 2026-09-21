// Millimetres on the A5 (148mm-wide) proof card, expressed in container units so
// the card scales on screen and prints at true size.
export const mm = (n: number) => `${((n * 100) / 148).toFixed(3)}cqw`

// Print-safe layout (A5, 148 × 210mm, no bleed). Photographs and colour fields may
// run to the trim; all wording, the crest and the QR panel stay at least SAFE_MM
// inside it. The decorative gold frame sits on that line.
export const SAFE_MM = 7
// Red draft band: tall enough that its text sits wholly inside the safe area.
export const DRAFT_BAND_MM = 17
// Horizontal padding for copy (well inside the frame).
export const COPY_X_MM = 15
