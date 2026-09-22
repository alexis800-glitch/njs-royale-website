// Millimetres on the A5 (148mm-wide) proof card, expressed in container units so
// the card scales on screen and prints at true size.
export const mm = (n: number) => `${((n * 100) / 148).toFixed(3)}cqw`

// A5 artwork geometry (148 × 210mm, no bleed). One continuous gold frame sits
// FRAME_INSET_MM inside the trim on all four sides; the photograph and the body
// both live inside it and are clipped to its inner edge, so the verticals run
// unbroken from top to bottom. All wording, the crest and the QR stay inside the
// frame, i.e. well within the print-safe area.
export const FRAME_INSET_MM = 8
export const FRAME_MM = 0.6
// Horizontal padding for copy, measured from the frame's inner edge.
export const COPY_X_MM = 6.4
// Draft slug: an absolutely positioned strip in the bottom margin, below the
// frame. It never affects the artwork's size or position.
export const SLUG_MM = 4.8
