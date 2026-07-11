import type { SearchResult } from '@/types/search';

/**
 * Rang max (dans l'ordre brut renvoyé par le backend, avant tout réordonnancement
 * frontend) en dessous duquel un produit Yowyob est considéré comme une vraie
 * correspondance plutôt que du bruit de recherche sémantique.
 *
 * Vérifié empiriquement : pour une requête pertinente ("comptabilité", "banque",
 * "ressources humaines"), le bon produit ressort toujours en position 1. Pour une
 * requête sans rapport ("jouer au foot"), des produits Yowyob apparaissent quand
 * même mais en position 9 et 16/20 — un signal sémantique faible, pas un vrai match.
 */
const YOWYOB_PRODUCT_RANK_LIMIT = 5;

/** Retire les documents YOWYOB_PRODUCT mal classés (au-delà du rang de confiance) —
 *  garde tout le reste (organisations Kernel, résultats web) intact. À appliquer
 *  sur l'ordre BRUT du backend, avant tout réordonnancement local (ex: les
 *  organisations Kernel/Yowyob étant systématiquement remontées en tête par
 *  prioritizeResults, leur rang d'origine serait perdu si on filtrait après). */
export function filterNoisyYowyobProducts(list: SearchResult[]): SearchResult[] {
  return list.filter((r, idx) => !(r.source === 'YOWYOB_PRODUCT' && idx >= YOWYOB_PRODUCT_RANK_LIMIT));
}
