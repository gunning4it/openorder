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

import { toZonedTime } from 'date-fns-tz';
import type { Restaurant, OperatingHours as OperatingHoursType } from '../../lib/api';
import {
  isRestaurantOpen,
  getNextOpeningTime,
  getFormattedHours,
  getDayName,
} from '../../lib/hours';

interface OperatingHoursProps {
  restaurant: Restaurant;
  operatingHours: OperatingHoursType[];
}

export default function OperatingHours({ restaurant, operatingHours }: OperatingHoursProps) {
  const isOpen = isRestaurantOpen(restaurant, operatingHours);
  const nextOpening = !isOpen ? getNextOpeningTime(restaurant, operatingHours) : null;

  // Get current day of week in restaurant's timezone
  const now = toZonedTime(new Date(), restaurant.timezone);
  const currentDayOfWeek = now.getDay();

  // Sort operating hours by day of week (0-6)
  const sortedHours = [...operatingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Hours</h3>

        {/* Open/Closed Badge */}
        {isOpen ? (
          <span
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full"
            aria-label="Restaurant is currently open"
          >
            <span className="h-2 w-2 bg-green-600 rounded-full" aria-hidden="true" />
            Open Now
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full"
            aria-label="Restaurant is currently closed"
          >
            <span className="h-2 w-2 bg-red-600 rounded-full" aria-hidden="true" />
            Closed
          </span>
        )}
      </div>

      {/* Hours List */}
      <div className="divide-y divide-gray-100">
        {sortedHours.map((hours) => {
          const isCurrentDay = hours.dayOfWeek === currentDayOfWeek;
          const dayName = getDayName(hours.dayOfWeek);
          const hoursText = getFormattedHours(hours);

          return (
            <div
              key={hours.id}
              className={`
                flex items-center justify-between px-6 py-3
                transition-colors duration-200
                ${isCurrentDay ? 'bg-blue-50 border-l-2 border-blue-600' : 'border-l-2 border-transparent'}
              `}
            >
              <span
                className={`
                  text-sm font-medium
                  ${isCurrentDay ? 'text-gray-900' : 'text-gray-700'}
                `}
              >
                {dayName}
              </span>
              <span
                className={`
                  text-sm
                  ${hours.isClosed ? 'text-gray-400' : 'text-gray-600'}
                `}
              >
                {hoursText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next Opening Time (if closed) */}
      {!isOpen && nextOpening && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Opens {nextOpening.day} at {nextOpening.time}
          </p>
        </div>
      )}
    </div>
  );
}
