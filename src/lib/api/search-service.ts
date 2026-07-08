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

/** Normalise un hit API sans injecter de PII fictive (règle d'or checklist §4). */
function normalizeSearchResult(item: any): SearchResult {
  const location = parseLocation(item);
  const shop = item.shop
    ? {
        ...item.shop,
        ...(item.shop.email ? { email: item.shop.email } : {}),
        ...(item.shop.phone ? { phone: item.shop.phone } : {}),
      }
    : undefined;

  return {
    ...item,
    name: item.name || item.title || 'Sans nom',
    type:
      (item.type?.toLowerCase() === 'listing'
        ? 'product'
        : item.type?.toLowerCase() === 'user'
          ? 'shop'
          : item.type?.toLowerCase()) || 'product',
    ...(item.images?.length ? { images: item.images } : item.imageUrl ? { images: [item.imageUrl] } : {}),
    ...(shop ? { shop } : {}),
    ...(location ? { location } : {}),
    ...(item.phone ? { phone: item.phone } : {}),
    ...(item.website ? { website: item.website } : {}),
    city: item.city || '',
    quartier: item.quartier || '',
    tags: item.tags || [item.category].filter(Boolean) || [],
    detailsUrl: item.website || `/search/${item.id}`,
  };
}

class SearchService {
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const hasCoords = filters.latitude != null && filters.longitude != null;

    try {
      // ── Étape 1 : recherche géolocalisée (near-me avec coords réelles) ──
      if (hasCoords) {
        const geoParams = new URLSearchParams();
        if (filters.query)      geoParams.append('q',         filters.query);
        if (filters.type)       geoParams.append('type',      filters.type);
        if (filters.esCategory) geoParams.append('category',  filters.esCategory);
        geoParams.append('latitude',  filters.latitude!.toString());
        geoParams.append('longitude', filters.longitude!.toString());
        if (filters.radius)   geoParams.append('radius',    filters.radius.toString());

        try {
          const geoResponse = await httpClient.get<any>(
            `${API_ENDPOINTS.SEARCH}/near-me?${geoParams.toString()}`
          );
          const geoResults = (geoResponse.results || []).map(normalizeSearchResult);

          // Si la recherche géo a retourné des résultats → on les utilise
          if (geoResults.length > 0) {
            return { results: geoResults, total: geoResponse.total || geoResults.length, page: filters.page || 1, success: true };
          }
        } catch {
          // near-me indisponible → on continue vers le fallback
        }
      }

      // ── Étape 2 : fallback sur /api/search avec city si disponible ──
      // (quand near-me retourne vide ou quand il n'y a pas de coords)
      const params = new URLSearchParams();
      if (filters.query)      params.append('q',        filters.query);
      if (filters.type)       params.append('type',     filters.type);
      if (filters.city)       params.append('city',     filters.city);
      if (filters.esCategory) params.append('category', filters.esCategory);

      const response = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH}?${params.toString()}`);
      const results  = (response.results || []).map(normalizeSearchResult);

      // ── Étape 3 : si filtrage par ville a tout exclu → recherche globale ──
      if (results.length === 0 && filters.city) {
        const globalParams = new URLSearchParams();
        if (filters.query)      globalParams.append('q',        filters.query);
        if (filters.type)       globalParams.append('type',     filters.type);
        if (filters.esCategory) globalParams.append('category', filters.esCategory);
        const globalResponse = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH}?${globalParams.toString()}`);
        const globalResults  = (globalResponse.results || []).map(normalizeSearchResult);
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

      const sources = (response.sources || []).map(normalizeSearchResult);

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