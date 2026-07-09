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

function OrbitIcon({ service, x, y, duration, clockwise }: {
  service: typeof YOWYOB_MENU_SERVICES[0];
  x: number; y: number;
  duration: number;
  clockwise: boolean;
}) {
  const counter = clockwise ? 'deorbit-cw' : 'deorbit-ccw';
  const icon = (
    <div
      className="group/icon flex flex-col items-center"
      style={{ animation: `${counter} ${duration}s linear infinite` }}
    >
      <div className="w-11 h-11 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-transform duration-300 group-hover/icon:scale-[2] group-hover/icon:shadow-2xl group-hover/icon:z-50 relative">
        <span className="text-xl">{service.emoji}</span>
      </div>
      <span className="mt-1 text-[9px] font-semibold text-gray-400 dark:text-gray-500 group-hover/icon:text-blue-600 dark:group-hover/icon:text-blue-400 transition-colors whitespace-nowrap">
        {service.name}
      </span>
    </div>
  );
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      zIndex: 10,
    }}>
      {service.external
        ? <a href={service.href} target="_blank" rel="noopener noreferrer">{icon}</a>
        : <Link href={service.href}>{icon}</Link>}
    </div>
  );
}

function OrbitRing({ services, radius, duration, clockwise }: {
  services: typeof YOWYOB_MENU_SERVICES;
  radius: number; duration: number; clockwise: boolean;
}) {
  const anim = clockwise ? 'orbit-cw' : 'orbit-ccw';
  return (
    <div style={{
      position: 'absolute', inset: 0,
      animation: `${anim} ${duration}s linear infinite`,
    }}>
      {services.map((s, i) => {
        const angle = (i / services.length) * 2 * Math.PI;
        return (
          <OrbitIcon
            key={s.id} service={s}
            x={Math.cos(angle) * radius}
            y={Math.sin(angle) * radius}
            duration={duration} clockwise={clockwise}
          />
        );
      })}
    </div>
  );
}

function OrbitSystem({ services }: { services: typeof YOWYOB_MENU_SERVICES }) {
  const inner = services.slice(0, 6);
  const outer = services.slice(6);
  const size = 440;
  const r1 = 95, r2 = 180;
  return (
    <div className="relative" style={{ width: size, height: size, maxWidth: '90vw', maxHeight: '90vw' }}>
      {/* Orbit path rings */}
      {[r1, r2].map(r => (
        <div key={r} className="absolute rounded-full border border-gray-200/70 dark:border-gray-700/40"
          style={{ width: r * 2, height: r * 2, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      ))}
      {/* Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg z-20">
        <span className="text-white font-black text-xs">YS</span>
      </div>
      {/* Rings */}
      <OrbitRing services={inner} radius={r1} duration={22} clockwise={true} />
      <OrbitRing services={outer} radius={r2} duration={42} clockwise={false} />
    </div>
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
