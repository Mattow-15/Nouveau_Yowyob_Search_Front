'use client';

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { geoService } from '@/lib/api/geo-service';

export type GeoSource = 'gps' | 'ip' | null;

export interface SmartGeolocationState {
  latitude: number | null;
  longitude: number | null;
  /** Vraie ville (ex. "Yaoundé") — à utiliser pour tout ce qui part vers le
   *  backend/l'IA : un quartier ("Melen") envoyé comme ville n'est pas reconnu
   *  et fausse le raisonnement ("pas de résultats à Melen" au lieu de chercher
   *  dans Yaoundé, dont Melen fait partie). */
  city: string | null;
  /** Quartier précis si connu (ex. "Melen") — pour l'affichage uniquement. */
  quartier: string | null;
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
  quartier: string | null;
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
        quartier: c.quartier ?? null,
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
 *
 * ⚠️ Ne pas appeler directement dans plusieurs composants : chaque appel déclenche
 * son propre GPS + géocodage inverse Nominatim, sans coordination entre eux (deux
 * requêtes concurrentes peuvent retourner des quartiers différents pour la même
 * position). Utiliser `useSmartGeolocation()` (qui lit le contexte partagé) à la
 * place — cette fonction interne n'est appelée qu'une seule fois par `GeolocationProvider`.
 */
function useGeolocationResolver(): SmartGeolocationState {
  const [state, setState] = useState<SmartGeolocationState>({
    latitude: null,
    longitude: null,
    city: null,
    quartier: null,
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
          // La géoloc IP ne donne qu'une précision ville, jamais de quartier.
          setState({
            latitude: ipLocation.lat,
            longitude: ipLocation.lng,
            city,
            quartier: null,
            country,
            source: 'ip',
            error: null,
            loading: false,
          });
          writeGeoCache({
            latitude: ipLocation.lat,
            longitude: ipLocation.lng,
            city,
            quartier: null,
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
      async (position) => {
        if (cancelled) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Appliquer immédiatement les coordonnées GPS (sans attendre le reverse geocode)
        const cachedCity     = cached?.state.city     ?? null;
        const cachedQuartier = cached?.state.quartier ?? null;
        const cachedCountry  = cached?.state.country  ?? null;
        setState({ latitude: lat, longitude: lng, city: cachedCity, quartier: cachedQuartier, country: cachedCountry, source: 'gps', error: null, loading: false });

        // Reverse geocode Nominatim pour avoir le vrai nom de quartier/ville
        // (évite d'afficher la ville IP qui est souvent fausse — ex: Mbankomo au lieu de Melen).
        // city et quartier sont deux champs distincts et ne doivent JAMAIS être
        // confondus : city part vers le backend/l'IA (doit être une vraie ville,
        // "Melen" envoyé comme ville n'est reconnu par rien) ; quartier ne sert
        // qu'à l'affichage, pour la précision ("Melen" plutôt que juste "Yaoundé").
        let city     = cachedCity;
        let quartier = cachedQuartier;
        let country  = cachedCountry;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
            { headers: { 'User-Agent': 'YowYob-Frontend-Client' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data?.address ?? {};
            city     = addr.city ?? addr.town ?? addr.county ?? cachedCity;
            quartier = addr.suburb ?? addr.neighbourhood ?? cachedQuartier;
            country  = addr.country ?? cachedCountry;
          }
        } catch { /* reverse geocode optionnel — on garde la ville du cache si échec */ }

        if (cancelled) return;
        setState({ latitude: lat, longitude: lng, city, quartier, country, source: 'gps', error: null, loading: false });
        writeGeoCache({ latitude: lat, longitude: lng, city, quartier, country, source: 'gps' });
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

// ── Contexte partagé ─────────────────────────────────────────────────────────
// Une seule résolution GPS/IP + géocodage inverse pour toute l'app, quel que soit
// le nombre de composants qui consomment la position (évite les appels concurrents
// à Nominatim qui peuvent retourner des quartiers incohérents pour la même position).
const GeolocationContext = createContext<SmartGeolocationState | null>(null);

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const state = useGeolocationResolver();
  return (
    <GeolocationContext.Provider value={state}>
      {children}
    </GeolocationContext.Provider>
  );
}

const NO_PROVIDER_STATE: SmartGeolocationState = {
  latitude: null,
  longitude: null,
  city: null,
  quartier: null,
  country: null,
  source: null,
  error: null,
  loading: false,
};

/** Lit la position résolue par `GeolocationProvider` (monté dans le layout racine). */
export function useSmartGeolocation(): SmartGeolocationState {
  const ctx = useContext(GeolocationContext);
  return ctx ?? NO_PROVIDER_STATE;
}

/** Hook legacy maintenu pour la compatibilité — GPS only, sans repli IP. */
export function useGeolocation() {
  const { latitude, longitude, error, loading } = useSmartGeolocation();
  return { latitude, longitude, error, loading };
}
