/**
 * Fetch serveur (SSR) d'une fiche produit/commerce — pour generateMetadata et le
 * premier rendu de src/app/search/[id]/page.tsx.
 *
 * ⚠️ Server-only : appelle BACKEND_API_URL directement avec les clés d'API
 * (variables d'env sans NEXT_PUBLIC_, jamais exposées au navigateur). Ne JAMAIS
 * importer ce module depuis un composant client — utiliser searchService côté
 * client comme avant.
 *
 * On ne repasse pas par /api/gateway/... ici : depuis un Server Component, on est
 * déjà côté serveur, un aller-retour vers sa propre origine Next.js serait un
 * saut réseau inutile. Mêmes headers d'auth que injectés par la route gateway.
 */

import { normalizeSearchResult } from './search-service';
import type { SearchResult } from '@/types/search';

const BACKEND_URL = (process.env.BACKEND_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const CLIENT_ID = process.env.BACKEND_API_CLIENT_ID || '';
const API_KEY = process.env.BACKEND_API_KEY || '';
const TENANT_ID = process.env.BACKEND_API_TENANT_ID || '';

export async function fetchProductForSSR(id: string): Promise<SearchResult | null> {
  try {
    const headers: HeadersInit = {
      Accept: 'application/json',
      ...(CLIENT_ID ? { 'X-Client-Id': CLIENT_ID } : {}),
      ...(API_KEY ? { 'X-Api-Key': API_KEY } : {}),
      ...(TENANT_ID ? { 'X-Tenant-Id': TENANT_ID } : {}),
    };

    // Pas de cache: 'no-store' ici : generateMetadata() ET la page appellent tous les
    // deux fetchProductForSSR(id) pour la même requête entrante. Avec les mêmes
    // URL+options, le fetch cache par-requête de Next.js déduplique automatiquement
    // ces deux appels en un seul (sinon : double appel backend à chaque chargement de
    // page, alors que la latence backend est déjà identifiée comme un point sensible).
    // revalidate: 60 -> les fiches ne changent pas d'une seconde à l'autre.
    // Timeout : même raison que search-results.server.ts — le backend a été observé
    // bloqué 40s+ voire indéfiniment sur les endpoints de recherche.
    const res = await fetch(`${BACKEND_URL}/api/search/${encodeURIComponent(id)}/details`, {
      headers,
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data) return null;

    return normalizeSearchResult(data);
  } catch (error) {
    console.error('[SSR] Échec du fetch produit:', error);
    return null;
  }
}
