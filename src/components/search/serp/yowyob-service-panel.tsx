'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { YOWYOB_MENU_SERVICES, type YowyobService } from '@/lib/constants/yowyob-services';

// Mots-clés pour suggérer un service en priorité selon la requête
const KEYWORD_MAP: { ids: string[]; re: RegExp }[] = [
  { ids: ['accounting', 'cashier', 'banking'],    re: /\b(compt|factur|banque|paiement|caisse|financ|bilan|tresor)/i },
  { ids: ['hrm'],                                  re: /\b(employ|rh|ressource.humaine|recrutement|salaire|congé|personnel)/i },
  { ids: ['fleetman'],                             re: /\b(flotte|vehicule|camion|livraison|transport|chauffeur|fleet)/i },
  { ids: ['geofence'],                             re: /\b(geo|zone|localisa|carte|positon|geofenc)/i },
  { ids: ['tiibntick', 'tiibntick-market'],        re: /\b(ticket|billet|reservat|event|evenement|excursion|voyage|concert)/i },
  { ids: ['tiibntick-go', 'tiibntick-agency'],     re: /\b(freelance|mission|agence|prestataire|service.a.domicile)/i },
  { ids: ['payment'],                              re: /\b(paiement|payer|transfert|mobile.money|mtn|orange.money)/i },
];

function detectHighlight(query: string): string | null {
  for (const { ids, re } of KEYWORD_MAP) {
    if (re.test(query)) return ids[0];
  }
  return null;
}

interface YowyobServicePanelProps {
  query: string;
}

export function YowyobServicePanel({ query }: YowyobServicePanelProps) {
  if (!query.trim()) return null;

  const highlightId = detectHighlight(query);
  const highlighted = highlightId ? YOWYOB_MENU_SERVICES.find(s => s.id === highlightId) : null;
  const rest = YOWYOB_MENU_SERVICES.filter(s => s.id !== highlightId);

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
        {/* Service mis en avant si la requête correspond */}
        {highlighted && (
          <ServiceCard service={highlighted} featured />
        )}

        {/* Grille compacte de tous les services */}
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
