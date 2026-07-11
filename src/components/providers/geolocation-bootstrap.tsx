'use client';

import { GeolocationProvider } from '@/lib/hooks/ui/use-geolocation';

/**
 * Déclenche la résolution de la géolocalisation dès le chargement du site et la
 * partage à toute l'app via un contexte, pour qu'un seul GPS + géocodage inverse
 * s'exécute (au lieu d'une instance par composant consommateur).
 */
export function GeolocationBootstrap({ children }: { children: React.ReactNode }) {
  return <GeolocationProvider>{children}</GeolocationProvider>;
}
