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

test('every lastmod is a real date that is not in the future', () => {
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
  }
  // Note what is deliberately NOT asserted here: that a date differs from
  // today. Content genuinely does change on the day it ships, and a page
  // edited this morning should say so. The build-date smell is tested below,
  // where it actually lives.
})

test('the dates do not look like a build-date default', () => {
  const today = new Date().toISOString().slice(0, 10)
  const values = Object.values(ROUTE_LAST_MODIFIED)
  const distinct = new Set(values)

  // The failure mode worth catching is EVERY route carrying the same date,
  // which is what you get from `lastModified: new Date()`. That tells Google
  // the whole site changed on every deployment, and Google responds by
  // disregarding the field for the site. One route moving to today is an
  // ordinary edit; all of them moving together is a generated value.
  assert.ok(
    distinct.size > 1,
    `every route claims ${values[0]}; routes change at different times, so this looks generated`,
  )
  assert.ok(
    !values.every((v) => v === today),
    'every route claims today, which is the signature of a build-date default',
  )

  // And prove the guard is not vacuous: the same predicate must reject the
  // thing it exists to reject. Without this, loosening the rule to allow
  // same-day edits could quietly loosen it to allow anything.
  const generated = { home: today, careers: today, privacy: today, terms: today }
  const generatedValues = Object.values(generated)
  assert.equal(new Set(generatedValues).size > 1, false)
  assert.equal(
    generatedValues.every((v) => v === today),
    true,
    'the detector must still flag an all-today map',
  )
})

test('a single route legitimately updated today is accepted', () => {
  // The rule this replaced rejected any date equal to today, which would have
  // failed the moment a page was edited and shipped on the same day — exactly
  // what happened to the home page in this change.
  const today = new Date().toISOString().slice(0, 10)
  const sameDayEdit = { home: today, careers: '2026-11-16', privacy: '2026-11-16', terms: '2026-10-09' }
  const values = Object.values(sameDayEdit)
  assert.ok(values.every((v) => v <= today), 'nothing in the future')
  assert.ok(new Set(values).size > 1, 'not all identical')
  assert.ok(!values.every((v) => v === today), 'not a build-date default')
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
