// Millimetres on the A5 (148mm-wide) proof card, expressed in container units so
// the card scales on screen and prints at true size.
export const mm = (n: number) => `${((n * 100) / 148).toFixed(3)}cqw`
