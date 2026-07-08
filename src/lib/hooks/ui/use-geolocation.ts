'use client';

import { useState, useEffect } from 'react';
import { geoService } from '@/lib/api/geo-service';

export type GeoSource = 'gps' | 'ip' | null;

export interface SmartGeolocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  source: GeoSource;
  error: string | null;
  loading: boolean;
}

// ── Cache localStorage ─────────────────────────────────────────────────────
// Évite de redemander la position à chaque navigation : la première recherche
// dispose toujours de coordonnées sans attendre le GPS ni l'IP.
const GEO_CACHE_KEY = 'yowyob_geo_cache';
const GPS_TTL_MS    = 30 * 60 * 1000;   // 30 min  (position mobile stable)
const IP_TTL_MS     = 6  * 60 * 60 * 1000; // 6 h (IP quasi-statique)

interface CachedGeo {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  source: 'gps' | 'ip';
  timestamp: number;
}

function readGeoCache(): { state: SmartGeolocationState; fresh: boolean } | null {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const c: CachedGeo = JSON.parse(raw);
    if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) return null;
    const ttl   = c.source === 'gps' ? GPS_TTL_MS : IP_TTL_MS;
    const fresh = Date.now() - c.timestamp < ttl;
    return {
      state: {
        latitude: c.latitude,
        longitude: c.longitude,
        city: c.city,
        country: c.country,
        source: c.source,
        error: null,
        loading: false,
      },
      fresh,
    };
  } catch {
    return null;
  }
}

function writeGeoCache(data: Omit<CachedGeo, 'timestamp'>) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
  } catch {}
}
// ──────────────────────────────────────────────────────────────────────────

/**
 * Smart geolocation hook — stratégie :
 * 1. Lit le cache localStorage → position disponible immédiatement (élimine
 *    la race condition avec la première recherche).
 * 2. Si le cache est encore frais → s'arrête là (économise GPS et requête IP).
 * 3. Sinon, tente le GPS navigateur (haute précision).
 * 4. Si GPS refusé/timeout → repli sur géoloc IP.
 * 5. Écrit le cache à chaque succès (GPS ou IP).
 *
 * Expose `source` ('gps' | 'ip' | null) pour affichage dans l'UI.
 */
export function useSmartGeolocation(): SmartGeolocationState {
  const [state, setState] = useState<SmartGeolocationState>({
    latitude: null,
    longitude: null,
    city: null,
    country: null,
    source: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    // ── Étape 1 : appliquer le cache immédiatement ─────────────────────
    const cached = readGeoCache();
    if (cached && !cancelled) {
      setState(cached.state);
      if (cached.fresh) return; // Cache frais → pas besoin de rafraîchir
    }

    // ── Étape 2 : repli IP (si GPS absent ou refusé) ───────────────────
    const applyIpFallback = async () => {
      try {
        const ipLocation = await geoService.getIpLocation();
        if (cancelled) return;
        if (ipLocation && Number.isFinite(ipLocation.lat) && Number.isFinite(ipLocation.lng)) {
          const city    = (ipLocation as any).city    ?? null;
          const country = (ipLocation as any).country ?? null;
          setState({
            latitude: ipLocation.lat,
            longitude: ipLocation.lng,
            city,
            country,
            source: 'ip',
            error: null,
            loading: false,
          });
          writeGeoCache({
            latitude: ipLocation.lat,
            longitude: ipLocation.lng,
            city,
            country,
            source: 'ip',
          });
        } else {
          setState(prev => ({
            ...prev,
            source: null,
            error: 'Impossible de déterminer la position',
            loading: false,
          }));
        }
      } catch {
        if (!cancelled) {
          setState(prev => ({ ...prev, source: null, error: 'Erreur géolocalisation IP', loading: false }));
        }
      }
    };

    // ── Étape 3 : GPS navigateur ───────────────────────────────────────
    if (!navigator.geolocation) {
      applyIpFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const lat     = position.coords.latitude;
        const lng     = position.coords.longitude;
        // Conserver la ville du cache (GPS ne fournit pas le nom de ville)
        const city    = cached?.state.city    ?? null;
        const country = cached?.state.country ?? null;
        setState({ latitude: lat, longitude: lng, city, country, source: 'gps', error: null, loading: false });
        writeGeoCache({ latitude: lat, longitude: lng, city, country, source: 'gps' });
      },
      () => {
        if (cancelled) return;
        // GPS refusé ou timeout
        if (cached) {
          // Cache déjà appliqué, juste marquer loading: false au cas où
          setState(prev => ({ ...prev, loading: false }));
        } else {
          applyIpFallback();
        }
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60_000 },
    );

    return () => { cancelled = true; };
  }, []);

  return state;
}

/** Hook legacy maintenu pour la compatibilité — GPS only, sans repli IP. */
export function useGeolocation() {
  const { latitude, longitude, error, loading } = useSmartGeolocation();
  return { latitude, longitude, error, loading };
}
