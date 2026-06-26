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
     * Get route between two points
     */
    async getRoute(start: GeoLocation, end: GeoLocation, mode: 'driving' | 'walking' | 'cycling' = 'driving'): Promise<RouteInfo | null> {
        try {
            const response = await httpClient.get<any>(`${API_ENDPOINTS.GEO_ROUTE}?startLat=${start.lat}&startLon=${start.lng}&endLat=${end.lat}&endLon=${end.lng}&mode=${mode}`);
            if (response && typeof response.distance === 'number') {
                // Detect backend straight-line fallback:
                // The backend returns duration=0 and only 2 points when it can't reach OSRM.
                // A real route always has duration > 0 and more than 2 waypoints.
                const polylinePoints = response.polyline ? JSON.parse(response.polyline) : [];
                const isRealRoute = response.duration > 0 && polylinePoints.length > 2;

                if (isRealRoute) {
                    console.debug(`Backend OSRM route OK: ${polylinePoints.length} pts, ${(response.distance/1000).toFixed(1)}km, ${Math.round(response.duration/60)}min`);
                    return {
                        distance: response.distance,
                        duration: response.duration,
                        polyline: response.polyline
                    };
                }
                // Backend returned a straight-line fallback → escalate to client-side OSRM
                console.debug('Backend returned straight-line fallback (duration=0 or 2 pts), escalating to client-side OSRM.');
            }
            throw new Error('Backend route unavailable or straight-line fallback detected');
        } catch (error) {
            console.debug('Backend route API unavailable, falling back to client-side OSRM.');
            // Fallback: call OSRM public API directly from the browser
            return this.getRouteFromOsrmDirect(start, end, mode);
        }
    }

    /**
     * Direct client-side call to the OSRM public demo server.
     * Returns real road routing polylines, not a straight line.
     */
    private async getRouteFromOsrmDirect(start: GeoLocation, end: GeoLocation, mode: 'driving' | 'walking' | 'cycling'): Promise<RouteInfo | null> {
        // Map to OSRM profile names
        const profileMap: Record<string, string> = {
            driving: 'driving',
            walking: 'foot',
            cycling: 'bike',
        };
        const profile = profileMap[mode] ?? 'driving';
        const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
        const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`OSRM returned ${res.status}`);
            const data = await res.json();
            const route = data?.routes?.[0];
            if (!route) throw new Error('No route in OSRM response');

            // Convert GeoJSON [lon, lat] → [[lat, lon], ...] for Leaflet
            const points: [number, number][] = route.geometry.coordinates.map(
                ([lon, lat]: [number, number]) => [lat, lon]
            );

            // OSRM snaps coordinates to the nearest road. 
            // If the start/end points are far from a road, the polyline will visually stop before reaching the map marker.
            // Bridge the gap by explicitly adding the exact start and end coordinates:
            if (points.length > 0) {
                points.unshift([start.lat, start.lng]);
                points.push([end.lat, end.lng]);
            }

            return {
                distance: route.distance,
                duration: route.duration,
                polyline: JSON.stringify(points),
            };
        } catch (osrmError) {
            console.warn('Client-side OSRM also failed, using straight-line fallback.', osrmError);
            // Last resort: straight Haversine line
            const directDistance = this.calculateHaversineDistance(start, end);
            return {
                distance: directDistance,
                duration: this.estimateDuration(directDistance, mode),
                polyline: JSON.stringify([[start.lat, start.lng], [end.lat, end.lng]]),
            };
        }
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

