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

import { useState, useEffect } from 'react';
import type { MenuItem } from '../../lib/api';

interface SelectedModifier {
  modifierId: string;
  name: string;
  price: number;
}

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string
  ) => void;
}

// Format price in cents to dollars
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ItemDetailModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Reset state when modal opens with new item
  useEffect(() => {
    if (isOpen && item) {
      setSelectedModifiers([]);
      setQuantity(1);
      setSpecialNotes('');
      setExpandedSections({});
    }
  }, [isOpen, item]);

  if (!isOpen || !item) {
    return null;
  }

  // Validation: check if all required modifier groups are satisfied
  const isValid = item.modifierGroups.every((group) => {
    if (!group.required) return true;
    const selectedCount = selectedModifiers.filter((mod) =>
      group.modifiers.some((gMod) => gMod.id === mod.modifierId)
    ).length;
    return selectedCount >= group.minSelect && selectedCount <= group.maxSelect;
  });

  // Calculate total price
  const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
  const totalPrice = (item.price + modifierTotal) * quantity;

  const maxQuantity = item.maxQuantity || 99;

  const handleModifierToggle = (
    groupId: string,
    modifierId: string,
    name: string,
    price: number,
    isRadio: boolean
  ) => {
    setSelectedModifiers((prev) => {
      // If radio (maxSelect=1), remove all from this group first
      if (isRadio) {
        const group = item.modifierGroups.find((g) => g.id === groupId);
        if (!group) return prev;

        const otherGroupModifiers = prev.filter(
          (mod) => !group.modifiers.some((gMod) => gMod.id === mod.modifierId)
        );

        // Toggle: if already selected, deselect; otherwise select
        const isSelected = prev.some((mod) => mod.modifierId === modifierId);
        if (isSelected) {
          return otherGroupModifiers;
        }
        return [...otherGroupModifiers, { modifierId, name, price }];
      }

      // Checkbox behavior
      const isSelected = prev.some((mod) => mod.modifierId === modifierId);
      if (isSelected) {
        return prev.filter((mod) => mod.modifierId !== modifierId);
      }
      return [...prev, { modifierId, name, price }];
    });
  };

  const handleAddToCart = () => {
    onAddToCart(item, selectedModifiers, quantity, specialNotes);
    onClose();
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-lg shadow-xl flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 active:bg-gray-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Hero Image */}
          {item.imageUrl && (
            <div className="relative w-full aspect-video bg-gray-100 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Name & Description */}
              <div>
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                  {item.name}
                </h2>
                {item.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                )}
                <p className="text-xl font-bold text-gray-900 mt-4">{formatPrice(item.price)}</p>
              </div>

              {/* Collapsible: Ingredients */}
              {item.ingredients && item.ingredients.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => toggleSection('ingredients')}
                    className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-all duration-200"
                  >
                    <span className="text-sm font-semibold text-gray-900">Ingredients</span>
                    <svg
                      className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                        expandedSections.ingredients ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSections.ingredients && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {item.ingredients.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Collapsible: Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => toggleSection('allergens')}
                    className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-all duration-200"
                  >
                    <span className="text-sm font-semibold text-gray-900">Allergens</span>
                    <svg
                      className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                        expandedSections.allergens ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSections.allergens && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded border border-amber-200"
                        >
                          ⚠️ {allergen}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible: Nutritional Info */}
              {(item.calories || item.prepTimeMin) && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => toggleSection('nutrition')}
                    className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-all duration-200"
                  >
                    <span className="text-sm font-semibold text-gray-900">Nutritional Info</span>
                    <svg
                      className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                        expandedSections.nutrition ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSections.nutrition && (
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      {item.calories && <p>Calories: {item.calories}</p>}
                      {item.prepTimeMin && <p>Prep Time: ~{item.prepTimeMin} minutes</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Modifier Groups */}
              {item.modifierGroups.map((group) => {
                const isRadio = group.maxSelect === 1;
                return (
                  <div key={group.id} className="border-t border-gray-200 pt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.name}
                        {group.required && <span className="text-red-600 ml-1">*</span>}
                      </h3>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {group.required
                          ? `Required - Choose ${group.minSelect === group.maxSelect ? group.minSelect : `${group.minSelect}-${group.maxSelect}`}`
                          : `Optional - Choose up to ${group.maxSelect}`}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {group.modifiers.map((modifier) => {
                        const isSelected = selectedModifiers.some(
                          (mod) => mod.modifierId === modifier.id
                        );

                        return (
                          <label
                            key={modifier.id}
                            className={`flex items-center gap-4 p-4 border rounded-md cursor-pointer transition-all duration-200 ${
                              modifier.isAvailable
                                ? isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <input
                              type={isRadio ? 'radio' : 'checkbox'}
                              name={isRadio ? `group-${group.id}` : undefined}
                              checked={isSelected}
                              disabled={!modifier.isAvailable}
                              onChange={() =>
                                handleModifierToggle(
                                  group.id,
                                  modifier.id,
                                  modifier.name,
                                  modifier.price,
                                  isRadio
                                )
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                {modifier.name}
                              </span>
                              {!modifier.isAvailable && (
                                <span className="text-xs text-gray-500 ml-2">(Unavailable)</span>
                              )}
                            </div>
                            {modifier.price !== 0 && (
                              <span className="text-sm font-medium text-gray-700">
                                {modifier.price > 0 ? '+' : ''}
                                {formatPrice(modifier.price)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Special Notes */}
              <div className="border-t border-gray-200 pt-6">
                <label htmlFor="special-notes" className="block text-sm font-semibold text-gray-900 mb-2">
                  Special Instructions
                </label>
                <textarea
                  id="special-notes"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special requests? (e.g., no onions)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Quantity Stepper */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex items-center justify-center w-11 h-11 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 active:bg-gray-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="Decrease quantity"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-xl font-semibold text-gray-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    disabled={quantity >= maxQuantity}
                    className="flex items-center justify-center w-11 h-11 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 active:bg-gray-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="Increase quantity"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={!isValid}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              <span>Add to Cart</span>
              <span>•</span>
              <span>{formatPrice(totalPrice)}</span>
            </button>
            {!isValid && (
              <p className="text-xs text-red-600 text-center mt-2">
                Please select all required options
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
