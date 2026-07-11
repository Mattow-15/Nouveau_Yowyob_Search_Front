import type { MetadataRoute } from 'next';

const BASE_URL = 'https://search.yowyob.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1, changeFrequency: 'daily' },
    { path: '/search', priority: 0.9, changeFrequency: 'daily' },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ];

  return staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
