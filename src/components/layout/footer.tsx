/**
 * Footer component
 * @author Matteo Owona, Rouchda Yampen
 * @date 2024-12-07
 */

import React from 'react';
import Link from 'next/link';

const SOCIAL_LINKS = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/yowyob',
    path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/YowyobInc',
    path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/yowyob',
    rect: true,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/yowyob',
    path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z',
  },
];

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200/50 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-center sm:justify-between gap-3">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:gap-x-6">
          <Link href="/about" className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">À propos</Link>
          <Link href="/contact" className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link>
          <Link href="/privacy" className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Confidentialité</Link>
          <Link href="/terms" className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conditions</Link>
          <Link href="/mentions-legales" className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Mentions légales</Link>
        </div>

        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {social.rect ? (
                  <>
                    <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="17.5" cy="6.5" r="1.2" />
                  </>
                ) : (
                  <path d={social.path} />
                )}
              </svg>
            </a>
          ))}
        </div>

        <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500">© {currentYear} Yowyob Inc. Ltd.</p>
      </div>
    </footer>
  );
};
