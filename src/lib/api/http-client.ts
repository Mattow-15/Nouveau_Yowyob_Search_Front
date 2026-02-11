/**
 * HTTP client for API communication
 * @author Matteo Owona, Rouchda Yampen
 * @date 2024-12-05
 */

import { getSession } from 'next-auth/react';

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

class HttpClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    console.log('🔌 API Base URL initialized:', this.baseUrl);
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
      // 1. Try local storage for compatibility
      const localToken = localStorage.getItem('auth_token');
      if (localToken) return localToken;

      // 2. Try NextAuth Session
      const session = await getSession();
      const accessToken = (session?.user as any)?.accessToken;
      if (accessToken) {
        return accessToken as string;
      }

      return null;
    } catch (error) {
      console.warn('Cannot access auth token:', error);
      return null;
    }
  }

  private async buildHeaders(customHeaders?: HeadersInit): Promise<HeadersInit> {
    let session = null;

    // Safety check: getSession() from next-auth/react is for CLIENT side.
    // Calling it on server-side within NextAuth callbacks causes infinite loops.
    if (typeof window !== 'undefined') {
      try {
        session = await getSession();
      } catch (e) {
        console.warn('Failed to get session in HttpClient:', e);
      }
    }

    const token = (session?.user as any)?.accessToken as string;
    const userId = (session?.user as any)?.id as string;

    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    if (userId) {
      (headers as Record<string, string>)['X-User-Id'] = userId;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        code: `HTTP_${response.status}`,
        message: response.statusText,
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || error.message;
        error.details = errorData.details;
      } catch {
        try {
          const text = await response.text();
          if (text) {
            error.message = text;
          }
        } catch {
          // Keep default message
        }
      }

      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const text = await response.text();
        return text ? JSON.parse(text) : {} as T;
      } catch (e) {
        console.warn('Failed to parse JSON response:', e);
        return {} as T;
      }
    } else {
      // Return empty object for non-JSON successful responses
      return {} as T;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      ...options,
      headers: await this.buildHeaders(options?.headers),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      ...options,
      headers: await this.buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method: 'PUT',
      ...options,
      headers: await this.buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method: 'DELETE',
      ...options,
      headers: await this.buildHeaders(options?.headers),
    });

    return this.handleResponse<T>(response);
  }

  async request<T>(method: string, endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method,
      ...options,
      headers: await this.buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

export const httpClient = new HttpClient();
