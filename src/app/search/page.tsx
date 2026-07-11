import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { SearchResultsClient } from '@/components/search/search-results-client';
import { fetchSearchResultsForSSR } from '@/lib/api/search-results.server';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q || '').trim();

  if (!query) {
    return {
      title: 'Recherche — Yowyob Search',
      description: 'Trouvez des commerces, services et produits près de chez vous au Cameroun.',
    };
  }

  return {
    title: `${query} — Résultats de recherche | Yowyob Search`,
    description: `Résultats pour "${query}" : commerces, services et produits près de chez vous sur Yowyob Search.`,
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q || '';

  // Fetch serveur sans géoloc/rayon (info navigateur indisponible côté serveur) —
  // sert uniquement à ce qu'un vrai contenu et de vrais liens vers /search/[id]
  // soient présents dans le HTML initial pour les crawlers. Le client re-fetch
  // immédiatement avec géoloc + filtres complets une fois monté (cf.
  // search-results-client.tsx), donc aucun changement de comportement pour un
  // visiteur réel : ces résultats ne sont visibles qu'une fraction de seconde.
  const { results } = await fetchSearchResultsForSSR(query);

  return (
    <ConditionalLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <SearchResultsClient initialQuery={query} initialResults={results} />
      </Suspense>
    </ConditionalLayout>
  );
}
