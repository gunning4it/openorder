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

import type { MenuItem as MenuItemType } from '../../lib/api';

interface MenuItemProps {
  item: MenuItemType;
  onClick: () => void;
}

// Format price in cents to dollars
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Tag emoji mapping
const TAG_EMOJIS: Record<string, string> = {
  vegetarian: '🌱',
  vegan: '🌿',
  spicy: '🌶️',
  popular: '⭐',
  new: '✨',
  'gluten-free': '🌾',
};

export default function MenuItem({ item, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={!item.isAvailable}
      className="relative w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
      aria-label={`View details for ${item.name}`}
    >
      {/* Image */}
      <div className="relative w-full aspect-video bg-gray-100">
        {item.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="h-16 w-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!item.isAvailable && (
          <div
            className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="bg-white px-4 py-2 rounded-md">
              <span className="text-sm font-semibold text-gray-900">
                Out of Stock
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                aria-label={tag}
              >
                {TAG_EMOJIS[tag.toLowerCase()] && (
                  <span aria-hidden="true">{TAG_EMOJIS[tag.toLowerCase()]}</span>
                )}
                <span className="capitalize">{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
            {item.description}
          </p>
        )}

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(item.price)}
          </span>
          {item.compareAtPrice && item.compareAtPrice > item.price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(item.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Calories */}
        {item.calories && (
          <p className="text-xs text-gray-500 mt-2">
            {item.calories} cal
          </p>
        )}
      </div>
    </button>
  );
}
