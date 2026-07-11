/**
 * Fetch serveur (SSR) des résultats de recherche organiques — pour generateMetadata
 * et le premier rendu de src/app/search/page.tsx.
 *
 * ⚠️ Server-only, même principe que product-detail.server.ts : appelle
 * BACKEND_API_URL directement avec les clés d'API (jamais exposées au navigateur).
 *
 * Volontairement sans géolocalisation/rayon : ce sont des informations navigateur
 * (GPS/IP côté client) indisponibles au premier rendu serveur. Le client re-fetch
 * avec la géoloc et les filtres complets une fois monté (cf. search-results-client.tsx) ;
 * ce fetch serveur sert uniquement à ce qu'un vrai contenu (et les vrais liens vers
 * les fiches /search/[id]) soit présent dans le HTML initial pour les crawlers.
 */

import { normalizeSearchResult, hasRealName } from './search-service';
import type { SearchResult } from '@/types/search';

const BACKEND_URL = (process.env.BACKEND_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const CLIENT_ID = process.env.BACKEND_API_CLIENT_ID || '';
const API_KEY = process.env.BACKEND_API_KEY || '';
const TENANT_ID = process.env.BACKEND_API_TENANT_ID || '';

export interface SSRSearchResponse {
  results: SearchResult[];
  total: number;
}

export async function fetchSearchResultsForSSR(query: string): Promise<SSRSearchResponse> {
  if (!query.trim()) return { results: [], total: 0 };

  try {
    const headers: HeadersInit = {
      Accept: 'application/json',
      ...(CLIENT_ID ? { 'X-Client-Id': CLIENT_ID } : {}),
      ...(API_KEY ? { 'X-Api-Key': API_KEY } : {}),
      ...(TENANT_ID ? { 'X-Tenant-Id': TENANT_ID } : {}),
    };

    const params = new URLSearchParams({ q: query });
    // Timeout impératif : le backend a été observé restant bloqué 40s+ voire
    // indéfiniment sur /api/search (health check simple à 8s, donc 10s ici
    // laisse une marge sans risquer de bloquer tout le rendu de la page).
    // Sans ça, un backend en difficulté bloque la page SSR indéfiniment au
    // lieu d'un cas "aucun résultat" dégradé mais rapide.
    const res = await fetch(`${BACKEND_URL}/api/search?${params.toString()}`, {
      headers,
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return { results: [], total: 0 };

    const data = await res.json();
    const results = (data.results || []).filter(hasRealName).map(normalizeSearchResult);

    return { results, total: data.total || results.length };
  } catch (error) {
    console.error('[SSR] Échec du fetch résultats de recherche:', error);
    return { results: [], total: 0 };
  }
}
