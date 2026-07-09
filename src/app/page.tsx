/**
 * Public Homepage (Before Login)
 * @author Matteo Owona, Rouchda Yampen
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { YOWYOB_MENU_SERVICES } from '@/lib/constants/yowyob-services';

function makeEllipseKeyframes(name: string, rx: number, ry: number, dir: 1 | -1): string {
  const steps = 60;
  let css = `@keyframes ${name}{`;
  for (let i = 0; i <= steps; i++) {
    const a = dir * (i / steps) * 2 * Math.PI;
    const x = (rx * Math.cos(a)).toFixed(1);
    const y = (ry * Math.sin(a)).toFixed(1);
    css += `${((i / steps) * 100).toFixed(1)}%{transform:translate(calc(-50% + ${x}px),calc(-50% + ${y}px))}`;
  }
  return css + '}';
}

function OrbitIcon({ service, index, total, animName, duration }: {
  service: typeof YOWYOB_MENU_SERVICES[0];
  index: number; total: number;
  animName: string; duration: number;
}) {
  const delay = -((index / total) * duration);
  const icon = (
    <div className="group/icon flex flex-col items-center">
      <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-transform duration-300 group-hover/icon:scale-[2] group-hover/icon:shadow-2xl relative z-10">
        <span className="text-3xl">{service.emoji}</span>
      </div>
      <span className="mt-0.5 text-[7px] font-medium text-gray-400 dark:text-gray-500 group-hover/icon:text-blue-600 dark:group-hover/icon:text-blue-400 transition-colors whitespace-nowrap">
        {service.name}
      </span>
    </div>
  );
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      animation: `${animName} ${duration}s linear infinite`,
      animationDelay: `${delay}s`,
      zIndex: 10,
    }}>
      {service.external
        ? <a href={service.href} target="_blank" rel="noopener noreferrer">{icon}</a>
        : <Link href={service.href}>{icon}</Link>}
    </div>
  );
}

function OrbitSystem({ services }: { services: typeof YOWYOB_MENU_SERVICES }) {
  const rx = 420, ry = 110;

  const css = useMemo(() =>
    makeEllipseKeyframes('ell-single', rx, ry, 1),
  []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="relative" style={{ width: rx * 2 + 60, height: ry * 2 + 80, maxWidth: '98vw' }}>
        {/* Orbit path décorative */}
        <div className="absolute border border-gray-200/60 dark:border-gray-700/30 rounded-[50%]"
          style={{ width: rx * 2, height: ry * 2, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        {/* Tous les services sur la même ellipse */}
        {services.map((s, i) => (
          <OrbitIcon key={s.id} service={s} index={i} total={services.length} animName="ell-single" duration={36} />
        ))}
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">

        {/* Main Search Area - Google Style */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6">

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

        {/* Yowyob Products — Orbit */}
        <div className="w-full border-t border-gray-200 dark:border-gray-800 py-10 flex flex-col items-center bg-gray-50 dark:bg-gray-900/80">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest mb-6">
            Découvrez l'Écosystème Yowyob
          </h3>
          <OrbitSystem services={YOWYOB_MENU_SERVICES} />
        </div>

      </div>
    </ConditionalLayout>
  );
}
