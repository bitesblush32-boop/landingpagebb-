import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/login', '/status', '/reapply', '/api/'],
      },
    ],
    sitemap: 'https://blushbite.live/sitemap.xml',
    host: 'https://blushbite.live',
  }
}
