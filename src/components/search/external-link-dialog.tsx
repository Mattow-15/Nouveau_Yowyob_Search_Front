'use client';

import React, { useEffect } from 'react';
import { useExternalLinkStore } from '@/store/external-link-store';
import { getGoogleSearchUrl } from '@/components/search/serp/get-external-url';

const btnSecondary =
  'px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors';
const btnGhost =
  'px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';
const btnPrimary =
  'px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors';

/**
 * Dialogue global de confirmation de redirection externe. Monté une seule fois
 * dans le layout racine ; piloté par `useExternalLinkStore`.
 *
 * Quatre états :
 *   - site officiel en cours de vérification ;
 *   - site officiel joignable → ouverture confirmée ;
 *   - site officiel hors ligne → repli vers une recherche Google ;
 *   - aucun site officiel → redirection assumée vers une page Google.
 */
export default function ExternalLinkDialog() {
  const pending = useExternalLinkStore(s => s.pending);
  const status = useExternalLinkStore(s => s.status);
  const openUrl = useExternalLinkStore(s => s.openUrl);
  const cancel = useExternalLinkStore(s => s.cancel);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, cancel]);

  if (!pending) return null;

  const name = pending.item.title || pending.item.name || 'ce service';
  const googleUrl = getGoogleSearchUrl(pending.item);

  let icon = '🌐';
  let title = 'Ouvrir le lien';
  let message: React.ReactNode = null;
  let actions: React.ReactNode = null;

  if (pending.isOfficial && status === 'checking') {
    icon = '🔎';
    title = 'Vérification du site…';
    message = (
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
        On vérifie que le site officiel de <span className="font-semibold">{name}</span> est joignable.
      </p>
    );
    actions = <button type="button" onClick={cancel} className={btnSecondary}>Annuler</button>;
  } else if (pending.isOfficial && status === 'reachable') {
    icon = '✅';
    title = 'Site officiel disponible';
    message = (
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
        Ouvrir le site officiel de <span className="font-semibold">{name}</span> ?
      </p>
    );
    actions = (
      <>
        <button type="button" onClick={cancel} className={btnSecondary}>Annuler</button>
        <button type="button" onClick={() => openUrl(pending.url)} className={btnPrimary}>
          Ouvrir le site officiel
        </button>
      </>
    );
  } else if (pending.isOfficial && status === 'unreachable') {
    icon = '⚠️';
    title = 'Site officiel injoignable';
    message = (
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
        Le site de <span className="font-semibold">{name}</span> semble hors ligne.
        Chercher sur Google à la place ?
      </p>
    );
    actions = (
      <>
        <button type="button" onClick={cancel} className={btnSecondary}>Annuler</button>
        <button type="button" onClick={() => openUrl(pending.url)} className={btnGhost}>
          Ouvrir quand même
        </button>
        <button type="button" onClick={() => openUrl(googleUrl)} className={btnPrimary}>
          Rechercher sur Google
        </button>
      </>
    );
  } else {
    // Pas de site officiel référencé → redirection assumée vers Google.
    icon = '⚠️';
    title = 'Redirection vers une page Google';
    message = (
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
        Aucun site officiel n'a été trouvé pour <span className="font-semibold">{name}</span>.
        Vous allez être redirigé vers une page Google externe. Continuer ?
      </p>
    );
    actions = (
      <>
        <button type="button" onClick={cancel} className={btnSecondary}>Annuler</button>
        <button type="button" onClick={() => openUrl(pending.url)} className={btnPrimary}>
          Continuer vers Google
        </button>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4"
      onClick={cancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-2.5 mb-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-base">
            {status === 'checking'
              ? <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              : icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{title}</h2>
            {message}
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 break-all line-clamp-2">
              {pending.url}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {actions}
        </div>
      </div>
    </div>
  );
}
