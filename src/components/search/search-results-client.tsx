'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchBar } from '@/components/search/search-bar';
import { CardSkeleton } from '@/components/ui/skeleton';

import { SearchTabs, SearchTab } from '@/components/search/search-tabs';
import { SearchResult, AiSearchResponse } from '@/types/search';
import { searchService } from '@/lib/api/search-service';
import { useSearchStore } from '@/store';
import { useSmartGeolocation } from '@/lib/hooks/ui/use-geolocation';
import { resolveIntent, ResolvedIntent } from '@/lib/utils/intent-resolver';
import { haversineKm, getResultCoords } from '@/lib/utils/geo-distance';
import { YowyobProductsMenu } from '@/components/layout/yowyob-products-menu';

// Google SERP Premium Components
import { SponsoredSection } from '@/components/search/serp/sponsored-section';
import { LocalPackSection } from '@/components/search/serp/local-pack';
import { OrganicResult } from '@/components/search/serp/organic-result';
import { BusinessProfilePanel } from '@/components/search/serp/business-profile-panel';
import { YowyobServicePanel } from '@/components/search/serp/yowyob-service-panel';
import { PeopleAlsoAsk } from '@/components/search/serp/people-also-ask';
import { AiAnswerPanel } from '@/components/search/serp/ai-answer-panel';
import { Pagination } from '@/components/search/pagination';
import { SEARCH_CONFIG } from '@/lib/constants/app-config';

// ── Sélecteur de rayon ─────────────────────────────────────────────────────
const RADIUS_OPTIONS = [5, 10, 30, 50, 100] as const;

function RadiusSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1.5 select-none">
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
      </svg>
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="text-sm text-gray-700 dark:text-gray-200 bg-transparent outline-none cursor-pointer"
      >
        {RADIUS_OPTIONS.map(km => (
          <option key={km} value={km}>{km} km</option>
        ))}
      </select>
    </div>
  );
}

// ── Bannière d'intention détectée ─────────────────────────────────────────
function IntentBanner({ intent, rawQuery }: { intent: ResolvedIntent; rawQuery: string }) {
  const hasSpecificQuery = intent.rewrittenQuery && intent.rewrittenQuery !== rawQuery;
  const categoryLabel = intent.esCategory
    ? { RESTAURANT: 'restaurants', HOSPITAL: 'hôpitaux & cliniques', PHARMACY: 'pharmacies' }[intent.esCategory] ?? intent.esCategory.toLowerCase()
    : null;
  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 text-xs font-semibold text-amber-800 dark:text-amber-400">
        <span>{intent.emoji}</span>
        <span>{intent.label}</span>
        {hasSpecificQuery && (
          <span className="font-normal text-amber-600 dark:text-amber-500">
            · &laquo;&nbsp;{intent.rewrittenQuery}&nbsp;&raquo;
          </span>
        )}
        {categoryLabel && !hasSpecificQuery && (
          <span className="font-normal text-amber-600 dark:text-amber-500">
            · tous les {categoryLabel}
          </span>
        )}
      </span>
    </div>
  );
}

// ── Tri des résultats : Kernel > Pertinence > Proximité ───────────────────
// 1. Les organisations Kernel (annuaire officiel) toujours en tête
// 2. Parmi le reste, l'ordre du backend (score Elasticsearch = pertinence) prime
// 3. La proximité affine le classement à pertinence comparable (score composite)

function isKernelSource(r: SearchResult): boolean {
  return r.collection === 'organization';
}

function prioritizeResults(
  list: SearchResult[],
  userLat?: number,
  userLng?: number,
): SearchResult[] {
  // Groupe 1 : Kernel (pertinence backend préservée, pas de réordonnancement)
  const kernel = list.filter(isKernelSource);
  // Groupe 2 : tout le reste
  const others = list.filter(r => !isKernelSource(r));

  if (userLat == null || userLng == null) {
    // Sans coordonnées : ordre backend intact dans chaque groupe
    return [...kernel, ...others];
  }

  const MAX_DIST_KM = 50; // cap pour normalisation
  const n = others.length || 1;

  // Score composite : 65 % pertinence (rang backend) + 35 % proximité
  const scored = others.map((r, idx) => {
    const relevanceScore = idx / n; // 0 (meilleur) → ~1 (dernier)
    const coords = getResultCoords(r);
    const dist = coords
      ? Math.min(haversineKm(userLat, userLng, coords.lat, coords.lng), MAX_DIST_KM)
      : MAX_DIST_KM;
    const distanceScore = dist / MAX_DIST_KM; // 0 (très proche) → 1 (loin / inconnu)
    const composite = 0.65 * relevanceScore + 0.35 * distanceScore;
    return { r, composite };
  });

  scored.sort((a, b) => a.composite - b.composite);

  return [...kernel, ...scored.map(s => s.r)];
}

// ── Liste organique avec sections visuelles ────────────────────────────────
function OrganicListWithSections({
  list,
  onResultClick,
}: {
  list: SearchResult[];
  onResultClick: (item: SearchResult) => void;
}) {
  const yowyob  = list.filter(isKernelSource);
  const web     = list.filter(r => !isKernelSource(r));
  const hasBoth = yowyob.length > 0 && web.length > 0;

  return (
    <div className="flex flex-col gap-0">
      {/* ── Section Yowyob ── */}
      {yowyob.length > 0 && (
        <>
          {hasBoth && (
            <div className="flex items-center gap-2 py-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                {/* Icône Yowyob */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
                Résultats Yowyob
              </span>
              <div className="flex-1 h-px bg-blue-100 dark:bg-blue-900/30" />
            </div>
          )}
          {yowyob.map(item => (
            <OrganicResult key={item.id} item={item} onClick={onResultClick} />
          ))}
        </>
      )}

      {/* ── Section Web (crawler) ── */}
      {web.length > 0 && (
        <>
          {hasBoth && (
            <div className="flex items-center gap-2 py-2 mt-4 mb-1">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Résultats Web
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>
          )}
          {web.map(item => (
            <OrganicResult key={item.id} item={item} onClick={onResultClick} />
          ))}
        </>
      )}
    </div>
  );
}

interface SearchResultsClientProps {
  initialQuery: string;
  initialResults: SearchResult[];
}

// ── Contenu principal ──────────────────────────────────────────────────────
// initialQuery/initialResults viennent du fetch serveur (SSR) du parent — ils
// n'alimentent que le tout premier rendu (contenu réel + vrais liens vers les
// fiches dans le HTML initial, pour les crawlers). Dès le montage, le fetch
// client habituel prend le relais avec géoloc/rayon/filtres, exactement comme
// avant : aucun changement de comportement pour un visiteur réel.
export function SearchResultsClient({ initialQuery, initialResults }: SearchResultsClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery]               = useState(initialQuery);
  const [activeTab, setActiveTab]       = useState<SearchTab>('all');
  const [results, setResults]           = useState<SearchResult[]>(initialResults);
  const [isLoading, setIsLoading]       = useState(false);
  const [hasSearched, setHasSearched]   = useState(initialResults.length > 0 || !!initialQuery.trim());
  const [showAI, setShowAI]             = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<SearchResult | null>(initialResults[0] ?? null);
  const [aiResponse, setAiResponse]     = useState<AiSearchResponse | null>(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [radius, setRadius]             = useState<number>(SEARCH_CONFIG.DEFAULT_DISTANCE);
  const [isFallback, setIsFallback]     = useState(false);

  const { addToHistory } = useSearchStore();
  const geo = useSmartGeolocation();

  // ── Intention sémantique ─────────────────────────────────────────────────
  // Calculée de façon synchrone à chaque changement de query — pas de useEffect
  // ni d'état supplémentaire : on dérive directement via useMemo.
  const resolvedIntent = useMemo(() => resolveIntent(query), [query]);

  // Requête effectivement envoyée au backend : enrichie si une intention est détectée,
  // identique à la saisie brute sinon (l'utilisateur ne voit que sa saisie originale).
  // `||` et non `??` : certaines intentions (ex. "je veux manger") réduisent
  // volontairement rewrittenQuery à '' (le filtre esCategory suffit selon
  // l'auteur de intent-resolver.ts), mais `q` est un paramètre OBLIGATOIRE côté
  // backend — une chaîne vide fait échouer la requête en 400, donc aucun
  // résultat affiché. Se rabattre sur la saisie brute dans ce cas.
  const effectiveQuery = resolvedIntent?.rewrittenQuery || query;

  // Timeout de sécurité : si la géoloc prend > 2 s, on lance la recherche
  // sans coordonnées plutôt que de bloquer l'utilisateur.
  const [geoTimedOut, setGeoTimedOut] = useState(false);
  useEffect(() => {
    if (!geo.loading) return;
    const t = setTimeout(() => setGeoTimedOut(true), 2000);
    return () => clearTimeout(t);
  }, [geo.loading]);

  // Sync query with URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
    setCurrentPage(1);
  }, [searchParams]);

  // Reset page when tab or geolocation changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, geo.latitude, geo.longitude]);

  // Fetch results — Parallelized AI RAG & Classic search for Google SERP experience
  const fetchResults = async () => {
    if (!query && !hasSearched) return;
    setIsLoading(true);
    setIsFallback(false);

    let typeFilter: string | undefined = activeTab === 'all' ? undefined : activeTab;
    if (typeFilter === 'products') typeFilter = 'product';
    if (typeFilter === 'services') typeFilter = 'service';

    const hasCoords = geo.latitude != null && geo.longitude != null;

    try {
      const [aiRes, classicRes] = await Promise.allSettled([
        // L'IA reçoit la query brute pour générer une réponse dans le langage de l'utilisateur
        searchService.searchAi(query, geo.city ?? undefined),
        // Le backend reçoit la requête enrichie + le filtre catégorie ES si une intention est détectée
        searchService.search({
          query:      effectiveQuery,
          type:       typeFilter,
          page:       1,
          latitude:   geo.latitude  ?? undefined,
          longitude:  geo.longitude ?? undefined,
          radius:     hasCoords ? radius : undefined,
          esCategory: resolvedIntent?.esCategory,
        }),
      ]);

      // Résultats classiques (géo-filtrés avec coordonnées) — source de vérité
      let classicResults: SearchResult[] = [];
      let usedFallback = false;
      if (classicRes.status === 'fulfilled' && classicRes.value.success) {
        classicResults = prioritizeResults(
          classicRes.value.results,
          geo.latitude ?? undefined,
          geo.longitude ?? undefined,
        );
      }

      // Fallback sans géo : si la recherche géolocalisée ne trouve rien,
      // relancer sans filtre de proximité pour montrer ce qu'il y a dans la base.
      if (classicResults.length === 0 && hasCoords) {
        try {
          const fallbackRes = await searchService.search({
            query:      effectiveQuery,
            type:       typeFilter,
            page:       1,
            esCategory: resolvedIntent?.esCategory,
          });
          if (fallbackRes.success && fallbackRes.results.length > 0) {
            classicResults = fallbackRes.results;
            usedFallback = true;
          }
        } catch { /* fallback silencieux */ }
      }

      setIsFallback(usedFallback);
      if (classicResults.length > 0) {
        setResults(classicResults);
        setSelectedBusiness(classicResults[0] ?? null);
      } else {
        setResults([]);
        setSelectedBusiness(null);
      }

      // L'IA synthétise les MÊMES résultats géo-corrects (pas sa propre recherche)
      if (aiRes.status === 'fulfilled' && aiRes.value.success) {
        // Remplacer les sources backend (sans géo) par les résultats classiques (avec géo)
        const sourcesForAi = classicResults.length > 0 ? classicResults : aiRes.value.sources;
        setAiResponse({ ...aiRes.value, sources: sourcesForAi });
      } else {
        // Même sans réponse backend, si on a des résultats classiques → activer l'IA
        if (classicResults.length > 0) {
          setAiResponse({
            aiAnswer: '',
            intent: 'GENERAL',
            rewrittenQuery: query,
            sources: classicResults,
            processingTimeMs: 0,
            aiMode: true,
            success: true,
          });
        } else {
          setAiResponse(null);
        }
      }

      if (query.trim()) {
        addToHistory(query);
        if (session?.user) searchService.addToHistory(query);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
      setSelectedBusiness(null);
      setAiResponse(null);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  // Déclencher la recherche uniquement quand la géoloc est résolue (ou timeout).
  // Cela garantit que la toute première requête inclut déjà les coordonnées
  // si elles sont disponibles (cache localStorage ou IP rapide).
  useEffect(() => {
    if (geo.loading && !geoTimedOut) return;
    const timer = setTimeout(() => { fetchResults(); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab, geo.latitude, geo.longitude, geoTimedOut, radius]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set('q', newQuery.trim());
    router.push(`/search?${params.toString()}`);
  };

  const handleResultClick = (item: SearchResult) => {
    setSelectedBusiness(item);
  };

  // Split results for premium Google SERP layout
  const sponsoredAds    = results.filter(r => r.rating && r.rating >= 4.7).slice(0, 2);
  const bottomAds       = results.filter(r => r.rating && r.rating >= 4.5 && r.rating < 4.7).slice(0, 1);
  const organicListAll  = results.filter(r => !sponsoredAds.includes(r) && !bottomAds.includes(r));
  const perPage         = SEARCH_CONFIG.RESULTS_PER_PAGE;
  const totalPages      = Math.max(1, Math.ceil(organicListAll.length / perPage));
  const safePage        = Math.min(currentPage, totalPages);
  const organicList     = organicListAll.slice((safePage - 1) * perPage, safePage * perPage);

  const hasGeo = geo.latitude != null && geo.longitude != null;

  // Produits Yowyob réellement remontés par cette recherche → signal de pertinence
  // réel pour la recommandation (par opposition à l'heuristique par mots-clés).
  const matchedYowyobProducts = results.filter(r => r.source === 'YOWYOB_PRODUCT');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">

        {/* Search Bar + menu waffle + indicateurs — la position détectée est
            affichée discrètement dans le header plutôt qu'ici. */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                defaultValue={query}
                onSearch={handleSearch}
                showSuggestions={true}
              />
            </div>
            {/* Menu waffle Yowyob — style Google Apps */}
            <div className="flex-shrink-0">
              <YowyobProductsMenu />
            </div>
          </div>
          {resolvedIntent && (
            <IntentBanner intent={resolvedIntent} rawQuery={query} />
          )}
        </div>

        {/* Tabs */}
        <div className="mb-3">
          <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Barre de contrôles */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">

          {/* Sélecteur de rayon */}
          {hasGeo && !geo.loading && (
            <RadiusSelector value={radius} onChange={(v) => { setRadius(v); setCurrentPage(1); }} />
          )}

          {/* Compteur de résultats */}
          {!isLoading && hasSearched && results.length > 0 && (
            <span className="ml-auto text-[13px] text-[#70757a] dark:text-gray-500">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </span>
          )}

          {/* Loader */}
          {isLoading && (
            <div className="flex items-center gap-2 text-[13px] text-[#70757a] dark:text-gray-500">
              <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Recherche en cours…
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
              userCity={geo.city ?? undefined}
              onSourceClick={handleResultClick}
              onClose={() => setShowAI(false)}
            />
          ) : (
            <button
              onClick={() => setShowAI(true)}
              className="inline-flex items-center gap-2 mb-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              ✨ Afficher la réponse IA
            </button>
          )
        )}

        {/* Results Section — wrapper flex pour la sidebar Yowyob toujours visible */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Colonne principale ── */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : results.length === 0 && query.trim() !== '' ? (
              <div className="text-center py-20">
                <h3 className="text-xl text-gray-600 dark:text-gray-400">
                  Aucun résultat trouvé pour &quot;{query}&quot;
                  {hasGeo && <span className="block text-sm mt-2 text-gray-400">dans un rayon de {radius} km</span>}
                </h3>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
              <>
                {/* Bandeau fallback : affiché quand la recherche géo n'a rien trouvé */}
                {isFallback && hasGeo && (
                  <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Aucun résultat dans un rayon de {radius} km — voici les résultats disponibles dans toute la base.
                  </div>
                )}
              <div className="flex flex-col gap-6">
                <SponsoredSection results={sponsoredAds} position="top" />
                <PeopleAlsoAsk query={query} />
                <OrganicListWithSections list={organicList} onResultClick={handleResultClick} />
                {organicListAll.length > perPage && (
                  <Pagination current_page={safePage} total_pages={totalPages} on_page_change={setCurrentPage} />
                )}
                <LocalPackSection results={results} query={query} />
                <SponsoredSection results={bottomAds} position="bottom" />
              </div>
              </>
              </div>
            )}
          </div>

          {/* ── Sidebar droite : Yowyob Products + fiche établissement ──
              Empilée sous les résultats en dessous de lg (pas "hidden" : la
              recommandation doit rester visible sur mobile/tablette), et
              collante à droite à partir de lg. */}
          {query.trim() && (
            <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
              <YowyobServicePanel query={query} matchedProducts={matchedYowyobProducts} />
              {selectedBusiness && (
                <BusinessProfilePanel item={selectedBusiness} onClose={() => setSelectedBusiness(null)} />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
