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

import { z } from 'zod';

// ============================================================
// MENU CATEGORY
// ============================================================

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  availableFrom?: string | null; // "11:00" (24hr format)
  availableTo?: string | null;   // "15:00" (24hr format)
  createdAt: Date;
  updatedAt: Date;
  items?: MenuItem[];
}

export const createMenuCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
  imageUrl: z.string().url('Must be a valid URL').optional().nullable(),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').default(0),
  isActive: z.boolean().default(true),
  availableFrom: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:mm format').optional().nullable(),
  availableTo: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:mm format').optional().nullable(),
});

export const updateMenuCategorySchema = createMenuCategorySchema.partial();

export const reorderCategoriesSchema = z.object({
  categoryIds: z.array(z.string()).min(1, 'At least one category ID is required'),
});

export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>;
export type UpdateMenuCategoryInput = z.infer<typeof updateMenuCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;

// ============================================================
// MENU ITEM
// ============================================================

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number; // In cents
  compareAtPrice?: number | null; // In cents
  imageUrl?: string | null;
  ingredients: string[];
  allergens: string[];
  tags: string[];
  calories?: number | null;
  prepTimeMin?: number | null;
  isActive: boolean;
  isAvailable: boolean;
  stockCount?: number | null;
  maxQuantity: number;
  posItemId?: string | null;
  posData?: unknown;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  modifierGroups?: MenuModifierGroup[];
  category?: MenuCategory;
}

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional().nullable(),
  price: z.number().int().min(0, 'Price must be non-negative'),
  compareAtPrice: z.number().int().min(0, 'Compare at price must be non-negative').optional().nullable(),
  imageUrl: z.string().url('Must be a valid URL').optional().nullable(),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  calories: z.number().int().min(0, 'Calories must be non-negative').optional().nullable(),
  prepTimeMin: z.number().int().min(1, 'Prep time must be at least 1 minute').optional().nullable(),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  stockCount: z.number().int().min(0, 'Stock count must be non-negative').optional().nullable(),
  maxQuantity: z.number().int().min(1, 'Max quantity must be at least 1').default(99),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').default(0),
  isFeatured: z.boolean().default(false),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().omit({ categoryId: true }).extend({
  categoryId: z.string().min(1, 'Category is required').optional(),
});

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type ToggleAvailabilityInput = z.infer<typeof toggleAvailabilitySchema>;

// ============================================================
// MENU MODIFIER GROUP
// ============================================================

export interface MenuModifierGroup {
  id: string;
  menuItemId: string;
  name: string;
  description?: string | null;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  modifiers?: MenuModifier[];
}

const modifierGroupBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
  required: z.boolean().default(false),
  minSelect: z.number().int().min(0, 'Min select must be non-negative').default(0),
  maxSelect: z.number().int().min(1, 'Max select must be at least 1').default(1),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').default(0),
});

export const createModifierGroupSchema = modifierGroupBaseSchema.refine(
  (data) => data.minSelect <= data.maxSelect,
  { message: 'Min select must be less than or equal to max select', path: ['minSelect'] }
).refine(
  (data) => !data.required || data.minSelect > 0,
  { message: 'Required groups must have minSelect > 0', path: ['minSelect'] }
);

export const updateModifierGroupSchema = modifierGroupBaseSchema.partial();

export type CreateModifierGroupInput = z.infer<typeof createModifierGroupSchema>;
export type UpdateModifierGroupInput = z.infer<typeof updateModifierGroupSchema>;

// ============================================================
// MENU MODIFIER
// ============================================================

export interface MenuModifier {
  id: string;
  modifierGroupId: string;
  name: string;
  price: number; // In cents (can be 0 or positive)
  isDefault: boolean;
  isAvailable: boolean;
  posModifierId?: string | null;
  sortOrder: number;
  calories?: number | null;
}

export const createModifierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  price: z.number().int().min(0, 'Price must be non-negative').default(0),
  isDefault: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').default(0),
  calories: z.number().int().min(0, 'Calories must be non-negative').optional().nullable(),
});

export const updateModifierSchema = createModifierSchema.partial();

export type CreateModifierInput = z.infer<typeof createModifierSchema>;
export type UpdateModifierInput = z.infer<typeof updateModifierSchema>;

// ============================================================
// PUBLIC MENU RESPONSE
// ============================================================

export interface PublicMenuCategory {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  items: PublicMenuItem[];
}

export interface PublicMenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  ingredients: string[];
  allergens: string[];
  tags: string[];
  calories?: number | null;
  isAvailable: boolean;
  modifierGroups: PublicModifierGroup[];
}

export interface PublicModifierGroup {
  id: string;
  name: string;
  description?: string | null;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: PublicModifier[];
}

export interface PublicModifier {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  calories?: number | null;
}

export interface PublicRestaurantInfo {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  brandColor: string;
  acceptingOrders: boolean;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  timezone: string;
  currency: string;
  locale: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  dineInEnabled: boolean;
  prepTimeMinutes: number;
  taxRate: number;
  taxInclusive: boolean;
  tipsEnabled: boolean;
  tipPresets: number[];
}

export interface PublicMenuResponse {
  restaurant: PublicRestaurantInfo;
  categories: PublicMenuCategory[];
}
