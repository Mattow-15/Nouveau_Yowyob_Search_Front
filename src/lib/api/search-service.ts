/**
 * Search service - version robuste utilisant httpClient
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { SearchResult, AiSearchResponse } from '@/types/search';

interface SearchFilters {
  query: string;
  type?: string;
  city?: string;
  page?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // km — transmis à l'endpoint near-me du backend
  /** Filtre catégorie Elasticsearch (ex: "RESTAURANT", "PHARMACY"). Prioritaire sur q= quand fourni. */
  esCategory?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  success: boolean;
}

/**
 * Parse location from various backend formats into {lat, lng}
 * Backend can send:
 *   - A string like "3.883,11.5165" (geo_point format)
 *   - An object { lat: 3.883, lng: 11.5165 } or { lat: 3.883, lon: 11.5165 }
 *   - Separate latitude/longitude fields
 */
function parseLocation(item: any): { lat: number; lng: number } | undefined {
  if (item.location && typeof item.location === 'object' && typeof item.location.lat === 'number') {
    return { lat: item.location.lat, lng: item.location.lng || item.location.lon };
  }

  if (item.location && typeof item.location === 'string' && item.location.includes(',')) {
    const parts = item.location.split(',').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }

  if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
    return { lat: item.latitude, lng: item.longitude };
  }

  return undefined;
}

/** Rejette les documents sans titre exploitable (données de test/incomplètes dans l'index)
 *  plutôt que de les afficher avec un intitulé factice "Sans nom". */
function hasRealName(item: any): boolean {
  const src = item.source && typeof item.source === 'object' ? item.source : {};
  return Boolean(item.name || item.title || src.name);
}

/** Normalise un hit API sans injecter de PII fictive (règle d'or checklist §4).
 *  Exportée pour être réutilisée par le fetch serveur (SSR) des pages de détail,
 *  qui doit produire exactement le même SearchResult que le fetch client. */
export function normalizeSearchResult(item: any): SearchResult {
  const location = parseLocation(item);
  // SearchDoc stores original payload in item.source (object) — extract top-level fields from it
  const src = item.source && typeof item.source === 'object' ? item.source : {};
  const shop = item.shop
    ? {
        ...item.shop,
        ...(item.shop.email ? { email: item.shop.email } : {}),
        ...(item.shop.phone ? { phone: item.shop.phone } : {}),
      }
    : undefined;

  return {
    ...item,
    // item.source peut être l'objet freeform du backend (avec son propre champ `source`
    // interne, ex. "KERNEL_ORG" / "YOWYOB_PRODUCT") — on remonte ce discriminant en
    // chaîne au niveau racine pour que les checks `result.source === 'YOWYOB_PRODUCT'` marchent.
    source: (typeof item.source === 'string' ? item.source : src.source) || undefined,
    name: item.name || item.title || src.name || 'Sans nom',
    type:
      (item.type?.toLowerCase() === 'listing'
        ? 'product'
        : item.type?.toLowerCase() === 'user'
          ? 'shop'
          : item.type?.toLowerCase()) || 'product',
    ...(item.images?.length ? { images: item.images } : item.imageUrl ? { images: [item.imageUrl] } : {}),
    ...(shop ? { shop } : {}),
    ...(location ? { location } : {}),
    phone: item.phone || src.phone || undefined,
    website: item.website || src.website || undefined,
    logoUrl: item.logoUrl || src.logoUrl || undefined,
    city: item.city || src.city || '',
    quartier: item.quartier || src.quartier || '',
    category: item.category || src.category || undefined,
    description: item.description || src.description || undefined,
    tags: item.tags || [item.category || src.category].filter(Boolean) || [],
    detailsUrl: item.website || src.website || item.logoUrl || src.logoUrl || `/search/${item.id}`,
  };
}

class SearchService {
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const hasCoords = filters.latitude != null && filters.longitude != null;

    try {
      // ── Étape 1 : recherche sémantique principale (/api/search, kNN) ──
      // near-me ignoré : il filtre par rayon géographique sans tenir compte de l'intention
      // sémantique (ex. "je veux gérer mon argent" retourne des restaurants proches).
      // Le classement par proximité est appliqué côté frontend dans prioritizeResults.

      // ── Étape 2 : fallback sur /api/search avec city si disponible ──
      // (quand near-me retourne vide ou quand il n'y a pas de coords)
      const params = new URLSearchParams();
      if (filters.query)      params.append('q',        filters.query);
      if (filters.type)       params.append('type',     filters.type);
      if (filters.city)       params.append('city',     filters.city);
      if (filters.esCategory) params.append('category', filters.esCategory);

      const response = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH}?${params.toString()}`);
      const results  = (response.results || []).filter(hasRealName).map(normalizeSearchResult);

      // ── Étape 3 : si filtrage par ville a tout exclu → recherche globale ──
      if (results.length === 0 && filters.city) {
        const globalParams = new URLSearchParams();
        if (filters.query)      globalParams.append('q',        filters.query);
        if (filters.type)       globalParams.append('type',     filters.type);
        if (filters.esCategory) globalParams.append('category', filters.esCategory);
        const globalResponse = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH}?${globalParams.toString()}`);
        const globalResults  = (globalResponse.results || []).filter(hasRealName).map(normalizeSearchResult);
        return { results: globalResults, total: globalResponse.total || globalResults.length, page: filters.page || 1, success: true };
      }

      return { results, total: response.total || results.length, page: filters.page || 1, success: true };

    } catch (error) {
      console.error('Search failed:', error);
      return { results: [], total: 0, page: filters.page || 1, success: false };
    }
  }

  async searchAi(query: string, city?: string): Promise<AiSearchResponse & { success: boolean }> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (city) params.append('city', city);

      const response = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH}/ai?${params.toString()}`);

      const sources = (response.sources || []).filter(hasRealName).map(normalizeSearchResult);

      return {
        aiAnswer: response.aiAnswer || '',
        intent: response.intent || 'GENERAL',
        rewrittenQuery: response.rewrittenQuery || query,
        sources,
        processingTimeMs: response.processingTimeMs || 0,
        aiMode: response.aiMode || false,
        success: true
      };
    } catch (error) {
      console.error('AI search failed:', error);
      return {
        aiAnswer: '',
        intent: 'GENERAL',
        rewrittenQuery: query,
        sources: [],
        processingTimeMs: 0,
        aiMode: false,
        success: false
      };
    }
  }

  // FAQ « Autres questions posées » générée dynamiquement côté backend (Groq).
  // Renvoie [] en cas d'échec → le composant retombe sur ses questions statiques.
  async getFaq(query: string, city?: string): Promise<Array<{ question: string; answer: string }>> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (city) params.append('city', city);
      const response = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH}/faq?${params.toString()}`);
      return Array.isArray(response?.questions) ? response.questions : [];
    } catch {
      return [];
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH_AUTOCOMPLETE}?q=${encodeURIComponent(query)}`);
      return response || [];
    } catch {
      return [];
    }
  }

  async getProductById(id: string): Promise<SearchResult | null> {
    try {
      const response = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH}/${id}/details`);
      if (!response) return null;

      return normalizeSearchResult(response);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
      return null;
    }
  }

  async getHistory(): Promise<any[]> {
    try {
      const response = await httpClient.get<any[]>(API_ENDPOINTS.USER_HISTORY);
      return response || [];
    } catch (error: any) {
      if (error?.code === 'HTTP_401' || error?.code === 'HTTP_403' || error?.status === 401 || error?.status === 403) return [];
      console.warn('Failed to fetch search history:', error);
      return [];
    }
  }

  async addToHistory(query: string): Promise<void> {
    if (!query) return;
    try {
      await httpClient.post(API_ENDPOINTS.USER_HISTORY, { query });
    } catch (error: any) {
      // Silently ignore auth errors (401/403) to avoid console spam when session expired
      // Silently ignore auth errors (401/403) to avoid console spam when session expired
      if (error?.code === 'HTTP_401' || error?.code === 'HTTP_403' || error?.status === 401 || error?.status === 403) {
        return;
      }
      console.warn('Failed to add to history:', error);
    }
  }
}

export const searchService = new SearchService();
export const simpleSearchService = searchService;