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

import type { MenuCategory as MenuCategoryType } from '../../lib/api';
import MenuItem from './MenuItem';

interface MenuCategoryProps {
  category: MenuCategoryType;
  onItemClick: (itemId: string) => void;
}

export default function MenuCategory({ category, onItemClick }: MenuCategoryProps) {
  if (category.items.length === 0) {
    return null;
  }

  return (
    <section
      id={`category-${category.id}`}
      className="scroll-mt-24"
      aria-labelledby={`category-heading-${category.id}`}
    >
      {/* Category Header */}
      <div className="mb-6">
        {category.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-32 sm:h-40 object-cover"
            />
          </div>
        )}
        <h2
          id={`category-heading-${category.id}`}
          className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight"
        >
          {category.name}
        </h2>
        {category.description && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.items.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
