'use client';
import React from 'react';
import Link from 'next/link';
import { ExternalLink, BadgeCheck } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { StarRating } from './star-rating';
import { getExternalUrl } from './get-external-url';
import { getDirectionsUrl, openDirections } from './get-directions-url';

interface OrganicResultProps {
  item: SearchResult;
  onClick?: (item: SearchResult) => void;
}

export function OrganicResult({ item, onClick }: OrganicResultProps) {
  const displayImage = item.imageUrl || (item.images && item.images.length > 0 ? item.images[0] : null);
  // Statut affiché seulement si réellement connu (openNow booléen). Pas d'horaires fixes → pas de Ouvert/Fermé.
  const isOpen = item.openNow;

  const externalUrl = getExternalUrl(item);
  const directionsUrl = getDirectionsUrl(item);
  const displayUrl = externalUrl
    ? externalUrl.replace(/https?:\/\//, '').replace(/\/$/, '').substring(0, 55)
    : `yowyob.com/etablissement/${item.id}`;

  const handleTitleClick = () => {
    onClick?.(item);
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Pas de site web : on ouvre la fiche interne
      window.location.href = `/search/${item.id}`;
    }
  };

  return (
    <div className="group py-4 border-b border-[#ebebeb] dark:border-gray-800 last:border-0">
      {/* Breadcrumb / URL line */}
      <div className="flex items-center gap-1.5 mb-0.5">
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt=""
            className="w-[18px] h-[18px] rounded-full object-cover border border-[#dadce0]"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="w-[18px] h-[18px] rounded-full bg-[#f1f3f4] dark:bg-gray-700 flex items-center justify-center text-[10px]">
            🏪
          </span>
        )}
        <div className="flex flex-col leading-none">
          <span className="text-[12px] text-[#202124] dark:text-gray-200">
            {item.title || item.name}
          </span>
          <span className="text-[12px] text-[#4d5156] dark:text-gray-400">
            {displayUrl}
          </span>
        </div>
      </div>

      {/* Title — clic → URL externe */}
      <h3
        className="text-[20px] font-normal text-[#1a0dab] dark:text-[#8ab4f8] group-hover:underline leading-tight cursor-pointer mb-1 flex items-center gap-1.5 flex-wrap"
        onClick={handleTitleClick}
      >
        <span>{item.title || item.name}{item.city ? ` — ${item.city}` : ''}</span>
        {externalUrl && <ExternalLink size={14} className="opacity-40 flex-shrink-0" />}
      </h3>
      {/* Badge Annuaire officiel — visible uniquement pour les agences Kernel */}
      {item.source === 'KERNEL_ORG' && (
        <span className="inline-flex items-center gap-1 mb-1 bg-emerald-600 text-white rounded-full px-2.5 py-0.5 text-[11px] font-medium">
          <BadgeCheck size={12} />
          Annuaire officiel
        </span>
      )}

      {/* Meta description */}
      <div className="text-[14px] text-[#4d5156] dark:text-gray-300 leading-[1.58] line-clamp-2">
        {/* Date-like prefix */}
        <span className="text-[#70757a] dark:text-gray-400">
          {item.category ? `${item.category.charAt(0).toUpperCase() + item.category.slice(1)} · ` : ''}
        </span>
        {item.description
          || `Découvrez ${item.title || item.name}${item.city ? ` à ${item.city}` : ''}. ${item.phone ? `Appelez le ${item.phone}.` : ''} ${item.openingHours ? `Horaires : ${item.openingHours.split('|')[0]?.trim()}` : ''}`
        }
      </div>

      {/* Rich snippet: Rating + Hours + Price */}
      {(item.rating || item.openingHours || item.priceLevel != null) && (
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {item.rating != null && (
            <StarRating rating={item.rating} count={item.reviewsCount} />
          )}
          {item.priceLevel != null && (
            <span className="text-[13px] text-[#70757a]">
              Gamme de prix : <span className="text-[#188038] font-medium">{'€'.repeat(Math.min(item.priceLevel + 1, 4))}</span>
            </span>
          )}
          {isOpen !== undefined && (
            <span className={`text-[13px] font-medium ${isOpen ? 'text-[#188038]' : 'text-[#d93025]'}`}>
              {isOpen ? '● Ouvert' : '● Fermé'}
            </span>
          )}
        </div>
      )}

      {/* Sitelinks — mini quick actions */}
      <div className="flex gap-3 mt-2 flex-wrap">
        <Link
          href={`/search/${item.id}`}
          onClick={e => e.stopPropagation()}
          className="text-[13px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
        >
          Fiche détaillée ›
        </Link>
        {item.phone && (
          <a
            href={`tel:${item.phone}`}
            onClick={e => e.stopPropagation()}
            className="text-[13px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline"
          >
            📞 {item.phone}
          </a>
        )}
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => { e.preventDefault(); e.stopPropagation(); openDirections(item); }}
            title="Calculer l'itinéraire vers ce commerce"
            className="text-[13px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline"
          >
            🧭 Aller à
          </a>
        )}
      </div>

      {/* Reviews snippet */}
      {item.reviewsSummary && (
        <div className="mt-2 pl-3 border-l-2 border-[#dadce0] dark:border-gray-600">
          <p className="text-[13px] text-[#4d5156] dark:text-gray-400 italic line-clamp-1">
            &quot;{item.reviewsSummary.split('||')[0]?.trim()}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
