import { SearchResult } from '@/types/search';

/**
 * Retourne le lien d'itinéraire Google Maps vers un commerce (bouton « Aller à »).
 *
 * Destination, par ordre de précision :
 *   1. coordonnées latitude/longitude
 *   2. coordonnées location.lat/lng
 *   3. adresse (rue, ville)
 *
 * L'origine n'est pas fixée → Google Maps utilise la position de l'utilisateur et
 * calcule l'itinéraire directement à l'ouverture (et lance l'app Maps sur mobile).
 *
 * Retourne null si on n'a ni coordonnées ni adresse — le bouton est alors masqué.
 */
export function getDirectionsUrl(item: SearchResult): string | null {
  const destination =
    item.latitude != null && item.longitude != null
      ? `${item.latitude},${item.longitude}`
      : item.location?.lat != null && item.location?.lng != null
        ? `${item.location.lat},${item.location.lng}`
        : [item.street, item.city].filter(Boolean).join(', ') || null;

  if (!destination) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

/**
 * Ouvre l'itinéraire « Aller à » vers le commerce. L'origine n'est pas imposée :
 * Google Maps part de la position de l'utilisateur (ajustable directement dans Maps).
 */
export function openDirections(item: SearchResult): void {
  const url = getDirectionsUrl(item);
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
