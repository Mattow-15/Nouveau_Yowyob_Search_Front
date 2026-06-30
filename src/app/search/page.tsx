'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchBar } from '@/components/search/search-bar';
import { CardSkeleton } from '@/components/ui/skeleton';
import { HeaderPublic } from '@/components/layout/header-public';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';

import { SearchTabs, SearchTab } from '@/components/search/search-tabs';
import { MapContainer } from '@/components/map/map-container';
import { SearchResult, AiSearchResponse } from '@/types/search';
import { searchService } from '@/lib/api/search-service';
import { useSearchStore } from '@/store';

// Google SERP Premium Components
import { SponsoredSection } from '@/components/search/serp/sponsored-section';
import { LocalPackSection } from '@/components/search/serp/local-pack';
import { OrganicResult } from '@/components/search/serp/organic-result';
import { BusinessProfilePanel } from '@/components/search/serp/business-profile-panel';
import { ProductCarousel } from '@/components/search/serp/product-carousel';
import { PeopleAlsoAsk } from '@/components/search/serp/people-also-ask';
import { AiAnswerPanel } from '@/components/search/serp/ai-answer-panel';

function SearchContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showAI, setShowAI] = useState(true); // réponse IA affichée par défaut ; masquable et persiste entre recherches
  const [selectedBusiness, setSelectedBusiness] = useState<SearchResult | null>(null);
  
  // AI Overview states
  const [aiResponse, setAiResponse] = useState<AiSearchResponse | null>(null);
  
  const { addToHistory } = useSearchStore();

  // Garde anti-concurrence : seule la DERNIÈRE recherche lancée a le droit de
  // mettre à jour l'état. Évite qu'une requête lente/échouée (la prod timeout
  // parfois) revienne après et écrase des résultats déjà affichés.
  const latestRequest = useRef(0);

  // Sync query with URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
  }, [searchParams]);

  // Fetch results (Parallelized AI RAG & Classic search for Google SERP experience)
  const fetchResults = async () => {
    if (!query && !hasSearched) return;
    const seq = ++latestRequest.current;
    setIsLoading(true);

    let typeFilter: string | undefined = activeTab === 'all' ? undefined : activeTab;
    if (typeFilter === 'products') typeFilter = 'product';
    if (typeFilter === 'services') typeFilter = 'service';

    try {
      // Execute both standard and AI search in parallel for maximum performance
      const [aiRes, classicRes] = await Promise.allSettled([
        searchService.searchAi(query),
        searchService.search({
          query,
          type: typeFilter,
          page: 1
        })
      ]);

      // Une recherche plus récente est partie entre-temps → on ignore ce retour
      // (sinon une réponse obsolète/lente écraserait les résultats à l'écran).
      if (seq !== latestRequest.current) return;

      let sourcesList: SearchResult[] = [];

      // 1. Process AI RAG search
      if (aiRes.status === 'fulfilled' && aiRes.value.success) {
        setAiResponse(aiRes.value);
        sourcesList = aiRes.value.sources;
      } else {
        setAiResponse(null);
      }

      // 2. Process Standard Search results
      const classicOk = classicRes.status === 'fulfilled' && classicRes.value.success;
      if (classicOk) {
        // Réponse fiable (même vide) → on l'applique telle quelle.
        const list = classicRes.value.results;
        setResults(list);
        setSelectedBusiness(list[0] ?? sourcesList[0] ?? null);
      } else if (sourcesList.length > 0) {
        // Échec de la recherche classique mais l'IA a des sources → repli.
        setResults(sourcesList);
        setSelectedBusiness(sourcesList[0]);
      }
      // Sinon : la requête a ÉCHOUÉ (réseau/timeout/401) et aucun repli.
      // On NE vide PAS la liste — on garde l'affichage précédent plutôt que de
      // faire « clignoter » des résultats déjà visibles.

      // 3. Save to search history
      if (query && query.trim().length > 0) {
        addToHistory(query);
        if (session?.user) {
          searchService.addToHistory(query);
        }
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      // En cas d'exception inattendue, idem : ne pas effacer si requête obsolète.
      if (seq === latestRequest.current) setAiResponse(null);
    } finally {
      if (seq === latestRequest.current) {
        setIsLoading(false);
        setHasSearched(true);
      }
    }
  };

  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 300); // 300ms delay for live search

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    // Update URL so browser history reflects the current search
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set('q', newQuery.trim());
    router.push(`/search?${params.toString()}`);
  };

  const handleResultClick = (item: SearchResult) => {
    setSelectedBusiness(item);
  };

  // Split results for premium Google SERP layout sections
  const sponsoredAds = results.filter(r => r.rating && r.rating >= 4.7).slice(0, 2);
  const bottomAds = results.filter(r => r.rating && r.rating >= 4.5 && r.rating < 4.7).slice(0, 1);
  const organicList = results.filter(r => !sponsoredAds.includes(r) && !bottomAds.includes(r));

  return (
    <>
      {session ? (
        <HeaderAuthenticated userName={session.user?.name || undefined} />
      ) : (
        <HeaderPublic />
      )}

      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar
              defaultValue={query}
              onSearch={handleSearch}
              onChange={(val) => setQuery(val)}
              showSuggestions={true}
            />
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <SearchTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-4 mb-8 items-center">
            {/* Toggle Map Button */}
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
            >
              {showMap ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Retirer la carte
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Afficher sur la carte
                </>
              )}
            </button>



            {/* AI Generation Loader status */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2.5 rounded-xl border border-indigo-100/40 dark:border-indigo-950/20 animate-pulse">
                <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-ping" />
                <span>Génération de la synthèse IA YowYob...</span>
              </div>
            )}
          </div>

          {/* AI Panel — masquable via la croix ; rappelable via la puce */}
          {!isLoading && aiResponse && (
            showAI ? (
              <AiAnswerPanel
                aiAnswer={aiResponse.aiAnswer}
                intent={aiResponse.intent}
                rewrittenQuery={aiResponse.rewrittenQuery}
                sources={aiResponse.sources}
                processingTimeMs={aiResponse.processingTimeMs}
                onSourceClick={handleResultClick}
                onClose={() => setShowAI(false)}
              />
            ) : (
              <button
                onClick={() => setShowAI(true)}
                className="inline-flex items-center gap-2 mb-8 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-4 py-2.5 rounded-xl border border-indigo-100/60 dark:border-indigo-950/30 transition-colors"
              >
                ✨ Afficher la réponse IA
              </button>
            )
          )}

          {/* Results Section */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 && query.trim() !== '' ? (
            <div className="text-center py-20">
              <h3 className="text-xl text-gray-600 dark:text-gray-400">Aucun résultat trouvé pour &quot;{query}&quot;</h3>
            </div>
          ) : showMap ? (
            // Layout with map: 2 columns + map sidebar
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 flex flex-col gap-6">
                {/* Google SERP Blocks in Map split view */}
                <SponsoredSection results={sponsoredAds} position="top" />
                <ProductCarousel results={results} />
                <LocalPackSection results={results} query={query} />
                <PeopleAlsoAsk query={query} />
                <div className="flex flex-col gap-2">
                  {organicList.map((item) => (
                    <OrganicResult key={item.id} item={item} onClick={handleResultClick} />
                  ))}
                </div>
                <SponsoredSection results={bottomAds} position="bottom" />
              </div>
              
              <div className="w-full lg:w-[500px] xl:w-[600px] flex-shrink-0 flex flex-col gap-6">
                <div className="h-[400px] rounded-3xl overflow-hidden shadow-2xl">
                  <MapContainer
                    markers={results.filter(r => r.location?.lat || r.latitude).map(r => ({
                      id: r.id,
                      position: [r.location?.lat || r.latitude || 3.848, r.location?.lng || r.longitude || 11.5021],
                      title: r.title || r.name || 'Établissement',
                      description: r.description
                    }))}
                    className="w-full h-full"
                  />
                </div>

                {/* Right Business Panel in split view */}
                {selectedBusiness && (
                  <BusinessProfilePanel
                    item={selectedBusiness}
                    onClose={() => setSelectedBusiness(null)}
                  />
                )}
              </div>
            </div>
          ) : (
            // Layout without map: Clean Two-Column Flex Grid matching original spacings
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Main Column */}
              <div className="flex-1 max-w-4xl flex flex-col gap-6">
                {/* Google SERP Premium Blocks */}
                <SponsoredSection results={sponsoredAds} position="top" />
                <ProductCarousel results={results} />
                <LocalPackSection results={results} query={query} />
                <PeopleAlsoAsk query={query} />
                
                <div className="flex flex-col gap-2">
                  {organicList.map((item) => (
                    <OrganicResult key={item.id} item={item} onClick={handleResultClick} />
                  ))}
                </div>

                <SponsoredSection results={bottomAds} position="bottom" />
              </div>

              {/* Right Column Sidebar for Business Profile Panel */}
              {selectedBusiness && (
                <div className="hidden lg:block w-[360px] flex-shrink-0 sticky top-24">
                  <BusinessProfilePanel
                    item={selectedBusiness}
                    onClose={() => setSelectedBusiness(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}