/**
 * Services de l'écosystème Yowyob — menu « Yowyob Products » (style Google Apps)
 */

export interface YowyobService {
  id: string;
  name: string;
  description: string;
  href: string;
  emoji: string;
  /** true = lien externe (nouvel onglet) */
  external: boolean;
  /** 'front' | 'backend' | 'service' */
  type: 'front' | 'backend' | 'service';
}

export const YOWYOB_SERVICES: YowyobService[] = [
  // ── Core / ERP ─────────────────────────────────────────────────────────────
  {
    id: 'search',
    name: 'Search',
    description: 'Moteur de recherche local',
    href: 'https://search.yowyob.com',
    emoji: '🔍',
    external: false,
    type: 'service',
  },
  {
    id: 'kernel-core',
    name: 'Kernel IWM',
    description: 'Cœur ERP Yowyob',
    href: 'https://kernel-core.yowyob.com',
    emoji: '⚙️',
    external: true,
    type: 'backend',
  },
  {
    id: 'accounting',
    name: 'Accounting',
    description: 'ERP Comptabilité',
    href: 'https://accounting.yowyob.com',
    emoji: '📊',
    external: true,
    type: 'front',
  },
  {
    id: 'accounting-api',
    name: 'Accounting API',
    description: 'API Comptabilité',
    href: 'https://accounting.yowyob.com/accounting-api',
    emoji: '🔌',
    external: true,
    type: 'backend',
  },
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'Caisse & point de vente',
    href: 'https://cashier.yowyob.com',
    emoji: '🏪',
    external: true,
    type: 'front',
  },
  {
    id: 'banking',
    name: 'Banking',
    description: 'Banque & trésorerie',
    href: 'https://banking.yowyob.com',
    emoji: '🏦',
    external: true,
    type: 'front',
  },
  {
    id: 'hrm',
    name: 'HRM',
    description: 'Gestion des ressources humaines',
    href: 'https://hrm.yowyob.com',
    emoji: '👥',
    external: true,
    type: 'front',
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Paiements en ligne',
    href: 'https://payment-dev.yowyob.com',
    emoji: '💳',
    external: true,
    type: 'backend',
  },
  {
    id: 'billing-api',
    name: 'Billing',
    description: 'Facturation',
    href: 'https://billing.yowyob.com/billing-api',
    emoji: '🧾',
    external: true,
    type: 'backend',
  },
  // ── Fleet & Geo ─────────────────────────────────────────────────────────────
  {
    id: 'fleetman',
    name: 'FleetMan',
    description: 'Gestion de flotte',
    href: 'https://fleetman.yowyob.com',
    emoji: '🚗',
    external: true,
    type: 'front',
  },
  {
    id: 'fleetman-api',
    name: 'FleetMan API',
    description: 'API FleetMan',
    href: 'https://fleetman.yowyob.com/fleet-api',
    emoji: '🔌',
    external: true,
    type: 'backend',
  },
  {
    id: 'geofence',
    name: 'Geofence',
    description: 'Géofencing & zones',
    href: 'https://geofence.yowyob.com',
    emoji: '📍',
    external: true,
    type: 'front',
  },
  {
    id: 'geofence-api',
    name: 'Geofence API',
    description: 'API Geofence',
    href: 'https://geofence.yowyob.com/geo-api',
    emoji: '🔌',
    external: true,
    type: 'backend',
  },
  // ── TiiBnTick ───────────────────────────────────────────────────────────────
  {
    id: 'tiibntick-core',
    name: 'TiiBnTick Core',
    description: 'Kernel TiiBnTick',
    href: 'https://tiibntick-core.yowyob.com',
    emoji: '🎫',
    external: true,
    type: 'backend',
  },
  {
    id: 'tiibntick',
    name: 'TiiBnTick',
    description: 'Portail de réservation',
    href: 'https://tiibntick.yowyob.com',
    emoji: '🎟️',
    external: true,
    type: 'front',
  },
  {
    id: 'tiibntick-market',
    name: 'TiiBnTick Market',
    description: 'Marketplace billets & services',
    href: 'https://tiibntick-market.yowyob.com',
    emoji: '🛍️',
    external: true,
    type: 'front',
  },
  {
    id: 'tiibntick-go',
    name: 'TiiBnTick Go',
    description: 'Freelance & missions',
    href: 'https://tiibntick-go.yowyob.com',
    emoji: '🚀',
    external: true,
    type: 'front',
  },
  {
    id: 'tiibntick-go-api',
    name: 'TiiBnTick Go API',
    description: 'API Go/Point',
    href: 'https://tiibntick-go.yowyob.com/go-api',
    emoji: '🔌',
    external: true,
    type: 'backend',
  },
  {
    id: 'tiibntick-point',
    name: 'TiiBnTick Point',
    description: 'Relais & points de collecte',
    href: 'https://tiibntick-point.yowyob.com',
    emoji: '📦',
    external: true,
    type: 'front',
  },
  {
    id: 'tiibntick-point-api',
    name: 'TiiBnTick Point API',
    description: 'API Point',
    href: 'https://tiibntick-point.yowyob.com/point-api',
    emoji: '🔌',
    external: true,
    type: 'backend',
  },
  {
    id: 'tiibntick-link',
    name: 'TiiBnTick Link',
    description: 'Lien & partage',
    href: 'https://tiibntick-link.yowyob.com',
    emoji: '🔗',
    external: true,
    type: 'front',
  },
  {
    id: 'tiibntick-agency',
    name: 'TiiBnTick Agency',
    description: 'Gestion d\'agence',
    href: 'https://tiibntick-agency.yowyob.com',
    emoji: '🏢',
    external: true,
    type: 'front',
  },
];

/** Uniquement les services visibles dans le menu (pas les API backend pures) */
export const YOWYOB_MENU_SERVICES = YOWYOB_SERVICES.filter(s => s.type !== 'backend');
