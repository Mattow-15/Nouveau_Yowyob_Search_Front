import type { MetadataRoute } from 'next';
import { fetchAllDocumentIdsForSitemap } from '@/lib/api/sitemap-documents.server';

const BASE_URL = 'https://search.yowyob.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1, changeFrequency: 'daily' },
    { path: '/search', priority: 0.9, changeFrequency: 'daily' },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // Fiches individuelles (/search/[id]) — endpoint dédié /api/search/documents
  // (pas encore déployé en prod au moment où ce code est écrit : dans ce cas,
  // fetchAllDocumentIdsForSitemap() retourne [] et le sitemap reste valide avec
  // uniquement les routes statiques ci-dessus).
  const documentIds = await fetchAllDocumentIdsForSitemap();
  const documentEntries: MetadataRoute.Sitemap = documentIds.map(id => ({
    url: `${BASE_URL}/search/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...documentEntries];
}
