'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { SearchResult } from '@/types/search';
import { geoService } from '@/lib/api/geo-service';

// MapView dépend de Leaflet (window) → import dynamique sans SSR, comme dans la fiche détaillée.
const MapView = dynamic(() => import('@/components/map/map-view'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 animate-pulse flex items-center justify-center text-gray-500">
      Chargement de la carte...
    </div>
  ),
});

interface DirectionsModalProps {
  item: SearchResult;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Carte OpenStreetMap embarquée (in-app) avec calcul d'itinéraire — même expérience
 * que la fiche détaillée. Remplace l'ancienne redirection « Aller à » vers Google Maps.
 */
export default function DirectionsModal({ item, isOpen, onClose }: DirectionsModalProps) {
  const destination: [number, number] = [
    item.latitude ?? item.location?.lat ?? 3.848,
    item.longitude ?? item.location?.lng ?? 11.5021,
  ];

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<Array<[number, number]> | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [routeDetails, setRouteDetails] = useState<{ distance: number; duration: number } | null>(null);

  const handleGetDirections = useCallback(async () => {
    setCalculatingRoute(true);
    setRouteDetails(null);
    try {
      let location = userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null;
      if (!location) location = await geoService.getIpLocation();
      if (!location) { toast.error('Impossible de déterminer votre position'); return; }
      setUserLocation([location.lat, location.lng]);

      const routeInfo = await geoService.getRoute(
        { lat: location.lat, lng: location.lng },
        { lat: destination[0], lng: destination[1] },
        transportMode
      );

      if (routeInfo?.polyline) {
        try {
          const points = JSON.parse(routeInfo.polyline);
          setRoute(points);
          setRouteDetails({ distance: routeInfo.distance, duration: routeInfo.duration });
        } catch {
          setRoute([[location.lat, location.lng], [destination[0], destination[1]]]);
        }
        toast.success('Itinéraire calculé !');
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      toast.error("Erreur lors du calcul de l'itinéraire");
    } finally {
      setCalculatingRoute(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, transportMode, destination[0], destination[1]]);

  // Recalcule l'itinéraire quand on change de mode de transport (si déjà calculé).
  useEffect(() => {
    if (route && userLocation) handleGetDirections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportMode]);

  // Fermeture avec la touche Échap.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              🧭 Itinéraire vers {item.title || item.name}
            </h2>
            {(item.street || item.city) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                📍 {[item.street, item.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contrôles itinéraire */}
        <div className="p-5 pb-3 flex flex-col gap-3">
          <div className="flex gap-2">
            {(['driving', 'walking'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setTransportMode(mode)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  transportMode === mode
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {mode === 'driving' ? '🚗 Voiture' : '🚶 À pied'}
              </button>
            ))}
          </div>

          {routeDetails && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center">
                <div className="text-xs text-gray-500 mb-1">Distance</div>
                <div className="text-xl font-black text-blue-600">
                  {(routeDetails.distance / 1000).toFixed(1)}
                  <span className="text-sm font-medium text-gray-400"> km</span>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center">
                <div className="text-xs text-gray-500 mb-1">Durée</div>
                <div className="text-xl font-black text-green-600">
                  {Math.round(routeDetails.duration / 60)}
                  <span className="text-sm font-medium text-gray-400"> min</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => { if (!calculatingRoute) handleGetDirections(); }}
            disabled={calculatingRoute}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {calculatingRoute ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Calcul en cours...
              </>
            ) : (
              "📍 Montrer l'itinéraire"
            )}
          </button>
        </div>

        {/* Carte */}
        <div className="px-5 pb-5 flex-1 min-h-0">
          <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <MapView
              center={destination}
              zoom={15}
              markers={[{
                id: item.id,
                position: destination,
                title: item.title || item.name || '',
                description: item.city || '',
              }]}
              userLocation={userLocation || undefined}
              route={route || undefined}
              transportMode={transportMode}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Commerce
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Vous
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
