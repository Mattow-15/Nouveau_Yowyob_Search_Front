'use client';
import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { getExternalUrl } from './get-external-url';

interface SponsoredSectionProps {
  results: SearchResult[];
  position?: 'top' | 'bottom';
}

export function SponsoredSection({ results, position = 'top' }: SponsoredSectionProps) {
  if (results.length === 0) return null;

  return (
    <div className={`mb-4 ${position === 'bottom' ? 'mt-6 mb-0' : ''}`}>
      {results.map((item, idx) => {
        const externalUrl = getExternalUrl(item);
        return (
          <div
            key={item.id}
            className="group py-3 border-b border-[#f1f3f4] last:border-0 hover:bg-[#f8f9fa] -mx-2 px-2 rounded transition-colors cursor-pointer"
            onClick={() => {
              if (externalUrl) window.open(externalUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            {/* Sponsored badge + URL */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-medium text-[#188038] border border-[#188038] rounded px-1.5 py-px leading-none">
                Sponsorisé
              </span>
              <span className="text-[#1a0dab] dark:text-[#8ab4f8] text-sm flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#f1f3f4] dark:bg-gray-700 flex items-center justify-center text-[10px]">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full rounded-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  ) : '🏪'}
                </span>
                <span className="text-[#202124] dark:text-gray-200 text-sm">{item.title || item.name}</span>
                <span className="text-[#70757a]">›</span>
                <span className="text-[#70757a] text-xs">{item.website ? item.website.replace(/https?:\/\//, '').replace(/\/$/, '').substring(0, 30) : item.city || 'yowyob.com'}</span>
                {externalUrl && <ExternalLink size={11} className="text-[#70757a] opacity-60" />}
              </span>
            </div>
            {/* Title */}
            <h3 className="text-[#1a0dab] dark:text-[#8ab4f8] text-[18px] font-normal group-hover:underline leading-tight">
              {item.title || item.name}
              {item.priceLevel ? ` — ${['', 'Économique', 'Modéré', 'Cher', 'Très cher'][item.priceLevel]}` : ''}
            </h3>
            {/* Description */}
            <p className="text-[14px] text-[#4d5156] dark:text-gray-300 leading-snug mt-0.5 line-clamp-2">
              {item.description || `${item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Commerce'} situé à ${item.city || 'Cameroun'}. Appelez maintenant ou visitez notre site.`}
              {item.phone && ` · ${item.phone}`}
            </p>
            {/* Ad extensions */}
            <div className="flex gap-3 mt-1.5 flex-wrap">
              {item.phone && (
                <a href={`tel:${item.phone}`} onClick={e => e.stopPropagation()} className="text-[#1a0dab] dark:text-[#8ab4f8] text-[13px] hover:underline">
                  📞 Appeler
                </a>
              )}
              {item.googleMapsUrl && (
                <a href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[#1a0dab] dark:text-[#8ab4f8] text-[13px] hover:underline">
                  📍 Itinéraire
                </a>
              )}
              {item.website && (
                <a href={item.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[#1a0dab] dark:text-[#8ab4f8] text-[13px] hover:underline">
                  🌐 Site web
                </a>
              )}
              <Link
                href={`/search/${item.id}`}
                onClick={e => e.stopPropagation()}
                className="text-[13px] text-[#70757a] hover:text-[#1a73e8] hover:underline flex items-center gap-0.5"
              >
                Fiche détaillée ›
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
