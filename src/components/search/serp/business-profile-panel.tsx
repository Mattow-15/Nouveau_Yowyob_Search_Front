'use client';
import React from 'react';
import Link from 'next/link';
import { SearchResult } from '@/types/search';
import { StarRating } from './star-rating';
import { Globe, Phone, MapPin, Clock, ExternalLink, BadgeCheck, Navigation } from 'lucide-react';
import { getDirectionsUrl, openDirections } from './get-directions-url';

interface BusinessProfilePanelProps {
  item: SearchResult | null;
  onClose?: () => void;
}

export function BusinessProfilePanel({ item, onClose }: BusinessProfilePanelProps) {
  if (!item) return null;

  // Statut « Ouvert/Fermé » affiché seulement si on a une donnée fiable (openNow booléen).
  const hasStatus = item.openNow != null;

  const displayImage = item.imageUrl || (item.images && item.images.length > 0 ? item.images[0] : null);

  // Lien « Aller à » : itinéraire calculé directement (cf. getDirectionsUrl).
  const directionsUrl = getDirectionsUrl(item);

  return (
    <div className="bg-white dark:bg-gray-800 border border-[#dadce0] dark:border-gray-700 rounded-2xl overflow-hidden shadow-md sticky top-6">
      {/* Image gallery */}
      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700">
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={item.title || item.name}
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">
            🏪
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Profile info */}
      <div className="p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-[22px] font-normal text-[#202124] dark:text-white leading-tight mb-1">
            {item.title || item.name}
          </h2>
          {item.source === 'KERNEL_ORG' ? (
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white rounded-full px-2.5 py-0.5 text-[11px] font-medium mb-1">
              <BadgeCheck size={12} />
              Annuaire officiel
            </span>
          ) : (
            <span className="text-sm text-[#70757a] dark:text-gray-400 capitalize">
              {item.category || 'Commerce'}
            </span>
          )}
          {item.source === 'KERNEL_ORG' && item.category && (
            <span className="block text-sm text-[#70757a] dark:text-gray-400 capitalize mt-0.5">
              {item.category}
            </span>
          )}
        </div>

        {/* Rating */}
        {item.rating != null && (
          <div className="pb-3 border-b border-[#f1f3f4] dark:border-gray-700">
            <StarRating rating={item.rating} count={item.reviewsCount} size="md" />
            {item.reviewsSummary && (
              <p className="mt-2 text-xs text-[#70757a] dark:text-gray-400 italic">
                &quot;{item.reviewsSummary.split('||')[0]?.trim()}&quot;
              </p>
            )}
          </div>
        )}

        {/* Quick action buttons */}
        <div className="grid grid-cols-3 gap-2 pb-4 border-b border-[#f1f3f4] dark:border-gray-700">
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl border border-[#dadce0] dark:border-gray-600 hover:bg-[#e8f0fe] hover:border-transparent dark:hover:bg-blue-900/20 text-[#1a73e8] dark:text-[#8ab4f8] transition-all text-xs font-medium"
            >
              <Globe size={18} />
              <span>Site Web</span>
            </a>
          )}
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => { e.preventDefault(); openDirections(item); }}
              title="Calculer l'itinéraire vers ce commerce"
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl border border-[#dadce0] dark:border-gray-600 hover:bg-[#e8f0fe] hover:border-transparent dark:hover:bg-blue-900/20 text-[#1a73e8] dark:text-[#8ab4f8] transition-all text-xs font-medium"
            >
              <Navigation size={18} />
              <span>Aller à</span>
            </a>
          )}
          {item.phone && (
            <a
              href={`tel:${item.phone}`}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl border border-[#dadce0] dark:border-gray-600 hover:bg-[#e8f0fe] hover:border-transparent dark:hover:bg-blue-900/20 text-[#1a73e8] dark:text-[#8ab4f8] transition-all text-xs font-medium"
            >
              <Phone size={18} />
              <span>Appeler</span>
            </a>
          )}
        </div>

        {/* Details list */}
        <div className="flex flex-col gap-3 text-[14px] text-[#3c4043] dark:text-gray-200">
          {(item.street || item.city) && (
            <div className="flex gap-2">
              <MapPin className="text-[#70757a] flex-shrink-0 mt-0.5" size={16} />
              <span>
                {[item.street, item.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {(item.openingHours || hasStatus) && (
            <div className="flex gap-2">
              <Clock className="text-[#70757a] flex-shrink-0 mt-0.5" size={16} />
              <div className="flex flex-col">
                {hasStatus && (
                  <span className={item.openNow ? 'text-[#188038] font-semibold' : 'text-[#d93025] font-semibold'}>
                    {item.openNow ? 'Ouvert' : 'Fermé'}
                  </span>
                )}
                {item.openingHours && (
                  <span className="text-[#70757a] dark:text-gray-400 text-xs mt-0.5">
                    {item.openingHours.split('|').map((line, idx) => (
                      <span key={idx} className="block">{line.trim()}</span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          )}

          {item.phone && (
            <div className="flex gap-2">
              <Phone className="text-[#70757a] flex-shrink-0 mt-0.5" size={16} />
              <span>{item.phone}</span>
            </div>
          )}
        </div>

        {/* Liens d'action */}
        <div className="mt-2 pt-3 border-t border-[#f1f3f4] dark:border-gray-700 flex items-center justify-between gap-2">
          <Link
            href={`/search/${item.id}`}
            className="flex items-center gap-1 text-xs text-[#1a73e8] dark:text-[#8ab4f8] hover:underline font-semibold"
          >
            Voir les détails YowYob
            <ExternalLink size={11} />
          </Link>
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#70757a] dark:text-gray-400 hover:text-[#1a73e8] hover:underline"
            >
              <Globe size={11} />
              Visiter le site
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
