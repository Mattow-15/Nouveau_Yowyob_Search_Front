'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Search, Loader2, MapPin, LocateFixed } from 'lucide-react';
import { HeaderPublic } from '@/components/layout/header-public';
import { HeaderAuthenticated } from '@/components/layout/header-authenticated';
import { searchService } from '@/lib/api/search-service';
import { geoService } from '@/lib/api/geo-service';
import { SearchResult } from '@/types/search';
import { useSearchStore } from '@/store';

// Leaflet n'est rendu QUE côté client (accès à window) → import dynamique sans SSR.
const MapView = dynamic(() => import('@/components/map/map-view'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  ),
});

const YAOUNDE: [number, number] = [3.848, 11.5021];

export default function MapPage() {
  const { data: session } = useSession();
  const { addToHistory } = useSearchStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [locating, setLocating] = useState(false);

  // Lance une recherche réelle (requête vide au montage = peuplement initial de la carte).
  const runSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const res = await searchService.search({ query });
      setResults(res.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    runSearch('');
  }, [runSearch]);

  // Marqueurs = résultats géolocalisés.
  const markers = useMemo(
    () =>
      results
        .filter((r) => r.location && typeof r.location.lat === 'number')
        .map((r) => ({
          id: r.id,
          position: [r.location!.lat, r.location!.lng] as [number, number],
          title: r.name || r.title || 'Sans nom',
          description: [r.category, r.city].filter(Boolean).join(' · '),
        })),
    [results]
  );

  // Centre : la position de l'utilisateur si demandée, sinon le barycentre des marqueurs.
  const center = useMemo<[number, number]>(() => {
    if (userLocation) return userLocation;
    if (markers.length === 0) return YAOUNDE;
    const sum = markers.reduce(
      (acc, m) => [acc[0] + m.position[0], acc[1] + m.position[1]],
      [0, 0]
    );
    return [sum[0] / markers.length, sum[1] / markers.length];
  }, [markers, userLocation]);

  // Zoom plus serré quand on est centré sur l'utilisateur.
  const zoom = userLocation ? 15 : 12;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) addToHistory(q);
    runSearch(q);
  };

  // « Ma position » : GPS du navigateur d'abord (précis), IP en repli.
  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      let loc: { lat: number; lng: number } | null = null;
      try {
        loc = await geoService.getCurrentPosition();
      } catch {
        loc = await geoService.getIpLocation();
      }
      if (loc) setUserLocation([loc.lat, loc.lng]);
    } finally {
      setLocating(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {session ? (
        <HeaderAuthenticated userName={session.user?.name || undefined} />
      ) : (
        <HeaderPublic />
      )}

      {/* Zone carte : remplit tout l'espace restant, sur tout écran (flex-1 + min-h-0). */}
      <div className="relative flex-1 min-h-0">
        <MapView center={center} zoom={zoom} markers={markers} userLocation={userLocation} />

        {/* Bouton « Ma position » (bas-droite, au-dessus de la carte) */}
        <button
          onClick={handleLocate}
          disabled={locating}
          title="Centrer sur ma position"
          aria-label="Centrer sur ma position"
          className="absolute bottom-6 right-4 z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <LocateFixed className="w-5 h-5 text-blue-500" />
          )}
          <span className="hidden sm:inline">Ma position</span>
        </button>

        {/* Barre de recherche flottante (au-dessus de la carte Leaflet) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[92%] max-w-xl px-1">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2 p-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-blue-500 dark:text-blue-400 ml-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un commerce sur la carte…"
                className="flex-1 min-w-0 py-2.5 bg-transparent outline-none text-sm md:text-base text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2 flex-shrink-0" />
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex-shrink-0"
                >
                  Rechercher
                </button>
              )}
            </div>
          </form>

          {/* Compteur de résultats */}
          <div className="mt-2 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              {markers.length} commerce{markers.length > 1 ? 's' : ''} sur la carte
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
