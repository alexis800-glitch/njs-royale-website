// Meta Pixel global. Declared here so the Pixel can be used without `any`.
interface Window {
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: unknown }
  _fbq?: unknown
}
