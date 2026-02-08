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

import { useRestaurant } from '../../contexts/RestaurantContext';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

function isOpenNow(
  operatingHours: { dayOfWeek: number; isClosed: boolean; openTime: string; closeTime: string }[],
  timezone: string
): { isOpen: boolean; nextOpening?: string } {
  const now = toZonedTime(new Date(), timezone);
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = format(now, 'HH:mm');

  const todayHours = operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!todayHours || todayHours.isClosed) {
    // Find next opening day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (dayOfWeek + i) % 7;
      const nextDayHours = operatingHours.find((h) => h.dayOfWeek === nextDay);
      if (nextDayHours && !nextDayHours.isClosed) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nextDay];
        return {
          isOpen: false,
          nextOpening: `${dayName} at ${nextDayHours.openTime}`,
        };
      }
    }
    return { isOpen: false };
  }

  // Handle overnight shifts (e.g., 22:00 - 02:00)
  if (todayHours.closeTime < todayHours.openTime) {
    const isOpen = currentTime >= todayHours.openTime || currentTime <= todayHours.closeTime;
    if (!isOpen) {
      return {
        isOpen: false,
        nextOpening: `Today at ${todayHours.openTime}`,
      };
    }
    return { isOpen: true };
  }

  // Normal hours
  const isOpen = currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  if (!isOpen) {
    if (currentTime < todayHours.openTime) {
      return {
        isOpen: false,
        nextOpening: `Today at ${todayHours.openTime}`,
      };
    }
    // Closed for today, find next opening
    for (let i = 1; i <= 7; i++) {
      const nextDay = (dayOfWeek + i) % 7;
      const nextDayHours = operatingHours.find((h) => h.dayOfWeek === nextDay);
      if (nextDayHours && !nextDayHours.isClosed) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nextDay];
        return {
          isOpen: false,
          nextOpening: `${dayName} at ${nextDayHours.openTime}`,
        };
      }
    }
    return { isOpen: false };
  }

  return { isOpen: true };
}

export default function Header() {
  const { restaurant, operatingHours } = useRestaurant();
  const { isOpen, nextOpening } = isOpenNow(operatingHours, restaurant.timezone);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
          {/* Logo and Name */}
          <div className="flex items-center gap-4">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={`${restaurant.name} logo`}
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-md object-cover flex-shrink-0"
              />
            ) : null}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>

          {/* Operating Hours Status */}
          <div className="flex items-center gap-2">
            {isOpen ? (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-md"
                role="status"
                aria-label="Restaurant is currently open"
              >
                <div className="flex items-center justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-700">Open Now</span>
              </div>
            ) : (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md"
                role="status"
                aria-label="Restaurant is currently closed"
              >
                <div className="flex items-center justify-center">
                  <span className="relative flex h-3 w-3 rounded-full bg-red-500"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-red-700">Closed</span>
                  {nextOpening && (
                    <span className="text-xs text-red-600">Opens {nextOpening}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
