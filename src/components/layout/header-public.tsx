/**
 * Public Header (Before Login)
 * @author Matteo Owona, Rouchda Yampen
 */

'use client';

import React from 'react';
import { useStore } from '@/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { YowyobProductsMenu } from './yowyob-products-menu';
import { useSmartGeolocation } from '@/lib/hooks/ui/use-geolocation';

export const HeaderPublic: React.FC = () => {
  const { city, source } = useSmartGeolocation();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button
              onClick={() => useStore.getState().toggleSidebar()}
              className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Home Icon — redondant avec le clic sur le logo, masqué sous lg pour laisser
                la place au toggle dark/light + bouton Connexion toujours visibles */}
            <Link
              href="/"
              className="hidden lg:inline-flex p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                  {source && city && (
                    <span
                      title={source === 'gps' ? 'Position GPS détectée' : 'Localisation approximative (IP)'}
                      className="text-gray-300 dark:text-gray-700"
                    > · 📍 {city}</span>
                  )}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors">
              À propos
            </Link>
            <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors">
              Contact
            </Link>
          </nav>

          {/* Actions — seulement à partir de lg : en dessous, pas assez de place pour
              logo + nav + waffle + toggle + bouton sans déborder (cf. barre mobile ci-dessous). */}
          <div className="hidden lg:flex items-center gap-2">
            <YowyobProductsMenu />
            <ThemeToggle />
            <Link href="/auth">
              <Button variant="primary" size="sm">
                Connexion
              </Button>
            </Link>
          </div>

          {/* Mobile / tablette : toggle dark/light + connexion toujours visibles,
              menu ☰ remplacé par le même menu compact YowyobProducts que sur desktop
              (le panneau pleine largeur précédent était disproportionné pour son contenu). */}
          <div className="lg:hidden flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/auth"
              title="Connexion"
              className="flex items-center gap-1.5 px-2 sm:px-3 h-8 sm:h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Connexion</span>
            </Link>
            <YowyobProductsMenu />
          </div>
        </div>
      </div>
    </header>
  );
};