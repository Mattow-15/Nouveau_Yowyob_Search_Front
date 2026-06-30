import React from "react";
import Link from "next/link";
import { SearchResult } from '@/types/search';
import { Star, User, ExternalLink, ChevronRight } from "lucide-react";
import { getExternalUrl } from './serp/get-external-url';
import { openExternalLink } from '@/store/external-link-store';
import { getDirectionsUrl, openDirections } from './serp/get-directions-url';
import { CoreBadge } from './core-badge';

interface Props {
  item: SearchResult;
  onClick?: (item: SearchResult) => void;
}

// Composant étoiles — style Google
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1 text-[13px]">
      <span className="font-medium text-[#70757a]">{rating.toFixed(1)}</span>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < Math.floor(rating) 
                ? "text-[#fbbc04] fill-[#fbbc04]" 
                : (i < rating ? "text-[#fbbc04] fill-[#fbbc04] opacity-50" : "text-[#dadce0] fill-[#dadce0]")}
          />
        ))}
      </div>
      <span className="text-[#70757a]">({count})</span>
    </div>
  );
}

export const ResultListItem: React.FC<Props> = ({ item: result, onClick }) => {
  const displayImage = result.imageUrl || (result.images && result.images.length > 0 ? result.images[0] : null);

  // Lien externe présent ? (site officiel > googleMapsUrl > recherche Google)
  // L'ouverture passe par openExternalLink() → vérification + confirmation.
  const externalUrl = getExternalUrl(result);
  const directionsUrl = getDirectionsUrl(result);

  // Statut « Ouvert/Fermé » affiché seulement si on a une donnée fiable (openNow booléen).
  const hasStatus = result.openNow != null;

  const handleCardClick = () => {
    onClick?.(result);
    openExternalLink(result);
  };

  return (
    <div 
        className="flex gap-4 py-4 px-0 border-b border-[#dadce0] dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer w-full group"
        onClick={handleCardClick}
    >
      <div className="flex-1 min-w-0">
        {/* Titre — Style Google Blue (clic → site externe) */}
        <h3 className="text-[18px] font-normal text-[#1a0dab] dark:text-[#8ab4f8] group-hover:underline leading-tight mb-0.5 flex items-center gap-1.5">
          {result.title || result.name}
          {externalUrl && <ExternalLink size={13} className="opacity-50 flex-shrink-0" />}
        </h3>

        {result.isCore && <CoreBadge className="mt-0.5 mb-1" />}

        {/* Ligne 1: Rating et Catégorie */}
        <div className="flex items-center gap-1.5 flex-wrap">
            {result.rating != null ? (
                <StarRating rating={result.rating} count={result.reviewsCount || 0} />
            ) : null}
            {result.category && (
                <span className="text-[13px] text-[#70757a] dark:text-gray-400">
                   {result.rating != null ? " · " : ""}{result.category}
                </span>
            )}
        </div>

        {/* Ligne 2: Ville et Téléphone */}
        <div className="text-[13px] text-[#70757a] dark:text-gray-400 mt-0.5">
          <span>{result.city || result.quartier || "Douala"}</span>
          {result.phone && (
            <span> · {result.phone}</span>
          )}
        </div>

        {/* Ligne 3: Statut Horaires — masquée si ni statut fiable ni horaires */}
        {(hasStatus || result.openingHours) && (
          <div className="text-[13px] mt-0.5">
            {hasStatus && (
              <span className={`${result.openNow ? "text-[#188038]" : "text-[#d93025]"} font-medium`}>
                {result.openNow ? "Ouvert" : "Fermé"}
              </span>
            )}
            {result.openingHours && (
              <span className="text-[#70757a] dark:text-gray-400">{hasStatus ? " · " : ""}{result.openingHours.replace(/Fermé|Ouvert/gi, "").trim()}</span>
            )}
          </div>
        )}

        {/* Ligne 4: Snippet / Livraison / Commentaire */}
        <div className="mt-1 flex items-start gap-2">
           {result.description ? (
             <div className="flex items-center gap-2 text-[13px] text-[#4d5156] dark:text-gray-300">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8]">
                    <User size={10} />
                </div>
                <span className="italic line-clamp-1">"{result.description}"</span>
             </div>
           ) : (
             <div className="text-[13px] text-[#70757a] dark:text-gray-400">Livraison disponible</div>
           )}
        </div>

        {/* Bouton : Afficher plus de détails → page interne /search/:id */}
        <div className="mt-2 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/search/${result.id}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:underline group/details"
          >
            <ChevronRight size={13} className="transition-transform group-hover/details:translate-x-0.5" />
            Afficher plus de détails
          </Link>
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => { e.preventDefault(); openDirections(result); }}
              title="Calculer l'itinéraire vers ce commerce"
              className="inline-flex items-center gap-1 text-[13px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline transition-colors"
            >
              🧭 Aller à
            </a>
          )}
          {externalUrl && (
            <button
              type="button"
              onClick={() => openExternalLink(result)}
              className="inline-flex items-center gap-1 text-[13px] text-[#70757a] dark:text-gray-400 hover:text-[#1a73e8] hover:underline transition-colors"
            >
              <ExternalLink size={11} />
              Visiter le site
            </button>
          )}
        </div>
      </div>

      {/* Image — Masquée si absente */}
      {displayImage && (
        <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-[#dadce0] dark:border-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt={result.title || result.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
        </div>
      )}
    </div>
  );
}
