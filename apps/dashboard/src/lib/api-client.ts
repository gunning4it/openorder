/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/// <reference types="vite/client" />

import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
}

/**
 * API client wrapper using fetch with authentication
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    // Serialize body if it's an object
    let body: BodyInit | undefined;
    if (options.body && typeof options.body === 'object') {
      body = JSON.stringify(options.body);
    }

    const config: RequestInit = {
      method: options.method,
      headers,
      body,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - logout user
      if (response.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new ApiError('Unauthorized', 401);
      }

      // Parse response
      const data = await response.json().catch(() => null);

      // Handle error responses
      if (!response.ok) {
        const message =
          data?.error || data?.message || `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error or other fetch error
      if (error instanceof Error) {
        throw new ApiError(error.message, 0);
      }

      throw new ApiError('An unexpected error occurred', 0);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file with multipart/form-data
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {};
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new ApiError('Unauthorized', 401);
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.error || data?.message || `Upload failed with status ${response.status}`;
        throw new ApiError(message, response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ApiError(error.message, 0);
      }

      throw new ApiError('Upload failed', 0);
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
