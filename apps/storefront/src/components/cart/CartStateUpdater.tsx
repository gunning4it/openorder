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

import { useEffect } from 'react';
import { useCartStore } from '../../stores/cart.store';

interface CartStateUpdaterProps {
  restaurantSlug: string;
  isRestaurantOpen: boolean;
}

/**
 * Client component to sync server-side restaurant state with cart store
 */
export default function CartStateUpdater({
  restaurantSlug,
  isRestaurantOpen,
}: CartStateUpdaterProps) {
  useEffect(() => {
    const { setRestaurantSlug, setRestaurantOpen } = useCartStore.getState();
    setRestaurantSlug(restaurantSlug);
    setRestaurantOpen(isRestaurantOpen);
  }, [restaurantSlug, isRestaurantOpen]);

  return null;
}
