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

import { useEffect, useState } from 'react';
import { useCartStore } from '../../stores/cart.store';

export default function CartButton() {
  const itemCount = useCartStore((state) => state.itemCount());
  const toggleSidebar = useCartStore((state) => state.toggleSidebar);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  // Animate when item count increases
  useEffect(() => {
    if (itemCount > prevCount && prevCount > 0) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(itemCount);
  }, [itemCount, prevCount]);

  if (itemCount === 0) {
    return null;
  }

  return (
    <button
      onClick={toggleSidebar}
      className={`
        fixed bottom-4 right-4 sm:top-20 sm:bottom-auto z-40
        flex items-center justify-center
        w-14 h-14 sm:w-16 sm:h-16
        text-white bg-blue-600 rounded-full shadow-lg
        hover:bg-blue-700 hover:shadow-xl hover:scale-105
        active:bg-blue-800 active:scale-95
        focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200
        ${shouldAnimate ? 'animate-bounce' : ''}
      `}
      aria-label={`View cart with ${itemCount} item${itemCount === 1 ? '' : 's'}`}
    >
      {/* Shopping Cart Icon */}
      <svg
        className="h-6 w-6 sm:h-7 sm:w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {/* Item Count Badge */}
      <span
        className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-white shadow-sm"
        aria-hidden="true"
      >
        {itemCount > 99 ? '99+' : itemCount}
      </span>
    </button>
  );
}
