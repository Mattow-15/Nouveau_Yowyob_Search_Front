'use client';

import { useSmartGeolocation } from '@/lib/hooks/ui/use-geolocation';

/**
 * Déclenche la demande de permission de géolocalisation dès le chargement du site,
 * sans attendre qu'un composant de recherche soit monté.
 */
export function GeolocationBootstrap() {
  useSmartGeolocation();
  return null;
}
