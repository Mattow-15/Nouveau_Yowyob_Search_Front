'use client';
import React from 'react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, count, size = 'sm' }: StarRatingProps) {
  const px = size === 'md' ? 16 : 13;
  const filled = Math.floor(rating);
  const hasHalf = rating - filled >= 0.3 && rating - filled < 0.8;

  return (
    <div className="flex items-center gap-1" style={{ fontSize: px }}>
      <span className="font-medium text-[#e37400]">{rating.toFixed(1)}</span>
      <div className="flex items-center gap-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width={px} height={px} viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`star-${rating}-${i}`}>
                <stop
                  offset={i < filled ? '100%' : i === filled && hasHalf ? '50%' : '0%'}
                  stopColor="#fbbc04"
                />
                <stop
                  offset={i < filled ? '100%' : i === filled && hasHalf ? '50%' : '0%'}
                  stopColor="#e0e0e0"
                />
              </linearGradient>
            </defs>
            <path
              d="M10 1l2.39 5.26 5.61.49-4.2 3.74 1.3 5.51L10 13.27 4.9 16l1.3-5.51L2 6.75l5.61-.49z"
              fill={i < filled ? '#fbbc04' : i === filled && hasHalf ? 'url(#star-${rating}-${i})' : '#e0e0e0'}
            />
          </svg>
        ))}
      </div>
      {typeof count === 'number' && (
        <span className="text-[#70757a]">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
