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

import { useState } from 'react';
import { useMenuItems, useDeleteMenuItem, useToggleItemAvailability } from '../../lib/api/items';
import type { MenuItem } from '@openorder/shared-types';
import BulkActionsToolbar from './BulkActionsToolbar';

interface ItemListProps {
  selectedCategoryId?: string;
  onAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
}

/**
 * Format price from cents to dollars
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ItemList({ selectedCategoryId, onAddItem, onEditItem }: ItemListProps) {
  const { data: items, isLoading } = useMenuItems(selectedCategoryId);
  const deleteMutation = useDeleteMenuItem();
  const toggleAvailabilityMutation = useToggleItemAvailability();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const displayItems = items || [];

  const handleDelete = (item: MenuItem) => {
    if (
      confirm(
        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleToggleAvailability = (item: MenuItem) => {
    toggleAvailabilityMutation.mutate({
      itemId: item.id,
      isAvailable: !item.isAvailable,
    });
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === displayItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(displayItems.map((item) => item.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  const getSelectedMenuItems = (): MenuItem[] => {
    return displayItems.filter((item) => selectedItems.has(item.id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && (
        <BulkActionsToolbar
          selectedItems={getSelectedMenuItems()}
          onClearSelection={handleClearSelection}
          onActionComplete={handleClearSelection}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Menu Items</h2>
          <p className="mt-2 text-sm text-gray-600">
            {selectedCategoryId
              ? 'Showing items in selected category'
              : 'Showing all menu items'}
          </p>
        </div>
        {displayItems.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="
              inline-flex items-center gap-2
              px-4 py-2 text-sm font-medium
              text-gray-700 bg-white
              border border-gray-300 rounded-md
              hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              transition-all duration-200
            "
          >
            <input
              type="checkbox"
              checked={selectedItems.size === displayItems.length && displayItems.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              aria-label="Select all items"
            />
            {selectedItems.size === displayItems.length && displayItems.length > 0
              ? 'Deselect All'
              : 'Select All'}
          </button>
        )}
      </div>

      {/* Empty State */}
      {displayItems.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dashed border-gray-300 rounded-lg">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No items yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            {selectedCategoryId
              ? 'This category has no items. Add your first item to get started.'
              : 'No menu items found. Create your first item to get started.'}
          </p>
          <button
            onClick={onAddItem}
            className="
              mt-6 inline-flex items-center justify-center
              px-4 py-2 text-sm font-medium
              text-white bg-blue-600
              border border-transparent rounded-md
              hover:bg-blue-700
              active:bg-blue-800 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              transition-all duration-200 shadow-sm
            "
          >
            Add First Item
          </button>
        </div>
      ) : (
        <>
          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className={`
                  bg-white border-2 rounded-lg overflow-hidden
                  hover:shadow-lg hover:-translate-y-0.5
                  transition-all duration-200
                  ${selectedItems.has(item.id) ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'}
                `}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white shadow-sm"
                    aria-label={`Select ${item.name}`}
                  />
                </div>

                {/* Image */}
                <div className="relative w-full h-48 bg-gray-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="h-16 w-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Availability Badge */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white">
                        86'd (Sold Out)
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Name and Price */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 leading-tight">
                      {item.name}
                    </h3>
                    <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  )}

                  {/* Availability Toggle */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${item.isAvailable ? 'bg-green-600' : 'bg-gray-300'}
                      `}
                      role="switch"
                      aria-checked={item.isAvailable}
                      aria-label={`Toggle availability for ${item.name}`}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white
                          transition-transform duration-200
                          ${item.isAvailable ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditItem(item)}
                      className="
                        flex-1 inline-flex items-center justify-center gap-2
                        px-4 py-2 text-sm font-medium
                        text-gray-700 bg-white
                        border border-gray-300 rounded-md
                        hover:bg-gray-50 hover:border-gray-400
                        active:bg-gray-100 active:scale-95
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        transition-all duration-200
                      "
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="
                        flex-1 inline-flex items-center justify-center gap-2
                        px-4 py-2 text-sm font-medium
                        text-red-700 bg-white
                        border border-red-300 rounded-md
                        hover:bg-red-50 hover:border-red-400
                        active:bg-red-100 active:scale-95
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                        transition-all duration-200
                      "
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Add Button */}
          <button
            onClick={onAddItem}
            className="
              fixed bottom-8 right-8
              inline-flex items-center justify-center gap-2
              px-6 py-4 text-base font-medium
              text-white bg-blue-600
              border border-transparent rounded-full
              hover:bg-blue-700
              active:bg-blue-800 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              transition-all duration-200 shadow-lg hover:shadow-xl
            "
            aria-label="Add new menu item"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Item
          </button>
        </>
      )}
    </div>
  );
}
