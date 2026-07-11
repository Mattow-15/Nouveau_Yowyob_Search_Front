/**
 * Authenticated Header (After Login)
 * @author Matteo Owona, Rouchda Yampen
 */

'use client';

import React, { useState } from 'react';
import { useStore } from '@/store';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { YowyobProductsMenu } from './yowyob-products-menu';
import { YOWYOB_SERVICES } from '@/lib/constants/yowyob-services';
import { useSmartGeolocation } from '@/lib/hooks/ui/use-geolocation';

interface HeaderAuthenticatedProps {
  userName?: string;
}

export const HeaderAuthenticated: React.FC<HeaderAuthenticatedProps> = ({ userName }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { city, quartier, source } = useSmartGeolocation();
  // Affichage : le quartier (plus précis, ex. "Melen") quand connu, sinon la ville.
  const displayLocation = quartier ?? city;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => useStore.getState().toggleSidebar()}
              title="Historique"
              className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Home Icon */}
            <Link
              href="/home"
              className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Accueil"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative w-9 h-9 sm:w-12 sm:h-12 flex-shrink-0">
                <img
                  src="/logo.jpg"
                  className="w-full h-full object-contain rounded-2xl dark:invert dark:hue-rotate-180 dark:mix-blend-screen"
                  alt="Yowyob Logo"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white truncate">Yowyob</h1>
                <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 truncate">
                  Search Engine
                  {/* Position détectée — discrète, en prolongement du tagline */}
                  {source && displayLocation && (
                    <span
                      title={source === 'gps' ? 'Position GPS détectée' : 'Localisation approximative (IP)'}
                      className="text-gray-300 dark:text-gray-700"
                    > · 📍 {displayLocation}</span>
                  )}
                </p>
              </div>
            </Link>
          </div>
          {/* Desktop Navigation (Empty now) */}
          <nav className="hidden lg:flex items-center gap-8">
          </nav>

          {/* Actions — seulement à partir de lg : en dessous, pas assez de place pour
              logo + salutation + waffle + toggle + 2 boutons sans déborder. */}
          <div className="hidden lg:flex items-center gap-2">
            {userName && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-1">
                Bonjour, <span className="text-blue-600 dark:text-blue-400 font-bold">{userName}</span>
              </span>
            )}
            <YowyobProductsMenu />
            <ThemeToggle />
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profil
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Déconnexion
            </Button>
          </div>

          {/* Mobile / tablette : toggle dark/light toujours accessible, reste dans le menu déroulant */}
          <div className="lg:hidden flex items-center gap-1">
            <ThemeToggle />
            <YowyobProductsMenu />
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col gap-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Yowyob Products</p>
              <div className="grid grid-cols-3 gap-2">
                {YOWYOB_SERVICES.map((service) =>
                  service.external ? (
                    <a
                      key={service.id}
                      href={service.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="text-xl">{service.emoji}</span>
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mt-1">{service.name}</span>
                    </a>
                  ) : (
                    <Link
                      key={service.id}
                      href={service.href}
                      className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-xl">{service.emoji}</span>
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mt-1">{service.name}</span>
                    </Link>
                  )
                )}
              </div>
              <Link href="/home" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold">
                Accueil
              </Link>
              <Link href="/profile">
                <Button variant="outline" fullWidth>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil
                </Button>
              </Link>
              <Button
                variant="primary"
                fullWidth
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};