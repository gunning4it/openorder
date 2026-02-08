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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type MenuCategory,
} from '@openorder/shared-types';
import { useCreateCategory, useUpdateCategory } from '../../lib/api/categories';
import { useEffect } from 'react';
import { z } from 'zod';
import ImageUpload from '../media/ImageUpload';

interface CategoryDialogProps {
  category?: MenuCategory;
  isOpen: boolean;
  onClose: () => void;
}

// Form schema - subset of fields we collect in the UI
const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

// Helper to convert form data to API format
// Note: sortOrder is auto-assigned by the API, we don't need to send it
function toApiFormat(formData: CategoryFormData) {
  return {
    name: formData.name,
    description: formData.description ?? null,
    imageUrl: formData.imageUrl ?? null,
    isActive: formData.isActive,
  };
}

export default function CategoryDialog({ category, isOpen, onClose }: CategoryDialogProps) {
  const isEditing = !!category;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      isActive: true,
    },
  });

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({
          name: category.name,
          description: category.description || '',
          imageUrl: category.imageUrl || '',
          isActive: category.isActive,
        });
      } else {
        reset({
          name: '',
          description: '',
          imageUrl: '',
          isActive: true,
        });
      }
    }
  }, [isOpen, category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const apiData = toApiFormat(data);

      if (isEditing) {
        await updateMutation.mutateAsync({
          categoryId: category.id,
          data: apiData,
        });
      } else {
        await createMutation.mutateAsync(apiData);
      }
      onClose();
    } catch (error) {
      // Error is handled by mutation onError
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Category' : 'Create Category'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              {...register('name')}
              id="name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Appetizers"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Optional description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <ImageUpload
            value={watch('imageUrl') || null}
            onChange={(url) => setValue('imageUrl', url)}
            aspectRatio="16:9"
            label="Category Image"
            helperText="Optional image for this category. Landscape orientation works best."
          />

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              {...register('isActive')}
              id="isActive"
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active (visible to customers)
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
