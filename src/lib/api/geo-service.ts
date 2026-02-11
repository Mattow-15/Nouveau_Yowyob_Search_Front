import { httpClient } from './http-client';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface GeoLocation {
    lat: number;
    lng: number;
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
        try {
            // Call backend without IP parameter to let it infer from headers
            const response = await httpClient.get<any>(`${API_ENDPOINTS.GEO_DISTANCE.replace('/distance', '/ip-location')}`);
            if (response && response.latitude && response.longitude) {
                return {
                    lat: response.latitude,
                    lng: response.longitude
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to get IP location:', error);
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
            return response.distance;
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
            // Ensure we have valid numbers
            if (response && typeof response.distance === 'number') {
                return {
                    distance: response.distance,
                    duration: response.duration || this.estimateDuration(response.distance, mode),
                    polyline: response.polyline
                };
            }
            throw new Error('Invalid response from route service');
        } catch (error) {
            console.debug('Route API unavailable, using Haversine fallback.');
            // Fallback: Calculate direct distance client-side
            const directDistance = this.calculateHaversineDistance(start, end);

            return {
                distance: directDistance,
                duration: this.estimateDuration(directDistance, mode),
                polyline: JSON.stringify([
                    [start.lat, start.lng],
                    [end.lat, end.lng]
                ])
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
