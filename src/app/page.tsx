/**
 * Public Homepage (Before Login)
 * @author Matteo Owona, Rouchda Yampen
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { HomepageSearchBar } from '@/components/home/homepage-search-bar';
import { YOWYOB_MENU_SERVICES } from '@/lib/constants/yowyob-services';

const TITLE = 'Yowyob Search — Moteur de recherche local au Cameroun';
const DESCRIPTION = 'Trouvez des commerces, services et produits près de chez vous au Cameroun : restaurants, pharmacies, banques, et tout l\'écosystème Yowyob.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://search.yowyob.com/',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

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
              <div className="flex flex-col items-center mx-4 group cursor-pointer">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:scale-125 group-hover:shadow-xl group-active:scale-125 group-active:shadow-xl transition-transform duration-200">
                  <span className="text-xl">{s.emoji}</span>
                </div>
                <span className="mt-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
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
  return (
    <ConditionalLayout>
      <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">

        {/* Main Search Area - Google Style */}
        <main className="flex flex-col items-center justify-start pt-12 pb-10 px-4 sm:px-6">

          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-blue-600 dark:text-blue-500">
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
          <HomepageSearchBar />

        </main>

        {/* Yowyob Products — Ticker (collé au footer) */}
        <div className="w-full mt-auto border-t border-gray-200 dark:border-gray-800 py-3 bg-gray-50 dark:bg-gray-900/80">
          <h3 className="text-[9px] font-bold text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest mb-2">
            Découvrez l'Écosystème Yowyob
          </h3>
          <TickerSystem services={YOWYOB_MENU_SERVICES} />
        </div>

      </div>
    </ConditionalLayout>
  );
}
