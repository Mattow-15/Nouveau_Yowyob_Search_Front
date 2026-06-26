'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { StarRating } from './star-rating';
import { getExternalUrl } from './get-external-url';
import { getDirectionsUrl, openDirections } from './get-directions-url';

interface LocalPackProps {
  results: SearchResult[];
  query: string;
}

const categoryEmoji: Record<string, string> = {
  restaurant: '🍽️', pharmacy: '💊', bank: '🏦', hospital: '🏥',
  supermarket: '🛒', hotel: '🏨', gas_station: '⛽', store: '🏪',
  school: '🏫', church: '⛪', default: '📍',
};

function getEmoji(cat?: string): string {
  if (!cat) return categoryEmoji.default;
  const lower = cat.toLowerCase();
  for (const key of Object.keys(categoryEmoji)) {
    if (lower.includes(key)) return categoryEmoji[key];
  }
  return categoryEmoji.default;
}

export function LocalPackSection({ results, query }: LocalPackProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const localResults = results.filter(r => r.latitude || r.location?.lat).slice(0, 3);

  if (localResults.length === 0) return null;

  // Build embed map centered on first result
  const first = localResults[0];
  const lat = first.latitude || first.location?.lat || 3.848;
  const lng = first.longitude || first.location?.lng || 11.502;
  const delta = 0.025;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="mb-6 rounded-2xl border border-[#dadce0] dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Header Local Pack */}
      <div className="bg-white dark:bg-gray-800 px-4 py-2 border-b border-[#dadce0] dark:border-gray-700 flex items-center justify-between">
        <span className="text-[15px] font-medium text-[#202124] dark:text-white">
          Résultats locaux pour « {query} »
        </span>
        <span className="text-[13px] text-[#1a73e8] cursor-pointer hover:underline">
          Voir plus ›
        </span>
      </div>

      {/* Map */}
      <div className="h-[200px] w-full bg-[#e8eaed] relative">
        <iframe
          src={mapUrl}
          className="w-full h-full border-0"
          title="Local Pack Map"
          loading="lazy"
        />
        {/* Map pins overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {localResults.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id === selected ? null : r.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold shadow transition-all
                ${r.id === selected
                  ? 'bg-[#1a73e8] text-white scale-105'
                  : 'bg-white text-[#1a73e8] hover:bg-[#e8f0fe]'}`}
            >
              <span className="font-bold text-[13px]">{i + 1}</span>
              <span className="max-w-[80px] truncate">{r.title || r.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Local results list */}
      <div className="divide-y divide-[#f1f3f4] dark:divide-gray-700 bg-white dark:bg-gray-800">
        {localResults.map((item, idx) => {
          // Statut affiché seulement si openNow est réellement connu (pas d'horaires fixes → pas de Ouvert/Fermé).
          const hasStatus = item.openNow != null;
          return (
            <div
              key={item.id}
              className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-gray-700/50 transition-colors ${item.id === selected ? 'bg-[#e8f0fe] dark:bg-blue-900/20' : ''}`}
              onClick={() => {
                setSelected(item.id === selected ? null : item.id);
                window.open(getExternalUrl(item), '_blank', 'noopener,noreferrer');
              }}
            >
              {/* Number pin */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[12px] font-bold mt-0.5">
                {idx + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium text-[#202124] dark:text-white leading-tight">
                      {item.title || item.name}
                    </h3>
                    {item.source === 'KERNEL_ORG' && (
                      <span className="inline-flex items-center gap-1 mt-0.5 bg-emerald-600 text-white rounded-full px-2 py-0.5 text-[11px] font-medium">
                        ✓ Annuaire officiel
                      </span>
                    )}
                  </div>
                  {/* Thumbnail */}
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-[#dadce0]"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>

                {/* Rating */}
                {item.rating && (
                  <div className="mt-0.5">
                    <StarRating rating={item.rating} count={item.reviewsCount} />
                  </div>
                )}

                {/* Category · Price */}
                <div className="text-[13px] text-[#70757a] dark:text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                  <span>{getEmoji(item.category)}</span>
                  <span className="capitalize">{item.category || 'Commerce'}</span>
                  {item.priceLevel != null && (
                    <span className="text-[#188038]"> · {'€'.repeat(Math.min(item.priceLevel + 1, 4))}</span>
                  )}
                </div>

                {/* Address */}
                {(item.street || item.city) && (
                  <div className="text-[13px] text-[#70757a] dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <span>📍</span>
                    <span>{[item.street, item.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {/* Hours status — masqué si ni statut fiable ni horaires */}
                {(hasStatus || item.openingHours) && (
                  <div className="text-[13px] mt-0.5 flex items-center gap-1">
                    {hasStatus && (
                      <span className={item.openNow ? 'text-[#188038] font-medium' : 'text-[#d93025] font-medium'}>
                        {item.openNow ? 'Ouvert' : 'Fermé'}
                      </span>
                    )}
                    {item.openingHours && (
                      <span className="text-[#70757a]">{hasStatus ? '· ' : ''}{item.openingHours.split('|')[0]?.trim()}</span>
                    )}
                  </div>
                )}

                {/* CTA buttons */}
                <div className="flex gap-2 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  {getDirectionsUrl(item) && (
                    <a
                      href={getDirectionsUrl(item)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => { e.preventDefault(); openDirections(item); }}
                      title="Calculer l'itinéraire vers ce commerce"
                      className="flex items-center gap-1 text-[12px] text-[#1a73e8] border border-[#dadce0] rounded-full px-3 py-1 hover:bg-[#e8f0fe] transition-colors"
                    >
                      🧭 Aller à
                    </a>
                  )}
                  {item.website && (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-[#1a73e8] border border-[#dadce0] rounded-full px-3 py-1 hover:bg-[#e8f0fe] transition-colors"
                    >
                      🌐 Site
                    </a>
                  )}
                  {item.phone && (
                    <a
                      href={`tel:${item.phone}`}
                      className="flex items-center gap-1 text-[12px] text-[#1a73e8] border border-[#dadce0] rounded-full px-3 py-1 hover:bg-[#e8f0fe] transition-colors"
                    >
                      📞 Appeler
                    </a>
                  )}
                  <Link
                    href={`/search/${item.id}`}
                    className="flex items-center gap-1 text-[12px] text-[#70757a] border border-[#dadce0] rounded-full px-3 py-1 hover:bg-[#f1f3f4] hover:text-[#1a73e8] transition-colors"
                  >
                    <ExternalLink size={11} />
                    Détails
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
