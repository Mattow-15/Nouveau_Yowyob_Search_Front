/**
 * Badge de position de l'utilisateur (affiché dans le header connecté).
 *
 * Source de la position, par ordre de priorité :
 *   1. la position renvoyée par le backend à la connexion (session NextAuth) ;
 *   2. à défaut, une géolocalisation IP côté navigateur (getUserLocation).
 *
 * N'affiche rien tant qu'aucune position n'est disponible.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserLocation } from '@/lib/api/geo-service';

interface DisplayLocation {
  city?: string;
  country?: string;
}

export const UserLocationBadge: React.FC = () => {
  const { data: session } = useSession();
  const [location, setLocation] = useState<DisplayLocation | null>(null);

  useEffect(() => {
    const sessionLocation = (session?.user as any)?.location as DisplayLocation | undefined;
    if (sessionLocation && (sessionLocation.city || sessionLocation.country)) {
      setLocation({ city: sessionLocation.city, country: sessionLocation.country });
      return;
    }

    // Repli : géolocalisation IP côté navigateur (silencieuse).
    let cancelled = false;
    getUserLocation()
      .then((result) => {
        if (!cancelled && result && (result.city || result.country)) {
          setLocation({ city: result.city, country: result.country });
        }
      })
      .catch(() => {
        /* position indisponible : on n'affiche simplement rien */
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!location || (!location.city && !location.country)) {
    return null;
  }

  const label = [location.city, location.country].filter(Boolean).join(', ');

  return (
    <span
      title="Votre position estimée"
      className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800"
    >
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {label}
    </span>
  );
};
