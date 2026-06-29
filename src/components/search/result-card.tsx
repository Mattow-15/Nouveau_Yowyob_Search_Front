'use client';

import { SearchResult } from '@/types/search';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDirectionsUrl, openDirections } from './serp/get-directions-url';

interface ResultCardProps {
  result: SearchResult;
}

// Convertit priceLevel (0-4) en symboles $
function getPriceSymbols(level?: number): string {
  if (level === undefined || level === null) return '';
  return '$'.repeat(Math.min(level + 1, 4));
}

// Badge ouvert/fermé
function OpenStatusBadge({ openNow }: { openNow?: boolean }) {
  if (openNow === undefined || openNow === null) return null;
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
      ${openNow
        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${openNow ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      {openNow ? 'Ouvert' : 'Fermé'}
    </span>
  );
}

export default function ResultCard({ result }: ResultCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/search/${result.id}`);
  };

  // Lien « Aller à » : itinéraire calculé directement (cf. getDirectionsUrl).
  const directionsUrl = getDirectionsUrl(result);

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDirections(result); // part de la position de l'utilisateur (IP)
  };

  return (
    <div
      onClick={handleCardClick}
      className="
        group relative flex flex-col bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-xl overflow-hidden shadow-sm
        hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600
        cursor-pointer transition-all duration-200
      "
    >
      {/* Image */}
      <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {result.imageUrl ? (
          <Image
            src={result.imageUrl}
            alt={result.title || result.name || 'Résultat'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">
            {result.category === 'restaurant' ? '🍽️'
              : result.category === 'pharmacy' ? '💊'
              : result.category === 'bank' ? '🏦'
              : result.category === 'hospital' ? '🏥'
              : result.category === 'supermarket' ? '🛒'
              : '🏪'}
          </div>
        )}

        {/* Badge source Google */}
        {result.source === 'google_places' && (
          <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 text-xs font-medium text-gray-600 shadow">
            📍 Google
          </div>
        )}

        {/* Badge source Kernel (annuaire officiel des organisations) */}
        {result.source === 'KERNEL_ORG' && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-emerald-600 text-white rounded-full px-2 py-0.5 text-xs font-medium shadow">
            ✓ Annuaire officiel
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-col gap-2 p-3 flex-1">

        {/* Nom + badges */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
            {result.title}
          </h3>
          <OpenStatusBadge openNow={result.openNow} />
        </div>

        {/* Catégorie + prix */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {result.category && (
            <span className="capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {result.category}
            </span>
          )}
          {result.priceLevel !== undefined && result.priceLevel !== null && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {getPriceSymbols(result.priceLevel)}
            </span>
          )}
        </div>

        {/* Note */}
        {result.rating && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-yellow-400">{'★'.repeat(Math.round(result.rating))}</span>
            <span className="text-gray-600 dark:text-gray-300 font-medium">{result.rating.toFixed(1)}</span>
            {result.reviewsCount && (
              <span className="text-gray-400">({result.reviewsCount} avis)</span>
            )}
          </div>
        )}

        {/* Adresse */}
        {(result.street || result.city) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 line-clamp-1">
            <span>📍</span>
            {result.street ? `${result.street}, ` : ''}{result.city}
          </p>
        )}

        {/* Téléphone */}
        {result.phone && (
          <a
            href={`tel:${result.phone}`}
            onClick={e => e.stopPropagation()}
            className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline w-fit"
          >
            <span>📞</span> {result.phone}
          </a>
        )}

        {/* Boutons bas de carte */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={handleCardClick}
            className="
              flex-1 text-xs py-1.5 px-3 rounded-lg
              bg-blue-600 hover:bg-blue-700 text-white
              transition-colors font-medium
            "
          >
            Voir les détails
          </button>

          {directionsUrl && (
            <button
              onClick={handleDirectionsClick}
              className="
                text-xs py-1.5 px-3 rounded-lg
                border border-gray-300 dark:border-gray-600
                hover:bg-gray-50 dark:hover:bg-gray-700
                text-gray-600 dark:text-gray-300
                transition-colors font-medium
              "
              title="Calculer l'itinéraire vers ce commerce"
            >
              🧭 Aller à
            </button>
          )}
        </div>
      </div>
    </div>
  );
}