import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Root is noindex — gender communities are the SEO entry points
    { url: 'https://blushbite.live/female',  lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: 'https://blushbite.live/male',    lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: 'https://blushbite.live/shemale', lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: 'https://blushbite.live/terms',   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: 'https://blushbite.live/privacy', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]
}
