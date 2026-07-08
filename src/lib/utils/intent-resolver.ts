/**
 * Résolution d'intention côté client.
 *
 * Analyse la requête brute de l'utilisateur pour en extraire l'intention
 * sémantique et produire une requête enrichie, prête à être envoyée au backend.
 *
 * Exemples :
 *   "je veux manger"           → FOOD  · rewrite → "restaurant"
 *   "j'ai faim"                → FOOD  · rewrite → "restaurant"
 *   "je veux manger une pizza" → FOOD  · rewrite → "restaurant pizza"
 *   "comment aller à Bastos"   → NAVIGATION · affiche la carte automatiquement
 *   "je cherche un téléphone"  → SHOPPING · rewrite → "téléphone"
 *   "meilleur restaurant"      → RECOMMENDATION · pas de rewrite
 */

export type IntentCategory =
  | 'FOOD'           // restaurants, repas
  | 'NAVIGATION'     // itinéraire, localisation
  | 'HEALTH'         // santé, pharmacie, médecin
  | 'SHOPPING'       // achat d'un produit
  | 'RECOMMENDATION' // conseil, meilleur
  | 'GENERAL';       // requête directe, pas d'intention implicite

export interface ResolvedIntent {
  category: IntentCategory;
  /** Requête envoyée au backend (peut différer de la saisie brute). */
  rewrittenQuery: string;
  /**
   * Filtre catégorie Elasticsearch à utiliser à la place (ou en plus) du texte.
   * Quand défini, le backend cherche par category= plutôt que par q=,
   * ce qui couvre les établissements dont le NOM ne contient pas le mot-clé.
   * Ex: "je veux manger" → esCategory="RESTAURANT" → trouve "Le Wenge", "Tchop et yamo", ...
   */
  esCategory?: string;
  /** Afficher la carte automatiquement dès la détection de cette intention. */
  autoShowMap: boolean;
  emoji: string;
  /** Texte lisible affiché à l'utilisateur sous la barre de recherche. */
  label: string;
}

// ── Mots à supprimer pour extraire le terme clé d'une intention ───────────
const FOOD_STRIP   = /\b(je|j['']?|veux?|voudrais?|envie\s+de?|manger|déjeuner|dîner|grignoter|bouffer|jai|j['']?ai|ai\s+faim|faim|où|ou|puis[\s-]je|peut[\s-]on|cherche|trouve|trouver|un|une|bon|bonne|bon\s+|repas|lunch|brunch|souper|près|autour|de|moi|du|des)\b/gi;
// Pour HEALTH : on retire les mots d'intention mais on conserve les termes médicaux et de lieu.
const HEALTH_STRIP = /\b(je|j'?|veux?|voudrais?|besoin\s+d[e']?|cherche[r]?|trouver|aller(?:\s+(?:à|au|chez|voir))?|voir|consulter|soigner|me\s+soigner|se\s+soigner|guérir|traiter|me\s+faire|se\s+faire|suis|me\s+sens|de\s+garde|me|se|de|un|une|moi)\b/gi;
const SHOP_STRIP   = /\b(je|veux?|voudrais?|souhaite|cherche|acheter|trouver|où|prix|d'un|d'une|du|de\s+la|des|un|une)\b/gi;

// ── Définitions des intentions ─────────────────────────────────────────────
interface IntentDef {
  category: IntentCategory;
  patterns: RegExp[];
  rewrite: (q: string) => string;
  esCategory?: string;
  autoShowMap: boolean;
  emoji: string;
  label: string;
}

const INTENT_DEFS: IntentDef[] = [
  // ── FOOD ──────────────────────────────────────────────────────────────────
  {
    category: 'FOOD',
    patterns: [
      /\b(veux?|voudrais?|envie\s+de?)\s+(manger|déjeuner|dîner|grignoter|bouffer)\b/i,
      /\bj['']?ai\s+faim\b/i,
      /\b(jai)\s+faim\b/i,
      /\b(où|ou)\s+(manger|déjeuner|dîner|trouver\s+(?:un|une)\s+(?:resto|restaurant))\b/i,
      /\b(cherche|trouver|trouve)\s+(un|une)?\s*(bon|bonne)?\s*(resto|restaurant|maquis|grill|brasserie|pizzeria|fast[\s-]food)\b/i,
      /\b(envie|faim|manger|grignoter)\b/i,
    ],
    rewrite(q) {
      // Conserver uniquement les termes alimentaires spécifiques (pizza, poulet, ndolé…)
      // La catégorie ES "RESTAURANT" se charge du reste.
      const stripped = q.replace(FOOD_STRIP, ' ').replace(/\s+/g, ' ').trim();
      return stripped.length >= 3 ? stripped : '';
    },
    esCategory: 'RESTAURANT',
    autoShowMap: true,
    emoji: '🍽️',
    label: 'Restaurants à proximité',
  },

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  {
    category: 'NAVIGATION',
    patterns: [
      /\b(comment|par\s+où)\s+(aller|se\s+rendre|rejoindre|accéder)\b/i,
      /\b(itinéraire|trajet|chemin|route|direction)\s+(vers|pour|jusqu['à]+|de)\b/i,
      /\badresse\s+de\b/i,
      /\b(situé[e]?|localis[eé][e]?)\s+(où|a|à)\b/i,
      /\boù\s+se\s+trouve\b/i,
      /\bplan\s+(pour|vers|de)\b/i,
    ],
    rewrite: (q) => q,
    autoShowMap: true,
    emoji: '🧭',
    label: 'Itinéraire & Localisation',
  },

  // ── HEALTH ────────────────────────────────────────────────────────────────
  {
    category: 'HEALTH',
    patterns: [
      // Professionnels de santé
      /\b(médecin|docteur|urgences?|clinique|infirmier[e]?|dentiste|ophtalmologue|cardiologue|gynécologue|pédiatre|dermatologue|psychiatre|kiné)\b/i,
      // Symptômes / états
      /\b(je\s+(suis|me\s+sens)\s+malade|j'?ai\s+mal|je\s+suis\s+bless[eé])\b/i,
      /\b(mal\s+(à|au|aux|de)\s+\w+|douleur|fièvre|blessure|blessé|accident)\b/i,
      // Intentions de soin
      /\b(soigner|guérir|traiter|me\s+soigner|se\s+soigner|me\s+faire\s+soigner|se\s+faire\s+soigner)\b/i,
      /\b(veux?\s+(?:me\s+)?soigner|besoin\s+de\s+soins?|cherche\s+(?:un\s+)?médecin)\b/i,
      // Produits / services santé
      /\b(médicament|ordonnance|consultation\s+médicale?|pharmacie(?:\s+de\s+garde)?|vaccin|analyse\s+médicale?|radio(?:graphie)?)\b/i,
      // Santé générale
      /\b(santé|soin|soins?|médical|médecine|hôpital|cabinet\s+médical)\b/i,
    ],
    rewrite(q) {
      const stripped = q.replace(HEALTH_STRIP, ' ').replace(/\s+/g, ' ').trim();
      // Conserver uniquement si le terme restant est un établissement/professionnel recherchable.
      // Les mots-symptômes ("malade", "soins"…) n'existent pas dans les titres ES → fallback.
      const SEARCHABLE = /\b(médecin|docteur|dentiste|pharmacie|hopital|hôpital|clinique|infirmier[e]?|urgences?|ophtalmologue|cardiologue|gynécologue|pédiatre|kiné|psychiatre|dermatologue|radiologie|laboratoire|cabinet|analyse\s+médicale?)\b/i;
      return (stripped.length >= 3 && SEARCHABLE.test(stripped))
        ? stripped
        : 'pharmacie hopital clinique médical';
    },
    // Pas d'esCategory : HOSPITAL + PHARMACY coexistent, backend ne supporte pas le multi-cat.
    // Le rewrite texte couvre les deux via title/description.
    autoShowMap: true,
    emoji: '🏥',
    label: 'Services de santé à proximité',
  },

  // ── SHOPPING ──────────────────────────────────────────────────────────────
  {
    category: 'SHOPPING',
    patterns: [
      /\b(je\s+)?(cherche|veux?|voudrais?|souhaite)\s+(acheter\s+)?(un|une|des|du)\b/i,
      /\b(où\s+)?(acheter|trouver)\s+(un|une|des|du)\b/i,
      /\bprix\s+(d[eu']?\s*n?e?|du|de\s+la|des)\b/i,
    ],
    rewrite(q) {
      const stripped = q.replace(SHOP_STRIP, ' ').replace(/\s+/g, ' ').trim();
      return stripped.length >= 2 ? stripped : q;
    },
    autoShowMap: false,
    emoji: '🛍️',
    label: 'Recherche de produits',
  },

  // ── RECOMMENDATION ────────────────────────────────────────────────────────
  {
    category: 'RECOMMENDATION',
    patterns: [
      /\b(meilleur[es]*|mieux\s+not[eé]|top\s+\d*|recommande[rz]?|conseil[lez]?)\b/i,
      /\bque\s+(me\s+)?conseillez[\s-]vous\b/i,
      /\bquoi\s+de\s+(bien|bon|mieux)\b/i,
    ],
    rewrite: (q) => q,
    autoShowMap: false,
    emoji: '⭐',
    label: 'Recommandations personnalisées',
  },
];

// ── Fonction principale ────────────────────────────────────────────────────
/**
 * Retourne l'intention résolue pour une requête donnée.
 * Retourne `null` si aucune intention implicite n'est détectée (requête directe).
 */
export function resolveIntent(rawQuery: string): ResolvedIntent | null {
  const q = rawQuery.trim();
  if (!q) return null;

  for (const def of INTENT_DEFS) {
    if (def.patterns.some(p => p.test(q))) {
      return {
        category:       def.category,
        rewrittenQuery: def.rewrite(q),
        esCategory:     def.esCategory,
        autoShowMap:    def.autoShowMap,
        emoji:          def.emoji,
        label:          def.label,
      };
    }
  }

  return null; // requête directe — pas d'interprétation implicite
}
