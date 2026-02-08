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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartModifier {
  modifierId: string;
  name: string;
  price: number; // cents
}

export interface CartItem {
  id: string; // Unique ID for this cart item (not menu item ID)
  menuItemId: string;
  name: string;
  unitPrice: number; // cents, base price of the item
  quantity: number;
  modifiers: CartModifier[];
  specialNotes?: string;
  imageUrl?: string;
  subtotal: number; // calculated: (unitPrice + sum(modifier prices)) * quantity
}

interface CartStore {
  items: CartItem[];
  restaurantSlug: string;
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clear: () => void;
  setRestaurantSlug: (slug: string) => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // Computed
  subtotal: () => number;
  itemCount: () => number;
}

// Helper to generate unique cart item ID
function generateCartItemId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to calculate item subtotal
function calculateSubtotal(
  unitPrice: number,
  modifiers: CartModifier[],
  quantity: number
): number {
  const modifierTotal = modifiers.reduce((sum, mod) => sum + mod.price, 0);
  return (unitPrice + modifierTotal) * quantity;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantSlug: '',
      isOpen: false,

      addItem: (item) => {
        const id = generateCartItemId();
        const subtotal = calculateSubtotal(item.unitPrice, item.modifiers, item.quantity);
        set((state) => ({
          items: [...state.items, { ...item, id, subtotal }],
        }));
      },

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        })),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const items = state.items.map((item) => {
            if (item.id === itemId) {
              const subtotal = calculateSubtotal(item.unitPrice, item.modifiers, quantity);
              return { ...item, quantity, subtotal };
            }
            return item;
          });
          return { items };
        }),

      updateNotes: (itemId, notes) =>
        set((state) => {
          const items = state.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, specialNotes: notes };
            }
            return item;
          });
          return { items };
        }),

      clear: () => set({ items: [] }),

      setRestaurantSlug: (slug) => set({ restaurantSlug: slug }),

      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),

      openSidebar: () => set({ isOpen: true }),

      closeSidebar: () => set({ isOpen: false }),

      subtotal: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      // Only persist cart items and restaurant slug, not UI state
      partialize: (state) => ({
        items: state.items,
        restaurantSlug: state.restaurantSlug,
      }),
    }
  )
);
