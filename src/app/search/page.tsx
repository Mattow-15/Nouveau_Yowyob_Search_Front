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

  // Le fetch SSR est fait DANS SearchResultsSSR (enfant du Suspense), pas ici :
  // ça permet à React de streamer le <ConditionalLayout> (header) immédiatement
  // et de tenir la connexion ouverte avec le fallback pendant que le backend
  // répond, plutôt que de bloquer toute la réponse HTTP sur ce fetch. Avec le
  // timeout de 10s dans fetchSearchResultsForSSR, le pire cas reste borné —
  // avant, un backend bloqué (déjà observé : 40s+, parfois sans jamais répondre)
  // aurait laissé la page entière blanche tout ce temps.
  return (
    <ConditionalLayout>
      <Suspense key={query} fallback={<SearchPageSkeleton />}>
        <SearchResultsSSR query={query} />
      </Suspense>
    </ConditionalLayout>
  );
}

async function SearchResultsSSR({ query }: { query: string }) {
  // Fetch serveur sans géoloc/rayon (info navigateur indisponible côté serveur) —
  // sert uniquement à ce qu'un vrai contenu et de vrais liens vers /search/[id]
  // soient présents dans le HTML initial pour les crawlers. Le client re-fetch
  // immédiatement avec géoloc + filtres complets une fois monté (cf.
  // search-results-client.tsx), donc aucun changement de comportement pour un
  // visiteur réel : ces résultats ne sont visibles qu'une fraction de seconde.
  const { results } = await fetchSearchResultsForSSR(query);
  return <SearchResultsClient initialQuery={query} initialResults={results} />;
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="h-14 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
