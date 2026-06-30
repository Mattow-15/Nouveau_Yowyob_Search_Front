import { SearchResult } from '@/types/search';

export interface ExternalTarget {
  /** URL à ouvrir, ou null si on n'a aucun lien exploitable. */
  url: string | null;
  /** true → c'est le site officiel du commerce ; false → une page Google (repli). */
  isOfficial: boolean;
}

/** Recherche Google sur le nom (+ ville) de l'établissement — repli universel. */
export function getGoogleSearchUrl(item: SearchResult): string {
  const name = (item.title || item.name || '').trim();
  const q = encodeURIComponent([name, item.city].filter(Boolean).join(' ') || 'yowyob');
  return `https://www.google.com/search?q=${q}`;
}

/**
 * Détermine la destination d'un résultat, par ordre de priorité :
 *   1. website officiel scrappé   → { isOfficial: true }
 *   2. googleMapsUrl              → { isOfficial: false } (page Google)
 *   3. recherche Google sur le nom → { isOfficial: false } (page Google)
 *   4. rien d'exploitable          → { url: null }
 *
 * On ne « devine » plus une URL `<nom>.com` (qui menait souvent vers une page
 * inexistante) : à défaut de site officiel, on bascule sur une page Google,
 * dont l'ouverture est confirmée au préalable par l'utilisateur.
 */
export function getExternalTarget(item: SearchResult): ExternalTarget {
  if (item.website && item.website.trim()) {
    return { url: item.website.trim(), isOfficial: true };
  }
  if (item.googleMapsUrl && item.googleMapsUrl.trim()) {
    return { url: item.googleMapsUrl.trim(), isOfficial: false };
  }
  const name = (item.title || item.name || '').trim();
  if (name) {
    return { url: getGoogleSearchUrl(item), isOfficial: false };
  }
  return { url: null, isOfficial: false };
}

/**
 * URL externe d'un résultat (ou null). Utilisée pour décider de l'affichage des
 * libellés / icônes « lien externe ». Pour OUVRIR le lien, passer par
 * `openExternalLink()` afin de gérer la vérification et la confirmation.
 */
export function getExternalUrl(item: SearchResult): string | null {
  return getExternalTarget(item).url;
}
