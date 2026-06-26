import { SearchResult } from '@/types/search';

/**
 * Retourne l'URL externe à ouvrir pour un résultat de recherche :
 * 1. website scrappé (priorité maximale)
 * 2. googleMapsUrl
 * 3. Fallback : recherche Google sur le nom + ".com"
 */
export function getExternalUrl(item: SearchResult): string {
  if (item.website) return item.website;
  if (item.googleMapsUrl) return item.googleMapsUrl;

  // Fallback : Google Search sur le nom de l'établissement + ".com"
  const name = (item.title || item.name || '').trim();
  const query = encodeURIComponent(name + '.com');
  return `https://www.google.com/search?q=${query}`;
}
