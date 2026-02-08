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
// CART TYPES
// ============================================================

export interface CartModifier {
  modifierId: string;
  modifierGroupId: string;
  name: string;
  price: number; // In cents
}

export interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number; // In cents (base price without modifiers)
  quantity: number;
  modifiers: CartModifier[];
  specialNotes?: string;
  subtotal: number; // Calculated: (unitPrice + sum(modifier prices)) * quantity
}

export interface Cart {
  restaurantSlug: string;
  items: CartItem[];
  subtotal: number; // Sum of all item subtotals
  itemCount: number; // Total quantity of items
}

// ============================================================
// CART VALIDATION SCHEMAS
// ============================================================

export const cartModifierSchema = z.object({
  modifierId: z.string().min(1, 'Modifier ID is required'),
  modifierGroupId: z.string().min(1, 'Modifier group ID is required'),
  name: z.string().min(1, 'Modifier name is required'),
  price: z.number().int().min(0, 'Modifier price must be non-negative'),
});

export const addToCartSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  name: z.string().min(1, 'Item name is required'),
  unitPrice: z.number().int().min(0, 'Unit price must be non-negative'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
  modifiers: z.array(cartModifierSchema).default([]),
  specialNotes: z.string().max(500, 'Special notes must be less than 500 characters').optional(),
});

export const updateCartItemQuantitySchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be non-negative').max(99, 'Quantity cannot exceed 99'),
});

export const updateCartItemNotesSchema = z.object({
  specialNotes: z.string().max(500, 'Special notes must be less than 500 characters').optional(),
});

export type CartModifierInput = z.infer<typeof cartModifierSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemQuantityInput = z.infer<typeof updateCartItemQuantitySchema>;
export type UpdateCartItemNotesInput = z.infer<typeof updateCartItemNotesSchema>;

// ============================================================
// CART HELPERS
// ============================================================

/**
 * Calculate the subtotal for a cart item
 */
export function calculateCartItemSubtotal(item: Omit<CartItem, 'subtotal'>): number {
  const modifierTotal = item.modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
  return (item.unitPrice + modifierTotal) * item.quantity;
}

/**
 * Calculate the total subtotal for all items in cart
 */
export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

/**
 * Calculate the total item count in cart
 */
export function calculateCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Format price from cents to display string
 */
export function formatPrice(cents: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Validate modifier selections against modifier group rules
 */
export interface ModifierGroupRule {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  modifierIds: string[];
}

export interface ModifierValidationError {
  groupId: string;
  groupName: string;
  message: string;
}

export function validateModifierSelections(
  selectedModifierIds: string[],
  groups: ModifierGroupRule[]
): ModifierValidationError[] {
  const errors: ModifierValidationError[] = [];

  for (const group of groups) {
    const selectedCount = selectedModifierIds.filter((id) =>
      group.modifierIds.includes(id)
    ).length;

    if (group.required && selectedCount < group.minSelect) {
      errors.push({
        groupId: group.id,
        groupName: group.name,
        message: `Please select at least ${group.minSelect} option${group.minSelect > 1 ? 's' : ''} for ${group.name}`,
      });
    }

    if (selectedCount < group.minSelect) {
      errors.push({
        groupId: group.id,
        groupName: group.name,
        message: `Please select at least ${group.minSelect} option${group.minSelect > 1 ? 's' : ''} for ${group.name}`,
      });
    }

    if (selectedCount > group.maxSelect) {
      errors.push({
        groupId: group.id,
        groupName: group.name,
        message: `You can only select up to ${group.maxSelect} option${group.maxSelect > 1 ? 's' : ''} for ${group.name}`,
      });
    }
  }

  return errors;
}
