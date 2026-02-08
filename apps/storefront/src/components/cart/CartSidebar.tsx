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

import { useCartStore } from '../../stores/cart.store';

// Format price in cents to dollars
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartSidebar() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeSidebar = useCartStore((state) => state.closeSidebar);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
        <div className="w-screen max-w-md sm:max-w-lg">
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-6 flex items-center justify-between">
              <h2 id="cart-title" className="text-2xl font-bold text-gray-900">
                Your Cart
              </h2>
              <button
                onClick={closeSidebar}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md active:bg-gray-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                aria-label="Close cart"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <svg
                    className="h-16 w-16 text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9l2-6h8l2 6" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-sm text-gray-600">Browse the menu to add items</p>
                </div>
              ) : (
                /* Cart Items */
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-6 border-b border-gray-200 last:border-b-0">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                            <svg
                              className="h-8 w-8 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
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
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{item.name}</h3>

                        {/* Modifiers */}
                        {item.modifiers.length > 0 && (
                          <div className="text-xs text-gray-600 mb-1">
                            {item.modifiers.map((mod, idx) => (
                              <span key={mod.modifierId}>
                                {mod.name}
                                {mod.price !== 0 && ` (+${formatPrice(mod.price)})`}
                                {idx < item.modifiers.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Special Notes */}
                        {item.specialNotes && (
                          <p className="text-xs italic text-gray-500 mb-2">&quot;{item.specialNotes}&quot;</p>
                        )}

                        {/* Quantity & Price */}
                        <div className="flex items-center gap-4 mt-2">
                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 active:bg-gray-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              aria-label="Decrease quantity"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 active:bg-gray-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                              aria-label="Increase quantity"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Price */}
                          <span className="text-base font-bold text-gray-900">{formatPrice(item.subtotal)}</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md active:bg-red-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-6 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Subtotal</span>
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                {/* Checkout Button */}
                <button
                  disabled
                  className="w-full flex items-center justify-center px-6 py-4 text-base font-semibold text-white bg-gray-400 rounded-md cursor-not-allowed transition-all duration-200"
                  title="Checkout will be available in Phase 2"
                >
                  Checkout (Coming Soon)
                </button>
                <p className="text-xs text-center text-gray-600">
                  Payment processing will be available in Phase 2
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
