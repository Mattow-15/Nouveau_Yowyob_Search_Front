'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import { SearchResult } from '@/types/search';
import { getExternalTarget } from '@/components/search/serp/get-external-url';

export type LinkCheckStatus = 'idle' | 'checking' | 'reachable' | 'unreachable';

export interface PendingLink {
  item: SearchResult;
  /** Destination principale : site officiel si dispo, sinon page Google. */
  url: string;
  isOfficial: boolean;
}

interface ExternalLinkState {
  pending: PendingLink | null;
  status: LinkCheckStatus;
  /** Point d'entrée au clic sur un résultat : ouvre le dialogue de confirmation. */
  open: (item: SearchResult) => void;
  /** Ouvre réellement une URL (déclenché par un bouton du dialogue → pas bloqué). */
  openUrl: (url: string) => void;
  /** Ferme le dialogue sans rien ouvrir. */
  cancel: () => void;
}

/**
 * Vérifie si un domaine répond depuis le navigateur. En `no-cors` on ne lit pas le
 * statut HTTP, mais une erreur DNS / connexion refusée (domaine expiré, hors ligne)
 * rejette le fetch → on en déduit l'injoignabilité. Timeout pour ne pas bloquer.
 */
async function isReachable(url: string): Promise<boolean> {
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(5000) });
    return true;
  } catch {
    return false;
  }
}

export const useExternalLinkStore = create<ExternalLinkState>((set, get) => ({
  pending: null,
  status: 'idle',

  open: (item) => {
    const target = getExternalTarget(item);

    // Aucun lien exploitable → on n'ouvre rien (plus de page inexistante).
    if (!target.url) {
      toast.info("Aucun lien officiel n'est disponible pour ce service.");
      return;
    }

    set({
      pending: { item, url: target.url, isOfficial: target.isOfficial },
      status: target.isOfficial ? 'checking' : 'idle',
    });

    // Site officiel → on vérifie qu'il est joignable avant de proposer l'ouverture.
    if (target.isOfficial) {
      const url = target.url;
      isReachable(url).then(ok => {
        // Ignore si l'utilisateur a déjà fermé / changé de lien entre-temps.
        if (get().pending?.url === url) {
          set({ status: ok ? 'reachable' : 'unreachable' });
        }
      });
    }
  },

  openUrl: (url) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    set({ pending: null, status: 'idle' });
  },

  cancel: () => set({ pending: null, status: 'idle' }),
}));

/**
 * Ouvre le lien d'un résultat depuis n'importe quel composant. Affiche un
 * dialogue de confirmation : site officiel (vérifié joignable) ou, à défaut,
 * redirection assumée vers une page Google — l'utilisateur choisit de continuer.
 */
export function openExternalLink(item: SearchResult) {
  useExternalLinkStore.getState().open(item);
}
