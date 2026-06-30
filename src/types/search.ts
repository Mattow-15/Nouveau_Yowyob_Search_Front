export interface SearchResult {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  serviceType?: string;
  city?: string;
  quartier?: string;
  street?: string;
  rating?: number;
  reviewsCount?: number;
  reviewCount?: number;   // alias ES (KERNEL_ORG indexe ce champ sous ce nom)
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  images?: string[];
  phone?: string;
  website?: string;
  openingHours?: string;
  source?: string;
  /** Collection d'origine côté backend prod (organization, administration, products…). Présent ⇒ donnée du core. */
  collection?: string;
  /** Vrai si le résultat provient du backend de production (données du « core »). */
  isCore?: boolean;

  location?: {
    lat: number;
    lng: number;
  };
  shop?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    description?: string;
    address?: string;
    logoUrl?: string;
  };
  tags?: string[];
  detailsUrl?: string;
  type?: string;

  // ── Nouveaux champs Google Places ─────────────────────────────
  openNow?: boolean;
  priceLevel?: number;
  reviewsSummary?: string;
  googleMapsUrl?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  size: number;
}

export interface AiSearchResponse {
  aiAnswer: string;
  intent: string;
  rewrittenQuery: string;
  sources: SearchResult[];
  processingTimeMs: number;
  aiMode: boolean;
  success?: boolean;
}