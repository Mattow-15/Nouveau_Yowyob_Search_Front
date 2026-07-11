'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/components/providers/theme-provider';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Évite le flash hydratation (SSR ne connaît pas le thème stocké)
    if (!mounted) return <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl" />;

    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all duration-200
                ${isDark
                    ? 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm'
                }`}
        >
            {isDark ? (
                /* Soleil — cliquer repasse en clair */
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5" />
                    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </g>
                </svg>
            ) : (
                /* Lune — cliquer passe en sombre */
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    );
}
