/**
 * Public Homepage (Before Login)
 * @author Matteo Owona, Rouchda Yampen
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { YOWYOB_MENU_SERVICES } from '@/lib/constants/yowyob-services';

const TICKER_CSS = `
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-track { animation: ticker 28s linear infinite; }
.ticker-track:hover { animation-play-state: paused; }
`;

function TickerSystem({ services }: { services: typeof YOWYOB_MENU_SERVICES }) {
  const doubled = [...services, ...services];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TICKER_CSS }} />
      <div className="w-full overflow-hidden">
        <div className="ticker-track flex w-max">
          {doubled.map((s, i) => {
            const inner = (
              <div className="flex flex-col items-center mx-5 group cursor-pointer">
                <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl transition-transform duration-200">
                  <span className="text-5xl">{s.emoji}</span>
                </div>
                <span className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {s.name}
                </span>
              </div>
            );
            return s.external
              ? <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">{inner}</a>
              : <Link key={i} href={s.href}>{inner}</Link>;
          })}
        </div>
      </div>
    </>
  );
}

export default function PublicHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <ConditionalLayout>
      <div className="bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">

        {/* Main Search Area - Google Style */}
        <main className="flex flex-col items-center justify-start pt-12 pb-6 px-4 sm:px-6">

          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-blue-600 dark:text-blue-500">
              Yowyob Search
            </h1>
            <p className="mt-4 text-lg md:text-xl font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              Trouvez tout ce dont vous avez besoin
              <span className="block text-sm font-normal text-gray-400 dark:text-gray-500 mt-1">
                Commerces · Services · Organisations au Cameroun
              </span>
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] border border-gray-200 dark:border-gray-700 transition-all duration-300 px-2 py-2">
              <svg className="w-5 h-5 text-gray-400 ml-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Chercher sur Yowyob ou saisir une URL"
                className="flex-1 bg-transparent border-none outline-none text-base md:text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 py-3"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2.5 ml-2 font-medium transition-colors"
              >
                Rechercher
              </button>
            </div>
          </div>

        </main>

        {/* Yowyob Products — Ticker */}
        <div className="w-full border-t border-gray-200 dark:border-gray-800 py-4 bg-gray-50 dark:bg-gray-900/80">
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest mb-3">
            Découvrez l'Écosystème Yowyob
          </h3>
          <TickerSystem services={YOWYOB_MENU_SERVICES} />
        </div>

      </div>
    </ConditionalLayout>
  );
}
