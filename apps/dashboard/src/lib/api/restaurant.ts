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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { useAuthStore } from '../../stores/auth.store';
import { toast } from 'sonner';
import type { UpdateRestaurantInput } from '@openorder/shared-types';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  locale: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  isActive: boolean;
  acceptingOrders: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  dineInEnabled: boolean;
  prepTimeMinutes: number;
  brandColor: string;
  customCss?: string;
  taxRate: number;
  taxInclusive: boolean;
  tipsEnabled: boolean;
  tipPresets: number[];
}

interface OperatingHours {
  id: string;
  restaurantId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // "09:00"
  closeTime: string; // "22:00"
  isClosed: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Hook to fetch current restaurant details
 */
export function useRestaurant() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;

  return useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Restaurant>>(
        `/restaurants/${restaurantId}`
      );
      return response.data;
    },
    enabled: !!restaurantId,
  });
}

/**
 * Hook to update restaurant settings
 */
export function useUpdateRestaurant() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateRestaurantInput) => {
      const response = await apiClient.put<ApiResponse<Restaurant>>(
        `/restaurants/${restaurantId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      toast.success('Settings updated successfully');
    },
  });
}

/**
 * Hook to fetch operating hours
 */
export function useOperatingHours() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;

  return useQuery({
    queryKey: ['operatingHours', restaurantId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<OperatingHours[]>>(
        `/restaurants/${restaurantId}/operating-hours`
      );
      return response.data;
    },
    enabled: !!restaurantId,
  });
}

/**
 * Hook to update operating hours (bulk update for all days)
 */
export function useUpdateOperatingHours() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hours: Omit<OperatingHours, 'id' | 'restaurantId'>[]) => {
      const response = await apiClient.put<ApiResponse<OperatingHours[]>>(
        `/restaurants/${restaurantId}/operating-hours`,
        { hours }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operatingHours', restaurantId] });
      toast.success('Operating hours updated successfully');
    },
  });
}
