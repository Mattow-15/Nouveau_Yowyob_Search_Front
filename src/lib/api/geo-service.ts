import { httpClient } from './http-client';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface GeoLocation {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
}

export interface RouteInfo {
    distance: number; // in meters
    duration: number; // in seconds
    isEstimate?: boolean; // true quand OSRM a échoué → distance Haversine corrigée
    polyline: string; // encoded polyline or simple list of points
}

class GeoService {
    /**
     * Get user location based on IP address (inferred by backend)
     */
    async getIpLocation(): Promise<GeoLocation | null> {
        // Fournisseurs de géoloc IP HTTPS, sans clé. Chacun localise l'IP appelante
        // (celle du navigateur de l'utilisateur), pas besoin de fournir l'IP.
        // Essayés dans l'ordre jusqu'au premier qui répond → robuste si l'un tombe
        // ou est rate-limité (cas réel observé : ipapi.co renvoie "RateLimited").
        const providers: Array<{ url: string; parse: (d: any) => GeoLocation | null }> = [
            {
                url: 'https://ipwho.is/',
                parse: d => (d?.success && d.latitude != null)
                    ? { lat: d.latitude, lng: d.longitude, city: d.city, country: d.country }
                    : null,
            },
            {
                url: 'https://ipapi.co/json/',
                parse: d => (!d?.error && d?.latitude != null)
                    ? { lat: parseFloat(d.latitude), lng: parseFloat(d.longitude), city: d.city, country: d.country_name }
                    : null,
            },
            {
                url: 'https://ip-api.com/json/?fields=status,lat,lon,city,country',
                parse: d => (d?.status === 'success' && d.lat != null)
                    ? { lat: d.lat, lng: d.lon, city: d.city, country: d.country }
                    : null,
            },
        ];

        for (const provider of providers) {
            try {
                const res = await fetch(provider.url);
                if (!res.ok) continue;
                const loc = provider.parse(await res.json());
                if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) return loc;
            } catch {
                // fournisseur indisponible → on tente le suivant
            }
        }

        // Dernier recours : le backend infère l'IP depuis les en-têtes de la requête.
        try {
            const endpoint = API_ENDPOINTS.GEO_DISTANCE.replace('/distance', '/ip-location');
            const response = await httpClient.get<any>(endpoint);
            if (response && response.latitude && response.longitude) {
                return {
                    lat: response.latitude,
                    lng: response.longitude,
                    city: response.city,
                    country: response.country
                };
            }
        } catch (error) {
            console.warn('Backend ip-location failed:', error);
        }
        return null;
    }

    /**
     * Geocode an address to get its coordinates
     */
    async geocode(address: string): Promise<GeoLocation | null> {
        try {
            // First try backend API
            const response = await httpClient.get<any>(`${API_ENDPOINTS.GEO_GEOCODE}?address=${encodeURIComponent(address)}`);
            if (response && response.latitude && response.longitude) {
                return {
                    lat: response.latitude,
                    lng: response.longitude,
                    city: response.address // The backend might return address string in address field
                };
            }
            return null;
        } catch (error) {
            console.warn('Backend geocode failed, falling back to client-side Nominatim:', error);
            // Fallback to client-side Nominatim if backend Docker container has network issues
            try {
                // Restrict search to Cameroon (&countrycodes=cm) to avoid geocoding 
                // ambiguous names (like "Bastos") to other countries (e.g., Brazil).
                const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=cm`;
                const nomResponse = await fetch(nominatimUrl, {
                    headers: { 'User-Agent': 'YowYob-Frontend-Client' }
                });
                if (nomResponse.ok) {
                    const data = await nomResponse.json();
                    if (data && data.length > 0) {
                        return {
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon),
                            city: data[0].display_name
                        };
                    }
                }
            } catch (fallbackError) {
                console.error('Failed to geocode address (both backend and fallback failed):', fallbackError);
            }
            return null;
        }
    }

    /**
     * Get browser geolocation
     */
    getCurrentPosition(): Promise<GeoLocation> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }

    /**
     * Calculate distance between two points
     */
    async getDistance(loc1: GeoLocation, loc2: GeoLocation): Promise<number | null> {
        try {
            const response = await httpClient.post<any>(API_ENDPOINTS.GEO_DISTANCE, {
                lat1: loc1.lat,
                lon1: loc1.lng,
                lat2: loc2.lat,
                lon2: loc2.lng
            });
            // Backend returns DistanceResponse with distanceKm and distanceMiles
            return response.distanceKm ? response.distanceKm * 1000 : null; // Return in meters
        } catch (error) {
            console.error('Failed to calculate distance:', error);
            return null;
        }
    }

    /**
     * Get route between two points
     */
    /**
     * Calculate Haversine distance in meters
     */
    private calculateHaversineDistance(loc1: GeoLocation, loc2: GeoLocation): number {
        const R = 6371e3; // metres
        const φ1 = loc1.lat * Math.PI / 180;
        const φ2 = loc2.lat * Math.PI / 180;
        const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
        const Δλ = (loc2.lng - loc1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Calcule un itinéraire via OSRM public (router.project-osrm.org).
     * Le backend geo/route requiert une auth non disponible côté client.
     */
    async getRoute(start: GeoLocation, end: GeoLocation, mode: 'driving' | 'walking' | 'cycling' = 'driving'): Promise<RouteInfo | null> {
        // OSRM public (router.project-osrm.org) renvoie les mêmes données pour tous
        // les profils sur les données africaines — seul `driving` est fiable pour le tracé.
        // On utilise donc toujours `driving` pour obtenir la distance routière réelle et
        // le tracé précis, puis on recalcule la durée selon le mode (vitesses ci-dessous).
        const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;

        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);

            if (res.ok) {
                const data = await res.json();
                const osrmRoute = data?.routes?.[0];
                if (osrmRoute?.geometry?.coordinates?.length) {
                    // GeoJSON [lon, lat] → [[lat, lon]] pour Leaflet
                    const points: [number, number][] = osrmRoute.geometry.coordinates.map(
                        ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
                    );
                    points.unshift([start.lat, start.lng]);
                    points.push([end.lat, end.lng]);

                    return {
                        distance: osrmRoute.distance,
                        // Durée recalculée selon le mode : OSRM foot/bike = données voiture en Afrique
                        duration: this.estimateDuration(osrmRoute.distance, mode),
                        polyline: JSON.stringify(points),
                    };
                }
            }
        } catch {
            // OSRM indisponible → fallback Haversine
        }

        // Fallback : ligne droite Haversine × 1.3 (correction route réelle Cameroun)
        const directDistance = this.calculateHaversineDistance(start, end);
        const roadCorrected = directDistance * 1.3;
        return {
            distance: roadCorrected,
            duration: this.estimateDuration(roadCorrected, mode),
            polyline: JSON.stringify([[start.lat, start.lng], [end.lat, end.lng]]),
            isEstimate: true,
        };
    }

    private estimateDuration(distance: number, mode: 'driving' | 'walking' | 'cycling'): number {
        // Speeds in m/s
        let speed = 13.8; // Driving: ~50 km/h
        if (mode === 'walking') speed = 1.4; // Walking: ~5 km/h
        if (mode === 'cycling') speed = 5.5; // Cycling: ~20 km/h
        return distance / speed;
    }
}

export const geoService = new GeoService();

export const getUserLocation = async (): Promise<GeoLocation | null> => {

  // Tentative 1 : localisation par IP (silencieuse, pas de pop-up)
  try {
    const ipLocation = await geoService.getIpLocation();
    if (ipLocation) return ipLocation;
  } catch {
    // IP échouée → on tente le GPS silencieusement
  }

  // Tentative 2 : GPS navigateur en fallback silencieux
  const gpsSupported = typeof window !== 'undefined'
    && 'geolocation' in navigator;

  if (gpsSupported) {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 60000,
          });
        }
      );
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch {
      // GPS aussi échoué — on abandonne proprement
    }
  }

  return null;
};

