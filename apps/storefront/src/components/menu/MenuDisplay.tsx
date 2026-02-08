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

'use client';

import { useState } from 'react';
import type { PublicMenuResponse, MenuItem } from '../../lib/api';
import { useCartStore } from '../../stores/cart.store';
import MenuCategoryNav from './MenuCategoryNav';
import MenuCategory from './MenuCategory';
import ItemDetailModal from './ItemDetailModal';

interface MenuDisplayProps {
  menu: PublicMenuResponse;
}

interface SelectedModifier {
  modifierId: string;
  name: string;
  price: number;
}

export default function MenuDisplay({ menu }: MenuDisplayProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (itemId: string) => {
    // Find the item across all categories
    const item = menu.categories
      .flatMap((cat) => cat.items)
      .find((item) => item.id === itemId);

    if (item) {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleAddToCart = (
    item: MenuItem,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string
  ) => {
    const { addItem, openSidebar } = useCartStore.getState();

    addItem({
      menuItemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity,
      modifiers: modifiers.map(m => ({
        modifierId: m.modifierId,
        name: m.name,
        price: m.price,
      })),
      specialNotes: notes || undefined,
      imageUrl: item.imageUrl,
    });

    openSidebar();
    handleCloseModal();
  };

  // Filter out empty categories
  const activeCategories = menu.categories.filter(
    (category) => category.items.length > 0
  );

  if (activeCategories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Menu Items Available
          </h2>
          <p className="text-gray-600">
            This restaurant hasn&apos;t added any items to their menu yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Category Navigation */}
      <MenuCategoryNav categories={activeCategories} />

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-16">
          {activeCategories.map((category) => (
            <MenuCategory
              key={category.id}
              category={category}
              onItemClick={handleItemClick}
            />
          ))}
        </div>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
