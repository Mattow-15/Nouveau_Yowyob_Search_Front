/**
 * Footer component
 * @author Matteo Owona, Rouchda Yampen
 * @date 2024-12-07
 */

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200/50 dark:border-gray-800 mt-4">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6">
          <Link href="/about" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">À propos</Link>
          <Link href="/contact" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link>
          <Link href="/privacy" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Confidentialité</Link>
          <Link href="/terms" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conditions</Link>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">© {currentYear} Yowyob.</p>
      </div>
    </footer>
  );
};
