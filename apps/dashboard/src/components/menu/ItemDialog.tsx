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

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MenuItem, CreateMenuItemInput } from '@openorder/shared-types';
import { useCategories } from '../../lib/api/categories';
import { useCreateMenuItem, useUpdateMenuItem } from '../../lib/api/items';
import ImageUpload from '../media/ImageUpload';

interface ItemDialogProps {
  item?: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

// Form schema - subset of fields we collect in the UI
const itemFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.number().int().min(0, 'Price must be 0 or greater'),
  compareAtPrice: z.number().int().min(0).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.string().optional(), // Comma-separated tags
  allergens: z.string().optional(), // Comma-separated allergens
  ingredients: z.string().max(2000).optional().nullable(), // Will convert to array
  calories: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean(),
  isAvailable: z.boolean(),
  stockCount: z.number().int().min(0).optional().nullable(),
  maxQuantity: z.number().int().min(1).optional().nullable(),
  prepTimeMin: z.number().int().min(0).optional().nullable(),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

// Helper to convert dollars to cents
function dollarsToCents(dollars: string): number {
  const num = parseFloat(dollars);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

// Helper to convert cents to dollars
function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Helper to convert form data to API format
function toApiFormat(formData: ItemFormData): Partial<CreateMenuItemInput> {
  const data: Partial<CreateMenuItemInput> = {
    name: formData.name,
    description: formData.description ?? null,
    categoryId: formData.categoryId,
    price: formData.price,
    compareAtPrice: formData.compareAtPrice ?? null,
    imageUrl: formData.imageUrl ?? null,
    tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()).filter(Boolean) : [],
    ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()).filter(Boolean) : [],
    calories: formData.calories ?? null,
    isActive: formData.isActive,
    isAvailable: formData.isAvailable,
    stockCount: formData.stockCount ?? null,
    prepTimeMin: formData.prepTimeMin ?? null,
  };

  // Only include maxQuantity if it's a valid number (not null/undefined)
  if (formData.maxQuantity !== null && formData.maxQuantity !== undefined) {
    data.maxQuantity = formData.maxQuantity;
  }

  return data;
}

export default function ItemDialog({ item, isOpen, onClose, defaultCategoryId }: ItemDialogProps) {
  const isEditing = !!item;
  const { data: categoriesResponse } = useCategories();
  const categories = categoriesResponse || [];
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();

  const [activeTab, setActiveTab] = useState<'basics' | 'details' | 'availability'>('basics');
  const [priceInput, setPriceInput] = useState('0.00');
  const [compareAtPriceInput, setCompareAtPriceInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: defaultCategoryId || '',
      price: 0,
      compareAtPrice: null,
      imageUrl: '',
      tags: '',
      allergens: '',
      ingredients: '',
      calories: null,
      isActive: true,
      isAvailable: true,
      stockCount: null,
      maxQuantity: null,
      prepTimeMin: null,
    },
  });

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        const tagsString = Array.isArray(item.tags) ? item.tags.join(', ') : '';
        const allergensString = Array.isArray(item.allergens) ? item.allergens.join(', ') : '';
        const ingredientsString = Array.isArray(item.ingredients) ? item.ingredients.join(', ') : '';

        reset({
          name: item.name,
          description: item.description || '',
          categoryId: item.categoryId,
          price: item.price,
          compareAtPrice: item.compareAtPrice,
          imageUrl: item.imageUrl || '',
          tags: tagsString,
          allergens: allergensString,
          ingredients: ingredientsString,
          calories: item.calories,
          isActive: item.isActive,
          isAvailable: item.isAvailable,
          stockCount: item.stockCount,
          maxQuantity: item.maxQuantity,
          prepTimeMin: item.prepTimeMin,
        });
        setPriceInput(centsToDollars(item.price));
        setCompareAtPriceInput(item.compareAtPrice ? centsToDollars(item.compareAtPrice) : '');
      } else {
        reset({
          name: '',
          description: '',
          categoryId: defaultCategoryId || '',
          price: 0,
          compareAtPrice: null,
          imageUrl: '',
          tags: '',
          allergens: '',
          ingredients: '',
          calories: null,
          isActive: true,
          isAvailable: true,
          stockCount: null,
          maxQuantity: null,
          prepTimeMin: null,
        });
        setPriceInput('0.00');
        setCompareAtPriceInput('');
      }
      setActiveTab('basics');
    }
  }, [isOpen, item, reset, defaultCategoryId]);

  const onSubmit = async (data: ItemFormData) => {
    try {
      const apiData = toApiFormat(data);

      if (isEditing) {
        await updateMutation.mutateAsync({
          itemId: item.id,
          data: apiData,
        });
      } else {
        // For create, we know required fields are present from form validation
        await createMutation.mutateAsync(apiData as Partial<CreateMenuItemInput> & Pick<CreateMenuItemInput, 'name' | 'categoryId' | 'price'>);
      }
      onClose();
    } catch (error) {
      // Error is handled by mutation onError
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Menu Item' : 'Create Menu Item'}
          </h2>
          <button
            onClick={onClose}
            className="
              p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-all duration-200
            "
            aria-label="Close dialog"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <nav className="flex gap-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('basics')}
              className={`
                px-4 py-2 text-sm font-medium rounded-t-md
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${activeTab === 'basics'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              Basics
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`
                px-4 py-2 text-sm font-medium rounded-t-md
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${activeTab === 'details'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`
                px-4 py-2 text-sm font-medium rounded-t-md
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${activeTab === 'availability'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              Availability
            </button>
          </nav>
        </div>

        {/* Form Content (Scrollable) */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-6">
          {/* Basics Tab */}
          {activeTab === 'basics' && (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name <span className="text-red-600">*</span>
                </label>
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="e.g., Margherita Pizza"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md resize-none
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="Describe your menu item..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  {...register('categoryId')}
                  id="categoryId"
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-2 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-600">$</span>
                    <input
                      id="price"
                      type="text"
                      value={priceInput}
                      onChange={(e) => {
                        setPriceInput(e.target.value);
                        setValue('price', dollarsToCents(e.target.value));
                      }}
                      className="
                        w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all duration-200
                      "
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-2 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Compare At Price (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-600">$</span>
                    <input
                      id="compareAtPrice"
                      type="text"
                      value={compareAtPriceInput}
                      onChange={(e) => {
                        setCompareAtPriceInput(e.target.value);
                        const cents = dollarsToCents(e.target.value);
                        setValue('compareAtPrice', cents > 0 ? cents : null);
                      }}
                      className="
                        w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all duration-200
                      "
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <ImageUpload
                value={watch('imageUrl') || null}
                onChange={(url) => setValue('imageUrl', url)}
                aspectRatio="square"
                label="Item Image"
                helperText="Upload a high-quality image of your menu item. Best results with square images."
              />
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  {...register('tags')}
                  id="tags"
                  type="text"
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="e.g., vegetarian, spicy, popular, new"
                />
                <p className="mt-2 text-sm text-gray-600">Comma-separated tags</p>
              </div>

              {/* Allergens */}
              <div>
                <label htmlFor="allergens" className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens
                </label>
                <input
                  {...register('allergens')}
                  id="allergens"
                  type="text"
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="e.g., gluten, dairy, nuts, soy, eggs"
                />
                <p className="mt-2 text-sm text-gray-600">Comma-separated allergens</p>
              </div>

              {/* Ingredients */}
              <div>
                <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients
                </label>
                <textarea
                  {...register('ingredients')}
                  id="ingredients"
                  rows={4}
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md resize-none
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="List ingredients..."
                />
                {errors.ingredients && (
                  <p className="mt-2 text-sm text-red-600">{errors.ingredients.message}</p>
                )}
              </div>

              {/* Calories */}
              <div>
                <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-2">
                  Calories
                </label>
                <input
                  {...register('calories', { valueAsNumber: true })}
                  id="calories"
                  type="number"
                  min="0"
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="e.g., 450"
                />
                {errors.calories && (
                  <p className="mt-2 text-sm text-red-600">{errors.calories.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              {/* Active Toggle */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
                <input
                  {...register('isActive')}
                  id="isActive"
                  type="checkbox"
                  className="
                    w-4 h-4 text-blue-600 border-gray-300 rounded
                    focus:ring-2 focus:ring-blue-500
                  "
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                  Active (visible in menu)
                </label>
              </div>

              {/* Available Toggle */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
                <input
                  {...register('isAvailable')}
                  id="isAvailable"
                  type="checkbox"
                  className="
                    w-4 h-4 text-blue-600 border-gray-300 rounded
                    focus:ring-2 focus:ring-blue-500
                  "
                />
                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">
                  Available (not 86'd)
                </label>
              </div>

              {/* Stock Count */}
              <div>
                <label htmlFor="stockCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Count (Optional)
                </label>
                <input
                  {...register('stockCount', { valueAsNumber: true })}
                  id="stockCount"
                  type="number"
                  min="0"
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* Max Quantity Per Order */}
              <div>
                <label htmlFor="maxQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Quantity Per Order (Optional)
                </label>
                <input
                  {...register('maxQuantity', { valueAsNumber: true })}
                  id="maxQuantity"
                  type="number"
                  min="1"
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* Prep Time */}
              <div>
                <label htmlFor="prepTimeMin" className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Time (Minutes)
                </label>
                <input
                  {...register('prepTimeMin', { valueAsNumber: true })}
                  id="prepTimeMin"
                  type="number"
                  min="0"
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                  placeholder="e.g., 15"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="
              px-4 py-2 text-sm font-medium
              text-gray-700 bg-white
              border border-gray-300 rounded-md
              hover:bg-gray-50
              active:bg-gray-100 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="
              px-4 py-2 text-sm font-medium
              text-white bg-blue-600
              border border-transparent rounded-md
              hover:bg-blue-700
              active:bg-blue-800 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
