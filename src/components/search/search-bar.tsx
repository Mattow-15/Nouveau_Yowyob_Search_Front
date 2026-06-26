/**
 * SearchBar component with autocomplete
 * @author Matteo Owona, Rouchda Yampen
 * @date 2024-12-06
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSearchStore } from '@/store';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { searchService } from '@/lib/api/search-service';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  onSearch: (query: string) => void;
  onChange?: (query: string) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  defaultValue = '',
  placeholder = 'Rechercher des produits, services, commerces...',
  showSuggestions = false,
  onSearch,
  onChange,
  className,
}) => {
  const [query, setQuery] = useState(defaultValue);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal query when defaultValue changes (e.g., history click or URL change)
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [historySuggestions, setHistorySuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToHistory, userHistory } = useSearchStore();
  const { data: session, status } = useSession();
  const userId = session?.user?.id || 'anonymous';
  const history = userHistory[userId] || [];

  // Debounced search with history
  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([]);
      setHistorySuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      // Filter history based on query - ONLY if authenticated
      const filteredHistory = status === 'authenticated'
        ? history
          .filter(h => h.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)
        : [];

      setHistorySuggestions(filteredHistory);

      // API access for autocomplete
      if (showSuggestions && query.length >= 2) {
        try {
          const endpoint = `${API_ENDPOINTS.SEARCH_AUTOCOMPLETE}?q=${encodeURIComponent(query)}`;
          import('@/lib/api/http-client').then(async ({ httpClient }) => {
            const results = await httpClient.get<string[]>(endpoint);
            if (Array.isArray(results)) {
              setSuggestions(results);
            } else {
              setSuggestions([]);
            }
          });
        } catch (error) {
          console.error("Autocomplete error", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }

      // Only show dropdown if focused
      setShowDropdown(isFocused && (filteredHistory.length > 0 || (showSuggestions && query.length >= 2)));
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showSuggestions, history, status, isFocused]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    if (status === 'authenticated') {
      addToHistory(suggestion, userId);
      searchService.addToHistory(suggestion);
    } else {
      addToHistory(suggestion, userId);
    }
    onSearch(suggestion);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const cleanQuery = query.trim();
      addToHistory(cleanQuery, userId);
      if (status === 'authenticated') {
        // Persist to backend for authenticated users "Google-style"
        searchService.addToHistory(cleanQuery);
      }
      onSearch(cleanQuery);
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className={cn(
          "flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-blue-500/20 dark:shadow-blue-400/10 border border-blue-100 dark:border-gray-700 hover:shadow-3xl hover:shadow-blue-500/30 dark:hover:shadow-blue-400/20 transition-all duration-500",
          className
        )}>
          <div className="flex items-center gap-3 flex-1 px-4">
            <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onChange={(e) => {
                setQuery(e.target.value);
                if (onChange) onChange(e.target.value);
              }}
              placeholder={placeholder}
              className="flex-1 py-4 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-lg"
            />
            {isLoading && (
              <div className="spinner w-5 h-5"></div>
            )}
          </div>
          <button
            type="submit"
            className="px-8 py-4 text-lg font-bold flex items-center gap-2 group bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-2xl transition-colors"
          >
            Rechercher
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && (historySuggestions.length > 0 || suggestions.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slide-down">
          {/* History Items */}
          {historySuggestions.length > 0 && (
            <>
              {historySuggestions.map((historyItem, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => handleSuggestionClick(historyItem)}
                  className="w-full px-6 py-4 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                >
                  <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-200">{historyItem}</span>
                </button>
              ))}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                  Suggestions
                </div>
              )}
            </>
          )}

          {/* Regular Suggestions */}
          {suggestions.map((suggestion, index) => (
            <button
              key={`suggestion-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-6 py-4 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-200">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};