/** @type {import('next').NextConfig} */

// Security headers.
//
// Strict-Transport-Security is deliberately absent: Vercel already serves
// `max-age=63072000` on this domain, and setting it here would duplicate it.
//
// The Content-Security-Policy is REPORT-ONLY. Nothing is blocked. It is here to
// collect violations so the policy can be tightened with evidence before it is
// enforced. Browsers log violations to the console; no collection endpoint is
// configured yet.
//
// Sources were taken from an inventory of what the site actually requests:
//   self                      pages, scripts, styles, images, fonts, videos
//   connect.facebook.net      Meta Pixel script, loaded only after consent
//   www.facebook.com          Meta Pixel image and beacon, after consent
//   www.google.com            the click-to-activate Google Maps iframe
//   maps.gstatic.com          map tiles and assets
//   maps.googleapis.com       map data requests
//
// `script-src` carries 'unsafe-inline' because Next.js emits inline bootstrap
// and flight-data scripts (38 of them on the homepage). The nonce alternative
// requires middleware, which would add an attack surface this site does not
// currently have and would force every page out of static rendering.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.facebook.com https://www.google.com https://maps.gstatic.com https://maps.googleapis.com",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self' https://www.facebook.com https://connect.facebook.net https://maps.googleapis.com",
  "frame-src https://www.google.com",
  // `upgrade-insecure-requests` is intentionally omitted: browsers ignore it in a
  // report-only policy and log a notice on every page load. Add it when the
  // policy moves to enforcing.
].join('; ')

const securityHeaders = [
  // Never let a browser second-guess a declared Content-Type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send the full URL to ourselves, origin only cross-site, nothing over http.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Clickjacking. frame-ancestors above is the modern equivalent; this covers
  // browsers that still honour the older header.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // The site asks for none of these. Fullscreen is left alone: the map uses it.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
]

const nextConfig = {
  images: {
    domains: [],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = nextConfig
