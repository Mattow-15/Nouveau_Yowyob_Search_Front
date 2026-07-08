'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

// ── Définition enrichie des services ──────────────────────────────────────
export interface YowyobServiceDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  emoji: string;
  external: boolean;
  /** Couleurs Tailwind : [bg header, text accent, badge bg, badge text] */
  colors: [string, string, string, string];
  /** Mots-clés qui font remonter ce service en premier dans le panel */
  keywords: RegExp[];
  /** IDs des services Yowyob "similaires" à afficher en bas */
  relatedIds: string[];
}

export const YOWYOB_SERVICE_DEFS: YowyobServiceDef[] = [
  {
    id: 'health',
    name: 'Yowyob Health',
    tagline: 'Santé & bien-être',
    description:
      'Trouvez des pharmacies, médecins, cliniques et services de santé proches de vous. Consultez les avis et prenez rendez-vous en ligne.',
    href: 'https://health.yowyob.com',
    emoji: '🏥',
    external: true,
    colors: ['bg-emerald-50 dark:bg-emerald-950/40', 'text-emerald-700 dark:text-emerald-400', 'bg-emerald-100 dark:bg-emerald-900/50', 'text-emerald-800 dark:text-emerald-300'],
    keywords: [/\b(pharmacie|médecin|docteur|clinique|hôpital|infirmier|dentiste|ophtalmologue|cardiologue|urgences?|santé|médicament|ordonnance)\b/i],
    relatedIds: ['search', 'market', 'connect'],
  },
  {
    id: 'immo',
    name: 'Yowyob Immo',
    tagline: 'Immobilier',
    description:
      'Achetez, vendez ou louez des biens immobiliers. Appartements, maisons, terrains et locaux commerciaux partout en Afrique.',
    href: 'https://immo.yowyob.com',
    emoji: '🏠',
    external: true,
    colors: ['bg-orange-50 dark:bg-orange-950/40', 'text-orange-700 dark:text-orange-400', 'bg-orange-100 dark:bg-orange-900/50', 'text-orange-800 dark:text-orange-300'],
    keywords: [/\b(appartement|maison|villa|terrain|louer|location|immobilier|immo|logement|studio|duplex|chambre\s+à\s+louer|propriété|achat\s+immobilier)\b/i],
    relatedIds: ['search', 'market', 'jobs'],
  },
  {
    id: 'jobs',
    name: 'Yowyob Jobs',
    tagline: 'Emplois & carrières',
    description:
      'Recherchez des offres d\'emploi, déposez votre CV et connectez-vous avec les meilleurs employeurs. Des milliers d\'offres chaque jour.',
    href: 'https://jobs.yowyob.com',
    emoji: '💼',
    external: true,
    colors: ['bg-blue-50 dark:bg-blue-950/40', 'text-blue-700 dark:text-blue-400', 'bg-blue-100 dark:bg-blue-900/50', 'text-blue-800 dark:text-blue-300'],
    keywords: [/\b(emploi|travail|job|recrutement|poste|carrière|stage|CDI|CDD|offre\s+d['']emploi|cherche\s+emploi|CV|recruteur)\b/i],
    relatedIds: ['connect', 'learn', 'search'],
  },
  {
    id: 'market',
    name: 'Yowyob Market',
    tagline: 'Marketplace',
    description:
      'Achetez et vendez des produits neufs ou d\'occasion. Électronique, mode, maison, alimentation — tout en un seul endroit.',
    href: 'https://market.yowyob.com',
    emoji: '🛍️',
    external: true,
    colors: ['bg-purple-50 dark:bg-purple-950/40', 'text-purple-700 dark:text-purple-400', 'bg-purple-100 dark:bg-purple-900/50', 'text-purple-800 dark:text-purple-300'],
    keywords: [/\b(acheter|vendre|achat|boutique|shop|marché|produit|article|prix|téléphone|électronique|vêtement|mode|alimentation|supermarché)\b/i],
    relatedIds: ['search', 'pay', 'tours'],
  },
  {
    id: 'tours',
    name: 'Yowyob Tours',
    tagline: 'Voyage & tourisme',
    description:
      'Planifiez vos voyages, réservez des hôtels, des vols et des excursions. Découvrez les meilleures destinations africaines.',
    href: 'https://tours.yowyob.com',
    emoji: '✈️',
    external: true,
    colors: ['bg-cyan-50 dark:bg-cyan-950/40', 'text-cyan-700 dark:text-cyan-400', 'bg-cyan-100 dark:bg-cyan-900/50', 'text-cyan-800 dark:text-cyan-300'],
    keywords: [/\b(voyage|tourisme|hôtel|hotel|vol|avion|réservation|séjour|excursion|circuit|destination|billet|touriste|vacances)\b/i],
    relatedIds: ['search', 'market', 'pay'],
  },
  {
    id: 'learn',
    name: 'Yowyob Learn',
    tagline: 'Formation & éducation',
    description:
      'Accédez à des formations certifiantes en ligne. Développement, business, design et plus — apprenez à votre rythme.',
    href: 'https://learn.yowyob.com',
    emoji: '📚',
    external: true,
    colors: ['bg-yellow-50 dark:bg-yellow-950/40', 'text-yellow-700 dark:text-yellow-400', 'bg-yellow-100 dark:bg-yellow-900/50', 'text-yellow-800 dark:text-yellow-300'],
    keywords: [/\b(formation|cours|apprendre|diplôme|certificat|école|université|e[\s-]?learning|tutoriel|compétence|étudier|éducation)\b/i],
    relatedIds: ['jobs', 'connect', 'search'],
  },
  {
    id: 'connect',
    name: 'Yowyob Connect',
    tagline: 'Réseau & communauté',
    description:
      'Développez votre réseau professionnel, rejoignez des communautés et collaborez avec des professionnels à travers l\'Afrique.',
    href: 'https://connect.yowyob.com',
    emoji: '🤝',
    external: true,
    colors: ['bg-indigo-50 dark:bg-indigo-950/40', 'text-indigo-700 dark:text-indigo-400', 'bg-indigo-100 dark:bg-indigo-900/50', 'text-indigo-800 dark:text-indigo-300'],
    keywords: [/\b(réseau|communauté|contact|professionnel|networking|collaborer|association|groupe|membre|forum)\b/i],
    relatedIds: ['jobs', 'learn', 'search'],
  },
  {
    id: 'pay',
    name: 'Yowyob Pay',
    tagline: 'Paiements & transferts',
    description:
      'Envoyez de l\'argent, payez vos achats et gérez vos finances en toute sécurité. Mobile Money, cartes et virements bancaires.',
    href: 'https://pay.yowyob.com',
    emoji: '💳',
    external: true,
    colors: ['bg-rose-50 dark:bg-rose-950/40', 'text-rose-700 dark:text-rose-400', 'bg-rose-100 dark:bg-rose-900/50', 'text-rose-800 dark:text-rose-300'],
    keywords: [/\b(paiement|transfert|mobile\s+money|virement|banque|fintech|Orange\s+Money|MTN\s+Money|payer|envoyer\s+de\s+l['']argent)\b/i],
    relatedIds: ['market', 'tours', 'search'],
  },
  {
    id: 'search',
    name: 'Yowyob Search',
    tagline: 'Moteur de recherche',
    description:
      'Le moteur de recherche intelligent qui comprend vos besoins. Trouvez des établissements, produits et services près de vous.',
    href: '/',
    emoji: '🔍',
    external: false,
    colors: ['bg-gray-50 dark:bg-gray-800/60', 'text-gray-700 dark:text-gray-300', 'bg-gray-100 dark:bg-gray-700/50', 'text-gray-800 dark:text-gray-200'],
    keywords: [],
    relatedIds: ['market', 'health', 'jobs'],
  },
];

// ── Détection du service pertinent ─────────────────────────────────────────
// Rotation déterministe : chaque requête sans correspondance choisit
// un service différent basé sur la longueur de la requête.
const ROTATABLE = YOWYOB_SERVICE_DEFS.filter(s => s.id !== 'search');

function detectService(query: string): YowyobServiceDef {
  const q = query.trim();
  // 1. Correspondance par mot-clé
  for (const svc of YOWYOB_SERVICE_DEFS) {
    if (svc.keywords.some(re => re.test(q))) return svc;
  }
  // 2. Fallback : rotation basée sur la longueur de la requête
  const idx = q.length % ROTATABLE.length;
  return ROTATABLE[idx];
}

function getRelated(primary: YowyobServiceDef): YowyobServiceDef[] {
  return primary.relatedIds
    .map(id => YOWYOB_SERVICE_DEFS.find(s => s.id === id))
    .filter((s): s is YowyobServiceDef => !!s);
}

// ── Composant principal ────────────────────────────────────────────────────
interface YowyobServicePanelProps {
  query: string;
}

export function YowyobServicePanel({ query }: YowyobServicePanelProps) {
  if (!query.trim()) return null;
  const service = detectService(query);

  const related = getRelated(service);
  const [headerBg, accent, badgeBg, badgeText] = service.colors;

  const ServiceLink = ({ children, className }: { children: React.ReactNode; className?: string }) =>
    service.external ? (
      <a href={service.href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    ) : (
      <Link href={service.href} className={className}>
        {children}
      </Link>
    );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900">
      {/* ── Header coloré ── */}
      <div className={`${headerBg} px-5 py-4`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{service.emoji}</span>
          <div>
            <h3 className={`font-bold text-base ${accent}`}>{service.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{service.tagline}</p>
          </div>
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>
            Yowyob
          </span>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="px-5 py-4 flex flex-col gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {service.description}
        </p>

        <ServiceLink
          className={`inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 ${badgeBg} ${badgeText}`}
        >
          Visiter {service.name}
          {service.external && <ExternalLink className="w-3.5 h-3.5" />}
        </ServiceLink>

        {/* ── Services similaires ── */}
        {related.length > 0 && (
          <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Services similaires
            </p>
            <div className="flex flex-col gap-1.5">
              {related.map(rel => (
                rel.external ? (
                  <a
                    key={rel.id}
                    href={rel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <span className="text-xl leading-none">{rel.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {rel.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{rel.tagline}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </a>
                ) : (
                  <Link
                    key={rel.id}
                    href={rel.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <span className="text-xl leading-none">{rel.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {rel.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{rel.tagline}</p>
                    </div>
                  </Link>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
