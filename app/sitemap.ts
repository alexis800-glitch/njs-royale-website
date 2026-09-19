import type { MetadataRoute } from 'next'
import { CAREERS } from '@/lib/careers'

const SITE_URL = 'https://www.njsbeachresort.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const careerRoutes: MetadataRoute.Sitemap = CAREERS.map((j) => ({
    url: `${SITE_URL}/careers/${j.slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/careers`, changeFrequency: 'weekly', priority: 0.7 },
    ...careerRoutes,
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
