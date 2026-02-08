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
import type { MenuItem, CreateMenuItemInput } from '@openorder/shared-types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Hook to fetch all menu items for the current restaurant
 * Optionally filter by category
 */
export function useMenuItems(categoryId?: string) {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;

  return useQuery({
    queryKey: ['items', restaurantId, categoryId],
    queryFn: async () => {
      const params = categoryId ? `?categoryId=${categoryId}` : '';
      const response = await apiClient.get<ApiResponse<MenuItem[]>>(
        `/restaurants/${restaurantId}/menu/items${params}`
      );
      return response.data;
    },
    enabled: !!restaurantId,
  });
}

/**
 * Hook to create a new menu item
 */
export function useCreateMenuItem() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateMenuItemInput> & Pick<CreateMenuItemInput, 'name' | 'categoryId' | 'price'>) => {
      const response = await apiClient.post<ApiResponse<MenuItem>>(
        `/restaurants/${restaurantId}/menu/items`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      toast.success('Item created successfully');
    },
  });
}

/**
 * Hook to update a menu item
 */
export function useUpdateMenuItem() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: Partial<CreateMenuItemInput>;
    }) => {
      const response = await apiClient.put<ApiResponse<MenuItem>>(
        `/restaurants/${restaurantId}/menu/items/${itemId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      toast.success('Item updated successfully');
    },
  });
}

/**
 * Hook to delete a menu item
 */
export function useDeleteMenuItem() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(`/restaurants/${restaurantId}/menu/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      toast.success('Item deleted successfully');
    },
  });
}

/**
 * Hook to toggle item availability (86/un-86)
 */
export function useToggleItemAvailability() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
      const response = await apiClient.patch<ApiResponse<MenuItem>>(
        `/restaurants/${restaurantId}/menu/items/${itemId}/availability`,
        { isAvailable }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items', restaurantId] });
      toast.success(variables.isAvailable ? 'Item is now available' : 'Item marked as 86');
    },
  });
}

/**
 * Hook to bulk delete menu items
 */
export function useBulkDeleteMenuItems() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemIds: string[]) => {
      // Delete items in parallel
      await Promise.all(
        itemIds.map((itemId) =>
          apiClient.delete(`/restaurants/${restaurantId}/menu/items/${itemId}`)
        )
      );
    },
    onSuccess: (_, itemIds) => {
      queryClient.invalidateQueries({ queryKey: ['items', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      toast.success(`${itemIds.length} ${itemIds.length === 1 ? 'item' : 'items'} deleted successfully`);
    },
    onError: () => {
      toast.error('Failed to delete items. Please try again.');
    },
  });
}

/**
 * Hook to bulk toggle item availability
 */
export function useBulkToggleAvailability() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemIds, isAvailable }: { itemIds: string[]; isAvailable: boolean }) => {
      // Update items in parallel
      await Promise.all(
        itemIds.map((itemId) =>
          apiClient.patch<ApiResponse<MenuItem>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}/availability`,
            { isAvailable }
          )
        )
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items', restaurantId] });
      const count = variables.itemIds.length;
      const status = variables.isAvailable ? 'available' : '86';
      toast.success(
        `${count} ${count === 1 ? 'item' : 'items'} marked as ${status}`
      );
    },
    onError: () => {
      toast.error('Failed to update items. Please try again.');
    },
  });
}
