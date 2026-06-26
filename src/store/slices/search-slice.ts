import { StateCreator } from 'zustand';

export interface SearchFilters {
  category: string;
  minPrice: number | null;
  maxPrice: number | null;
  location: string;
  radius: number;
  sortBy: 'recent' | 'price_asc' | 'price_desc' | 'popular';
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  isSearching: boolean;
  userHistory: Record<string, string[]>;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  addToHistory: (query: string, userId?: string) => void;
  removeFromHistory: (query: string, userId?: string) => void;
  clearHistory: (userId?: string) => void;
}

export const createSearchSlice: StateCreator<SearchState> = (set) => ({
  query: '',
  filters: {
    category: '',
    minPrice: null,
    maxPrice: null,
    location: '',
    radius: 10,
    sortBy: 'recent',
  },
  isSearching: false,
  userHistory: {},

  setSearchQuery: (query: string) =>
    set((state) => ({
      ...state,
      query,
      isSearching: !!query.trim()
    })),

  setFilters: (newFilters: Partial<SearchFilters>) =>
    set((state) => ({
      ...state,
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () =>
    set((state) => ({
      ...state,
      filters: {
        category: '',
        minPrice: null,
        maxPrice: null,
        location: '',
        radius: 10,
        sortBy: 'recent',
      },
    })),

  addToHistory: (query: string, userId: string = 'anonymous') =>
    set((state) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return state;
      const historyList = state.userHistory[userId] || [];
      const newHistory = [trimmedQuery, ...historyList.filter((h) => h !== trimmedQuery)].slice(0, 50);
      return { 
        ...state, 
        userHistory: {
          ...state.userHistory,
          [userId]: newHistory
        }
      };
    }),

  removeFromHistory: (query: string, userId: string = 'anonymous') =>
    set((state) => {
      const historyList = state.userHistory[userId] || [];
      return {
        ...state,
        userHistory: {
          ...state.userHistory,
          [userId]: historyList.filter((h) => h !== query),
        }
      };
    }),

  clearHistory: (userId: string = 'anonymous') =>
    set((state) => ({
      ...state,
      userHistory: {
        ...state.userHistory,
        [userId]: [],
      }
    })),
});