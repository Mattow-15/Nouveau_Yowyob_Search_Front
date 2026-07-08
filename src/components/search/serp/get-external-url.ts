import { SearchResult } from '@/types/search';

// Domaines de sites corporate (maison-mère) qui ne représentent PAS un établissement
// spécifique. Les afficher comme lien d'un kiosque / point de vente est trompeur.
// Pour ces résultats on bascule directement vers Google Maps du lieu exact.
const CORPORATE_DOMAINS = new Set([
  // Telecom
  'mtn.cm', 'orange.cm', 'camtel.cm',
  // Énergie / eau
  'totalenergies.com', 'total.cm', 'eneo.cm', 'camwater.cm',
  // Banques & fintech
  'ecobank.com', 'bicec.com', 'afrilandfirstbank.com',
  'societegenerale.cm', 'scb.cm', 'bgfibank.com', 'ubagroup.com',
  'sc.com', 'nfcbank.cm', 'cbcbank.cm', 'banque-atlantique.com',
  'advanscmr.com', 'expressunion.cm',
  // Transfert d'argent
  'westernunion.com', 'moneygram.com',
  // Médias / divertissement
  'canalplus-afrique.com', 'dstv.com',
  // Industrie
  'sabcbrasseries.com', 'sosucam.com', 'chococam.com',
  'camair-co.cm',
]);

function isCorporateDomain(url: string): boolean {
  try {
    const host = new URL(url.startsWith('http') ? url : 'https://' + url).hostname
      .replace(/^www\./, '');
    return CORPORATE_DOMAINS.has(host);
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return 'https://' + u;
}

export function getExternalUrl(item: SearchResult): string | null {
  // Website scrappé : uniquement si ce n'est pas un domaine corporate
  // (un kiosque MTN ne doit pas pointer vers mtn.cm)
  if (item.website && !item.website.includes('@') && !isCorporateDomain(item.website)) {
    return normalizeUrl(item.website);
  }
  if (item.googleMapsUrl) return item.googleMapsUrl;

  const lat = item.latitude ?? (item.location as any)?.lat;
  const lng = item.longitude ?? (item.location as any)?.lng;
  const name = item.title || item.name;

  if (lat != null && lng != null && name) {
    const q = encodeURIComponent(`${name}${item.city ? `, ${item.city}` : ''}`);
    return `https://www.google.com/maps/search/${q}/@${lat},${lng},17z`;
  }

  if (name) {
    const q = encodeURIComponent(`${name}${item.city ? ` ${item.city}` : ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  return null;
}

export function getExternalTarget(item: SearchResult): { url: string | null; isOfficial: boolean } {
  const hasWebsite = !!(item.website && !item.website.includes('@') && !isCorporateDomain(item.website));
  if (hasWebsite) {
    return { url: normalizeUrl(item.website!), isOfficial: true };
  }
  return { url: getExternalUrl(item), isOfficial: false };
}

export function getGoogleSearchUrl(item: SearchResult): string {
  const name = item.title || item.name;
  const lat = item.latitude ?? (item.location as any)?.lat;
  const lng = item.longitude ?? (item.location as any)?.lng;

  if (lat != null && lng != null && name) {
    const q = encodeURIComponent(`${name}${item.city ? `, ${item.city}` : ''}`);
    return `https://www.google.com/maps/search/${q}/@${lat},${lng},17z`;
  }
  if (name) {
    const q = encodeURIComponent(`${name}${item.city ? ` ${item.city}` : ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  return `https://www.google.com/maps`;
}
