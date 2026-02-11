/**
 * Search service - version robuste utilisant httpClient
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { SearchResult } from '@/types/search';

interface SearchFilters {
  query: string;
  type?: string;
  city?: string;
  page?: number;
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
function parseLocation(item: any): { lat: number; lng: number } {
  const fallback = { lat: 3.8480, lng: 11.5021 }; // Yaoundé default

  // Case 1: location is already a valid object with lat/lng
  if (item.location && typeof item.location === 'object' && typeof item.location.lat === 'number') {
    return { lat: item.location.lat, lng: item.location.lng || item.location.lon || fallback.lng };
  }

  // Case 2: location is a string like "3.883,11.5165"
  if (item.location && typeof item.location === 'string' && item.location.includes(',')) {
    const parts = item.location.split(',').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }

  // Case 3: Separate latitude/longitude fields
  if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
    return { lat: item.latitude, lng: item.longitude };
  }

  return fallback;
}

class SearchService {
  async search(filters: SearchFilters): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.type) params.append('type', filters.type);
      if (filters.city) params.append('city', filters.city);

      const response = await httpClient.get<any>(`${API_ENDPOINTS.SEARCH}?${params.toString()}`);

      const results = (response.results || []).map((item: any) => ({
        ...item,
        name: item.name || item.title || 'Sans nom', // Map title to name if needed
        type: (item.type?.toLowerCase() === 'listing' ? 'product' : (item.type?.toLowerCase() === 'user' ? 'shop' : item.type?.toLowerCase())) || 'product',
        images: item.images || ['https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=400'],
        shop: item.shop ? {
          ...item.shop,
          email: item.shop.email || 'contact@boutique.com',
          phone: item.shop.phone || '+237 600 000 000',
          description: item.shop.description || 'Boutique partenaire Yowyob'
        } : {
          name: 'Commerçant local',
          address: item.city || 'Yaoundé',
          email: 'contact@local.com',
          phone: '+237 600 000 000',
          description: 'Vendeur particulier'
        },
        location: parseLocation(item),
        city: item.city || '',
        quartier: item.quartier || '',
        tags: item.tags || [item.category].filter(Boolean) || [],
        detailsUrl: `/search/${item.id}`,
      }));

      return {
        results,
        total: response.total || results.length,
        page: filters.page || 1,
        success: true
      };
    } catch (error) {
      console.error('Search failed:', error);
      return {
        results: [],
        total: 0,
        page: filters.page || 1,
        success: false
      };
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

      return {
        ...response,
        name: response.name || response.title || 'Sans nom', // Map title to name
        type: (response.type?.toLowerCase() === 'listing' ? 'product' : (response.type?.toLowerCase() === 'user' ? 'shop' : response.type?.toLowerCase())) || 'product',
        images: response.images || ['https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=400'],
        shop: response.shop ? {
          ...response.shop,
          email: response.shop.email || 'contact@boutique.com',
          phone: response.shop.phone || '+237 600 000 000',
          description: response.shop.description || 'Boutique partenaire Yowyob'
        } : {
          name: 'Commerçant local',
          address: response.city || 'Yaoundé',
          email: 'contact@local.com',
          phone: '+237 600 000 000',
          description: 'Vendeur particulier'
        },
        location: parseLocation(response),
        city: response.city || '',
        quartier: response.quartier || '',
      };
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