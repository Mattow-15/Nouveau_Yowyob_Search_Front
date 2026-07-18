'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Barre de recherche interactive de l'accueil — isolée en client component
 * pour que la page reste un Server Component (metadata propre, contenu indexable). */
export function HomepageSearchBar() {
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] border border-gray-200 dark:border-gray-700 transition-all duration-300 px-2 py-2">
        <svg className="w-5 h-5 text-gray-400 ml-3 mr-1.5 sm:ml-4 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Cherchez sur Yowyob"
          className="flex-1 min-w-0 truncate bg-transparent border-none outline-none text-base md:text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 py-3"
        />
        <button
          onClick={handleSearch}
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 sm:px-6 py-2.5 ml-1 sm:ml-2 text-sm sm:text-base font-medium transition-colors"
        >
          Rechercher
        </button>
      </div>
    </div>
  );
}
