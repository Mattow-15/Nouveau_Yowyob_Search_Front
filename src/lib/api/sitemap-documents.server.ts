/**
 * Fetch serveur (SSR/build) de tous les documents indexés — pour générer les
 * entrées dynamiques de sitemap.ts (une par fiche /search/[id]).
 *
 * ⚠️ Server-only, même principe que les autres fichiers *.server.ts de ce dossier.
 * Utilise GET /api/search/documents (endpoint dédié au listing sans mot-clé —
 * les endpoints de recherche classiques exigent tous un `q`).
 *
 * Si l'endpoint n'est pas encore déployé (404) ou que le backend ne répond pas,
 * on retourne simplement une liste vide : le sitemap reste valide avec juste les
 * routes statiques plutôt que de faire échouer toute la génération.
 */

const BACKEND_URL = (process.env.BACKEND_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const CLIENT_ID = process.env.BACKEND_API_CLIENT_ID || '';
const API_KEY = process.env.BACKEND_API_KEY || '';
const TENANT_ID = process.env.BACKEND_API_TENANT_ID || '';

const PAGE_SIZE = 500;
// Plafond de sécurité : Google recommande de rester sous 50 000 URLs par sitemap.
// 20 pages * 500 = 10 000, largement suffisant pour l'index actuel (~3300 docs)
// tout en évitant un sitemap démesuré ou un trop grand nombre d'appels backend
// si l'index grossit beaucoup.
const MAX_PAGES = 20;

interface DocumentSummary {
  id: string;
}

async function fetchDocumentsPage(page: number): Promise<{ ids: string[]; total: number }> {
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(CLIENT_ID ? { 'X-Client-Id': CLIENT_ID } : {}),
    ...(API_KEY ? { 'X-Api-Key': API_KEY } : {}),
    ...(TENANT_ID ? { 'X-Tenant-Id': TENANT_ID } : {}),
  };

  const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
  const res = await fetch(`${BACKEND_URL}/api/search/documents?${params.toString()}`, {
    headers,
    next: { revalidate: 3600 }, // le sitemap n'a pas besoin d'être seconde par seconde
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return { ids: [], total: 0 };

  const data = await res.json();
  const results: DocumentSummary[] = data.results || [];
  return { ids: results.map(r => r.id).filter(Boolean), total: data.total || 0 };
}

export async function fetchAllDocumentIdsForSitemap(): Promise<string[]> {
  try {
    const allIds: string[] = [];
    let page = 0;

    while (page < MAX_PAGES) {
      const { ids, total } = await fetchDocumentsPage(page);
      if (ids.length === 0) break;

      allIds.push(...ids);
      page += 1;

      if (allIds.length >= total) break;
    }

    return allIds;
  } catch (error) {
    console.error('[sitemap] Échec du fetch des documents pour le sitemap dynamique:', error);
    return [];
  }
}
