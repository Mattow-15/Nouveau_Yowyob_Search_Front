export interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'product' | 'service' | 'shop';
  category: string;
  city: string;
  quartier?: string;
  rating: number;
  detailsUrl?: string;
  // UI specific fields that might be missing from backend
  images: string[];
  shop: {
    name: string;
    address: string;
    email?: string;
    phone?: string;
    description?: string;
  };
  location: {
    lat: number;
    lng: number;
  };
  latitude?: number;
  longitude?: number;
  tags: string[];
}