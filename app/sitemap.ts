import type { MetadataRoute } from 'next'
import { CAREERS, isJobOpen } from '@/lib/careers'
import { ROUTE_LAST_MODIFIED, SITE_URL } from '@/lib/seo'

// The XML sitemap.
//
// Two rules decide what belongs here.
//
// ONLY INDEXABLE URLS. A sitemap is a request to index; listing a page that
// carries `noindex` asks Google to do two contradictory things and wastes the
// crawl. The invitation pages have always been excluded for that reason, and
// closed vacancies are now excluded on the same grounds: while applications
// are shut, app/careers/[slug] serves `noindex`, so those URLs must not be
// advertised here. The careers index itself stays — it is the page with
// lasting value, and it still explains that recruitment closed.
//
// This is derived from isJobOpen rather than hardcoded, so reopening
// recruitment puts the vacancies back in the sitemap and back in the index
// with no change to this file.
//
// ONLY HONEST DATES. lastModified is the one scheduling field Google actually
// reads; changeFrequency and priority are ignored. The dates come from
// lib/seo.ts, where each is the last commit that changed what the route
// renders. changeFrequency and priority are kept for the other crawlers that
// still read them, but nothing here depends on them.

export default function sitemap(): MetadataRoute.Sitemap {
  const openCareerRoutes: MetadataRoute.Sitemap = CAREERS.filter(isJobOpen).map((j) => ({
    url: `${SITE_URL}/careers/${j.slug}`,
    lastModified: ROUTE_LAST_MODIFIED.careerDetail,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: ROUTE_LAST_MODIFIED.home,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/careers`,
      lastModified: ROUTE_LAST_MODIFIED.careers,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...openCareerRoutes,
    {
      url: `${SITE_URL}/privacy`,
      lastModified: ROUTE_LAST_MODIFIED.privacy,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: ROUTE_LAST_MODIFIED.terms,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
