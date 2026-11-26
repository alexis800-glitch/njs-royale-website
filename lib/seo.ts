// Shared SEO constants.
//
// These live here rather than in app/layout.tsx because more than one route
// needs them, and the alternative — restating them per page — is how the
// careers pages lost their Open Graph image in the first place.
//
// Next.js merges metadata objects SHALLOWLY. A child route that declares
// `openGraph` replaces the parent's `openGraph` wholesale: it does not inherit
// `images`, `type`, `siteName` or `locale` from the root. That is why
// /careers and every job page emitted og:title, og:description and og:url but
// no og:image. Spreading SITE_OPEN_GRAPH into a child's openGraph restores the
// inherited fields without restating them.

export const SITE_URL = 'https://www.njsbeachresort.com'
export const SITE_NAME = 'NJS Royale Beach Resort'

/**
 * The approved share image: /public/og.png, 1200x630, already in use on the
 * home page. No new artwork is introduced anywhere in this subsystem.
 */
export const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'NJS Royale Beach Resort, an oceanfront resort in Ibeju-Lekki, Lagos',
}

/** The Open Graph fields every page shares. Spread, then override title/description/url. */
export const SITE_OPEN_GRAPH = {
  // `as const` on this field only. Next discriminates its OpenGraph union on
  // `type`, so it must stay the literal 'website'; `as const` on the whole
  // object would instead make `images` a readonly tuple, which that union
  // does not accept.
  type: 'website' as const,
  siteName: SITE_NAME,
  locale: 'en_NG',
  images: [OG_IMAGE],
}

/**
 * When each route's content last changed, for <lastmod> in the sitemap.
 *
 * Google reads lastmod as a crawl signal and ignores changefreq and priority
 * entirely, so these are the only scheduling values in the sitemap that do
 * anything — which is also why they must be true. Each date below is the last
 * commit that changed what the route actually renders, taken from the
 * repository history, not an estimate and not the build date.
 *
 * A build date would be worse than nothing: it would tell Google every page
 * changed on every deployment, and Google would learn to disregard the field.
 *
 * WHEN YOU CHANGE PAGE CONTENT, UPDATE THE MATCHING DATE HERE. A stale value
 * is a lie to a crawler; an absent one is merely a missed hint.
 */
export const ROUTE_LAST_MODIFIED = {
  /** Phase One date correction across the home page and its components. */
  home: '2026-11-16',
  /** Same correction reached the careers index and the careers data. */
  careers: '2026-11-16',
  /** The job data file; applies to any job detail page still listed. */
  careerDetail: '2026-11-16',
  /** Phase One date correction reached the policy text. */
  privacy: '2026-11-16',
  /** Last substantive edit to the terms. */
  terms: '2026-10-09',
} as const
