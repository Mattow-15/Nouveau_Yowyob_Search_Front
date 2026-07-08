'use client';
import React from 'react';
import { SearchResult } from '@/types/search';
import { ShoppingBag } from 'lucide-react';
import { getExternalUrl } from './get-external-url';

interface ProductCarouselProps {
  results: SearchResult[];
}

export function ProductCarousel({ results }: ProductCarouselProps) {
  const products = results.filter(r => r.price != null || r.category?.toLowerCase() === 'product' || r.category?.toLowerCase() === 'store');

  if (products.length === 0) return null;

  return (
    <div className="mb-6 py-4 bg-white dark:bg-gray-800 border border-[#dadce0] dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 pb-3 border-b border-[#dadce0] dark:border-gray-700 flex items-center gap-2">
        <ShoppingBag size={18} className="text-[#ea4335]" />
        <span className="text-[15px] font-semibold text-[#202124] dark:text-white">
          Annonces Google Shopping
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide">
        {products.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-36 border border-[#dadce0] dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-900"
            onClick={() => {
              const url = getExternalUrl(item);
              if (url) window.open(url, '_blank', 'noopener,noreferrer');
              else window.location.href = `/search/${item.id}`;
            }}
          >
            {/* Image */}
            <div className="h-28 w-full bg-gray-50 dark:bg-gray-800 relative">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.title || item.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-3xl">
                  🎁
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2 flex flex-col justify-between h-20">
              <h4 className="text-[12px] text-[#1a0dab] dark:text-[#8ab4f8] font-medium line-clamp-2 leading-tight">
                {item.title || item.name}
              </h4>
              <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
                {item.price != null && (
                  <span className="text-[13px] font-bold text-[#202124] dark:text-white">
                    {item.price.toLocaleString()} FCFA
                  </span>
                )}
                <span className="text-[10px] text-[#70757a] dark:text-gray-400 truncate max-w-[60px]">
                  {item.city || 'YowYob'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
