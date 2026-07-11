import type { MetadataRoute } from 'next';

const BASE_URL = 'https://search.yowyob.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/admin/', '/profile/', '/settings/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
