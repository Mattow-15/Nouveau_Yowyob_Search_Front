'use client';

import React from 'react';
import { SearchResult } from '@/types/search';

interface AiAnswerPanelProps {
  aiAnswer: string;
  intent: string;
  rewrittenQuery: string;
  sources: SearchResult[];
  processingTimeMs: number;
  onSourceClick?: (source: SearchResult) => void;
  onClose?: () => void;
}

/**
 * A highly robust, lightweight local markdown parser to display bold texts (**text**),
 * itemized lists (- item), numbered lists (1. item), and telephone/location icons.
 */
function renderMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, index) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={index} className="h-2" />;

    // Handle bullet points
    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
      const content = cleanLine.substring(2);
      return (
        <li key={index} className="ml-4 list-disc text-gray-700 dark:text-gray-300 mb-1 leading-relaxed">
          {parseBold(content)}
        </li>
      );
    }

    // Handle numbered lists (e.g. 1. Item)
    const numberedMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const content = numberedMatch[2];
      return (
        <div key={index} className="flex gap-2 ml-1 mb-2 items-start leading-relaxed">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
            {num}
          </span>
          <span className="text-gray-700 dark:text-gray-300">{parseBold(content)}</span>
        </div>
      );
    }

    // Default paragraph
    return (
      <p key={index} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed text-sm md:text-base">
        {parseBold(cleanLine)}
      </p>
    );
  });
}

function parseBold(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part}</strong>;
    }
    return part;
  });
}

export function AiAnswerPanel({
  aiAnswer,
  intent,
  rewrittenQuery,
  sources,
  processingTimeMs,
  onSourceClick,
  onClose,
}: AiAnswerPanelProps) {
  // Map intent to beautiful readable tags
  const getIntentBadge = () => {
    switch (intent.toUpperCase()) {
      case 'RECOMMENDATION':
        return {
          label: 'Recommandation Locale',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          )
        };
      case 'INFORMATION':
        return {
          label: 'Fiches Informations',
          bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'NAVIGATION':
        return {
          label: 'Itinéraire & Localisation',
          bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        };
      default:
        return {
          label: 'Recherche Assistée',
          bg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )
        };
    }
  };

  const badge = getIntentBadge();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100/80 dark:border-indigo-950/30 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/35 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/15 p-6 shadow-2xl transition-all duration-300 hover:shadow-indigo-100/40 dark:hover:shadow-none mb-8">
      {/* Decorative Shiny Sparkles Frame */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-300/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100/50 dark:border-indigo-950/30 pb-4 mb-5">
        <div className="flex items-center gap-3">
          {/* Sparkle icon */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none animate-pulse">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 21c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v4zm12-9c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v4zm0 9c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v4zM9 12c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v4z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 dark:text-white text-base md:text-lg tracking-tight flex items-center gap-2">
              Synthèse Assistée YowYob IA
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm">
                BÊTA
              </span>
            </h4>
            {rewrittenQuery && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Requête optimisée : <span className="italic font-medium text-indigo-600 dark:text-indigo-400">&quot;{rewrittenQuery}&quot;</span>
              </p>
            )}
          </div>
        </div>

        {/* Intent Badge & Time */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.bg}`}>
            {badge.icon}
            {badge.label}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            Généré en {processingTimeMs}ms
          </span>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Masquer la réponse IA"
              title="Masquer la réponse IA"
              className="ml-1 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Generative Text Block */}
      <div className="prose dark:prose-invert max-w-none mb-6">
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-indigo-50/30 dark:border-indigo-950/20 shadow-sm">
          {renderMarkdown(aiAnswer)}
        </div>
      </div>

      {/* Sources list */}
      {sources && sources.length > 0 && (
        <div className="border-t border-indigo-100/50 dark:border-indigo-950/30 pt-5">
          <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Sources & Données utilisées ({sources.length}) :
          </h5>

          {/* Horizontally scrolling list of elegant source mini-cards */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent">
            {sources.map((src) => (
              <div
                key={src.id}
                onClick={() => onSourceClick?.(src)}
                className="w-64 flex-shrink-0 cursor-pointer bg-white dark:bg-gray-950 rounded-2xl p-3 border border-gray-100 dark:border-gray-800/60 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                    {src.category ? src.category.replace('SERVICES_', '') : 'Commerce'}
                  </span>
                  {src.rating && (
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold ml-auto">
                      ⭐ {src.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <h6 className="font-bold text-gray-800 dark:text-gray-200 text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {src.title}
                </h6>
                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
                  📍 {src.street || src.city || 'Cameroun'}
                </p>
                {src.phone && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    📞 {src.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
