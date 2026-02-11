/**
 * Listing service for frontend
 * @author Machine Assisted
 * @date 2026-01-14
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    sellerId: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
    createdAt: string;
}

export interface CreateListingDto {
    title: string;
    description: string;
    price: number;
    category: string;
    sellerId: string;
    address: string;
    latitude: number;
    longitude: number;
}

class ListingService {
    // Assuming API_ENDPOINTS.PRODUCTS maps to something like /api/v1/products 
    // But our backend has /api/listings. We might need to adjust constants or use direct path here.
    // Ideally we should update api-endpoints.ts, but user asked to be careful.
    // Let's check api-endpoints.ts content again. It had PRODUCTS: /api/v1/products.
    // Our backend listing service is mapped to /api/listings via Gateway.
    // If API_VERSION is v1, then /api/v1/listings ?? No, Gateway route is /api/listings/**

    // Let's use the direct path matching the Gateway route we validated: /api/listings
    private readonly BASE_PATH = '/api/listings';

    async getAll(): Promise<Listing[]> {
        return httpClient.get<Listing[]>(this.BASE_PATH);
    }

    async getById(id: string): Promise<Listing> {
        return httpClient.get<Listing>(`${this.BASE_PATH}/${id}`);
    }

    async create(data: CreateListingDto): Promise<Listing> {
        return httpClient.post<Listing>(this.BASE_PATH, data);
    }

    async update(id: string, data: Partial<CreateListingDto>): Promise<Listing> {
        return httpClient.put<Listing>(`${this.BASE_PATH}/${id}`, data);
    }

    async delete(id: string): Promise<void> {
        return httpClient.delete<void>(`${this.BASE_PATH}/${id}`);
    }
}

export const listingService = new ListingService();
