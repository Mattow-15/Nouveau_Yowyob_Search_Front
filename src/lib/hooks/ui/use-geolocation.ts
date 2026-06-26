/**
 * useSmartGeolocation hook
 * Strategy: GPS (navigator.geolocation) first, then IP-based fallback.
 * @author YowYob Team
 * @updated 2026-04-04
 */

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

/**
 * Smart geolocation hook:
 * 1. Tries the browser GPS (high accuracy, instant if already granted).
 * 2. Falls back to IP-based geolocation via the backend (/api/geo/ip-location).
 *
 * Exposes `source` so the UI can show "via GPS" vs "via IP".
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

    const applyIpFallback = async () => {
      try {
        const ipLocation = await geoService.getIpLocation();
        if (!cancelled) {
          if (ipLocation) {
            setState({
              latitude: ipLocation.lat,
              longitude: ipLocation.lng,
              city: (ipLocation as any).city ?? null,
              country: (ipLocation as any).country ?? null,
              source: 'ip',
              error: null,
              loading: false,
            });
          } else {
            setState(prev => ({
              ...prev,
              source: null,
              error: 'Impossible de déterminer la position',
              loading: false,
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            source: null,
            error: 'Erreur de géolocalisation IP',
            loading: false,
          }));
        }
      }
    };

    if (!navigator.geolocation) {
      applyIpFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!cancelled) {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: null,
            country: null,
            source: 'gps',
            error: null,
            loading: false,
          });
        }
      },
      (_err) => {
        // GPS denied or timed out → fall back to IP
        applyIpFallback();
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/**
 * Legacy hook kept for backward compatibility.
 * Uses GPS only (no IP fallback).
 */
export function useGeolocation() {
  const { latitude, longitude, error, loading } = useSmartGeolocation();
  return { latitude, longitude, error, loading };
}