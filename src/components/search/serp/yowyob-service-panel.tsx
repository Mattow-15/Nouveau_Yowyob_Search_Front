'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { YOWYOB_MENU_SERVICES, type YowyobService } from '@/lib/constants/yowyob-services';
import type { SearchResult } from '@/types/search';

// Score de pertinence par service selon la requête (plusieurs services peuvent matcher)
const RELEVANCE_RULES: { ids: string[]; score: number; re: RegExp }[] = [
  // Restauration & commerces
  { ids: ['tiibntick', 'tiibntick-market'], score: 3, re: /\b(restaurant|manger|bouffer|repas|food|cuisine|café|boulanger|pâtiss)/i },
  { ids: ['cashier'],                        score: 2, re: /\b(restaurant|commerce|boutique|magasin|vente|caisse|supermarché|épicerie)/i },
  { ids: ['payment'],                        score: 2, re: /\b(restaurant|commerce|boutique|magasin|payer|prix|achat)/i },

  // Hôtellerie & voyages
  { ids: ['tiibntick', 'tiibntick-market'], score: 3, re: /\b(hôtel|hotel|hébergement|chambre|logement|auberge|séjour|voyage|excursion)/i },
  { ids: ['tiibntick-go'],                  score: 2, re: /\b(voyage|excursion|guide|tourisme|tour)/i },

  // Transport & livraison
  { ids: ['fleetman'],                      score: 3, re: /\b(transport|flotte|véhicule|camion|livraison|chauffeur|bus|taxi|colis)/i },
  { ids: ['tiibntick-point'],               score: 2, re: /\b(livraison|colis|relais|ramassage|point.de.collect)/i },
  { ids: ['geofence'],                      score: 2, re: /\b(transport|localisa|suivi|géo|tracé|itinéraire|zone)/i },

  // Événements & tickets
  { ids: ['tiibntick', 'tiibntick-market'], score: 3, re: /\b(ticket|billet|réservat|event|événement|concert|spectacle|match|festival)/i },
  { ids: ['tiibntick-agency'],              score: 2, re: /\b(event|événement|organis|agence.event)/i },

  // Emploi & freelance
  { ids: ['tiibntick-go'],                  score: 3, re: /\b(freelance|mission|emploi|travail|job|recrutement|prestataire|service.à.domicile|plombier|électricien|menuisier)/i },
  { ids: ['hrm'],                           score: 3, re: /\b(rh|ressource.humaine|employ|salaire|personnel|congé|recrutement|staff)/i },
  { ids: ['tiibntick-agency'],              score: 2, re: /\b(agence|prestataire|sous.traitan)/i },

  // Finances & paiements
  { ids: ['payment'],                       score: 3, re: /\b(paiement|payer|transfert|mobile.money|mtn|orange.money|wave|virement)/i },
  { ids: ['banking'],                       score: 3, re: /\b(banque|épargne|crédit|prêt|trésor|finance)/i },
  { ids: ['accounting'],                    score: 3, re: /\b(compt|factur|bilan|fiscal|tva|déclaration|audit)/i },
  { ids: ['cashier'],                       score: 2, re: /\b(caisse|vente|pos|point.de.vente|encaissement)/i },
  { ids: ['billing-api'],                   score: 2, re: /\b(factur|abonnement|invoice)/i },

  // Géolocalisation
  { ids: ['geofence'],                      score: 3, re: /\b(géo|zone|localisa|carte|position|géofenc|périmètre)/i },
];

function rankServices(query: string): string[] {
  const scores: Record<string, number> = {};
  for (const { ids, score, re } of RELEVANCE_RULES) {
    if (re.test(query)) {
      for (const id of ids) {
        scores[id] = (scores[id] || 0) + score;
      }
    }
  }
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
}

interface YowyobServicePanelProps {
  query: string;
  /** Produits Yowyob réellement remontés par Elasticsearch pour cette recherche
   *  (source: "YOWYOB_PRODUCT") — priment sur l'heuristique par mots-clés quand présents,
   *  car c'est un signal de pertinence réel plutôt qu'une supposition. */
  matchedProducts?: SearchResult[];
}

export function YowyobServicePanel({ query, matchedProducts = [] }: YowyobServicePanelProps) {
  if (!query.trim()) return null;

  // ID du produit dans l'index ES : "yowyob-product-cashier" → "cashier"
  const matchedIds = matchedProducts
    .map(r => r.id.replace(/^yowyob-product-/, ''))
    .filter(id => YOWYOB_MENU_SERVICES.some(s => s.id === id));

  // Priorité au signal réel (résultats effectivement trouvés par la recherche) ;
  // repli sur l'heuristique par mots-clés si aucun produit n'a matché.
  const topIds = matchedIds.length > 0 ? matchedIds.slice(0, 3) : rankServices(query);
  const isRealMatch = matchedIds.length > 0;
  const topServices = topIds
    .map(id => YOWYOB_MENU_SERVICES.find(s => s.id === id))
    .filter(Boolean) as YowyobService[];
  const topIdSet = new Set(topIds);
  const rest = YOWYOB_MENU_SERVICES.filter(s => !topIdSet.has(s.id));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2">
        <span className="text-lg">🧩</span>
        <h3 className="font-bold text-sm text-white">Yowyob Products</h3>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
          {YOWYOB_MENU_SERVICES.length} services
        </span>
      </div>

      <div className="p-3 flex flex-col gap-2">
        {/* Services les plus pertinents pour cette requête */}
        {topServices.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest px-1 mb-0.5 flex items-center gap-1">
              {isRealMatch ? '✓ Trouvé dans vos résultats' : 'Recommandés pour vous'}
            </p>
            {topServices.map((service, i) => (
              <ServiceCard key={service.id} service={service} featured={i === 0} />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 px-1 mb-0.5">
            Aucun service Yowyob particulièrement pertinent pour « {query} »
          </p>
        )}

        {/* Grille compacte du reste */}
        <div className="grid grid-cols-3 gap-1">
          {rest.map(service => (
            <MiniServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service, featured }: { service: YowyobService; featured?: boolean }) {
  const inner = (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors
      ${featured
        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
        : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <span className="text-2xl leading-none">{service.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${featured ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
          {service.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{service.description}</p>
      </div>
      {service.external && <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />}
    </div>
  );

  return service.external ? (
    <a href={service.href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link href={service.href}>{inner}</Link>
  );
}

function MiniServiceCard({ service }: { service: YowyobService }) {
  const inner = (
    <div className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
      <span className="text-xl leading-none">{service.emoji}</span>
      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">
        {service.name}
      </span>
    </div>
  );

  return service.external ? (
    <a href={service.href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link href={service.href}>{inner}</Link>
  );
}
