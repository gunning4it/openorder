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
import type {
  MenuCategory,
  CreateMenuCategoryInput,
} from '@openorder/shared-types';

interface CategoryWithItemCount extends MenuCategory {
  itemCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Hook to fetch all categories for the current restaurant
 */
export function useCategories() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;

  return useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CategoryWithItemCount[]>>(
        `/restaurants/${restaurantId}/menu/categories`
      );
      return response.data;
    },
    enabled: !!restaurantId,
  });
}

/**
 * Hook to create a new category
 * Accepts partial input - sortOrder is auto-assigned by the API
 */
export function useCreateCategory() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateMenuCategoryInput> & Pick<CreateMenuCategoryInput, 'name'>) => {
      const response = await apiClient.post<ApiResponse<MenuCategory>>(
        `/restaurants/${restaurantId}/menu/categories`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      toast.success('Category created successfully');
    },
  });
}

/**
 * Hook to update a category
 * Accepts partial input - all fields are optional
 */
export function useUpdateCategory() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Partial<CreateMenuCategoryInput>;
    }) => {
      const response = await apiClient.put<ApiResponse<MenuCategory>>(
        `/restaurants/${restaurantId}/menu/categories/${categoryId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      toast.success('Category updated successfully');
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      await apiClient.delete(`/restaurants/${restaurantId}/menu/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      toast.success('Category deleted successfully');
    },
  });
}

/**
 * Hook to reorder categories
 */
export function useReorderCategories() {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryIds: string[]) => {
      const response = await apiClient.post<ApiResponse<CategoryWithItemCount[]>>(
        `/restaurants/${restaurantId}/menu/categories/reorder`,
        { categoryIds }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      toast.success('Categories reordered');
    },
  });
}
