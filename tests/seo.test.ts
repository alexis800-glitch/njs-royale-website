import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { CAREERS, APPLICATIONS_CLOSED, isJobOpen } from '../lib/careers.ts'
import { OG_IMAGE, ROUTE_LAST_MODIFIED, SITE_OPEN_GRAPH, SITE_NAME, SITE_URL } from '../lib/seo.ts'

// SEO guardrails.
//
// These cover the parts of the SEO configuration that are plain data and can
// therefore be asserted cheaply. The rendered output — the robots meta on each
// vacancy, the og:image tags, the generated sitemap XML — is verified against a
// real build over HTTP, because app/sitemap.ts and the page modules use the
// '@/' path alias and JSX, neither of which node --test can resolve.

// ---------------------------------------------------------------------------
// Open Graph
// ---------------------------------------------------------------------------

test('the Open Graph image is an approved file that actually exists', () => {
  assert.equal(OG_IMAGE.url, '/og.png')
  assert.ok(existsSync(`public${OG_IMAGE.url}`), 'public/og.png must exist')
  // Facebook, LinkedIn and WhatsApp all want 1.91:1.
  assert.equal(OG_IMAGE.width, 1200)
  assert.equal(OG_IMAGE.height, 630)
  assert.ok(OG_IMAGE.alt.length > 20, 'the share image needs real alt text')
})

test('the shared Open Graph block carries the fields a child override would drop', () => {
  // The whole reason this constant exists: Next replaces a parent's openGraph
  // wholesale when a child declares one, which is how the careers pages lost
  // their image. A child that spreads this keeps all four.
  assert.equal(SITE_OPEN_GRAPH.type, 'website')
  assert.equal(SITE_OPEN_GRAPH.siteName, SITE_NAME)
  assert.equal(SITE_OPEN_GRAPH.locale, 'en_NG')
  assert.deepEqual(SITE_OPEN_GRAPH.images, [OG_IMAGE])
})

// ---------------------------------------------------------------------------
// Sitemap dates
// ---------------------------------------------------------------------------

test('every lastmod is a real past date, and none is the build date', () => {
  const today = new Date().toISOString().slice(0, 10)
  const entries = Object.entries(ROUTE_LAST_MODIFIED)
  assert.ok(entries.length >= 5)

  for (const [route, value] of entries) {
    assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${route} must be an ISO date`)
    assert.equal(
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10),
      value,
      `${route} must be a real calendar date`,
    )
    assert.ok(value <= today, `${route} cannot claim a change in the future`)
    // A lastmod equal to today on every route is the signature of a build-date
    // default, which teaches Google to ignore the field entirely.
    assert.notEqual(value, today, `${route} looks like a build date, not a content date`)
  }
})

test('lastmod dates are not all identical, which would also be a tell', () => {
  const values = new Set(Object.values(ROUTE_LAST_MODIFIED))
  assert.ok(values.size > 1, 'routes change at different times; the dates should differ')
})

// ---------------------------------------------------------------------------
// What belongs in the sitemap
// ---------------------------------------------------------------------------

test('recruitment is closed, so no vacancy is eligible for the sitemap', () => {
  // The sitemap filters on isJobOpen. If this ever flips, the vacancies return
  // to the sitemap and to the index together, which is the intended behaviour.
  assert.equal(APPLICATIONS_CLOSED, true)
  assert.equal(CAREERS.filter(isJobOpen).length, 0)
  assert.ok(CAREERS.length >= 20, 'the vacancies still exist as pages, just unindexed')
})

test('the sitemap and the vacancy pages both key off isJobOpen, not a hardcoded list', () => {
  // A source-level assertion, because app/sitemap.ts and the vacancy page use
  // the '@/' alias and JSX and cannot be imported here. It is still worth
  // making: it catches someone "fixing" this by hardcoding an empty array or
  // by deleting the conditional, either of which would silently strand the
  // vacancies outside the index for good once recruitment reopens.
  const sitemap = readFileSync('app/sitemap.ts', 'utf8')
  assert.match(sitemap, /CAREERS\.filter\(isJobOpen\)/, 'sitemap must filter on isJobOpen')
  assert.match(sitemap, /lastModified:/, 'sitemap entries must carry lastModified')

  const vacancy = readFileSync('app/careers/[slug]/page.tsx', 'utf8')
  assert.match(vacancy, /isJobOpen\(jobItem\)/, 'the vacancy page must ask whether the job is open')
  assert.match(
    vacancy,
    /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/,
    'a closed vacancy must be noindex, follow',
  )
  assert.match(vacancy, /\.\.\.SITE_OPEN_GRAPH/, 'the vacancy page must keep the shared OG fields')
})

// ---------------------------------------------------------------------------
// Constants the sitemap and metadata share
// ---------------------------------------------------------------------------

test('the canonical host is the custom domain, never a deployment URL', () => {
  assert.equal(SITE_URL, 'https://www.njsbeachresort.com')
  assert.doesNotMatch(SITE_URL, /vercel\.app/)
  assert.match(SITE_URL, /^https:\/\//)
  assert.doesNotMatch(SITE_URL, /\/$/, 'no trailing slash, or every URL doubles it')
})
