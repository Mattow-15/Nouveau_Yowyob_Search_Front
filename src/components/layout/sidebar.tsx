/**
 * Sidebar component for search history
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore, useSearchStore } from '@/store';
import { searchService } from '@/lib/api/search-service';

export const Sidebar = () => {
    const { sidebarOpen, toggleSidebar } = useStore();
    const { userHistory, removeFromHistory, clearHistory, setSearchQuery } = useSearchStore();
    const { data: session, status } = useSession();
    const userId = session?.user?.id || 'anonymous';
    const localHistory = userHistory[userId] || [];
    const router = useRouter();

    const [backendHistory, setBackendHistory] = useState<any[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const fetchBackendHistory = async () => {
        try {
            const history = await searchService.getHistory();
            setBackendHistory(history);
        } catch (error) {
            console.error('Failed to fetch backend history:', error);
        }
    };

    useEffect(() => {
        if (sidebarOpen && status === 'authenticated') {
            fetchBackendHistory();
        }
    }, [sidebarOpen, status]);

    if (!sidebarOpen) return null;

    // Decide which history to show
    // Fallback to local history if backend is empty (optimistic UI or offline support)
    const historyToShow = status === 'authenticated'
        ? (backendHistory.length > 0 ? backendHistory : localHistory.map(q => ({ query: q })))
        : [];

    const handleHistoryClick = (query: string) => {
        setSearchQuery(query);
        router.push(`/search?q=${encodeURIComponent(query)}`);
        toggleSidebar();
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={toggleSidebar}
            />

            {/* Sidebar Panel */}
            <div className={`relative flex flex-col w-full max-w-xs h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Historique
                    </h2>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {status !== 'authenticated' ? (
                        <div className="text-center py-10 text-gray-500">
                            <p className="mb-4">Connectez-vous pour voir votre historique.</p>
                            <Link href="/auth" className="text-blue-600 hover:underline font-medium">
                                Se connecter
                            </Link>
                        </div>
                    ) : historyToShow.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Aucun historique récent</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-500 font-medium">Recherches récentes</span>
                                {status !== 'authenticated' && (
                                    <button
                                        onClick={() => clearHistory(userId)}
                                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                                    >
                                        Tout effacer
                                    </button>
                                )}
                            </div>

                            {historyToShow.map((item: any, index: number) => (
                                <div key={index} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                    <div
                                        className="flex items-center gap-3 flex-1"
                                        onClick={() => handleHistoryClick(item.query)}
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium line-clamp-1">
                                            {item.query}
                                        </span>
                                    </div>
                                    {status !== 'authenticated' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromHistory(item.query, userId);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <Link href="/settings" className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Paramètres</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
