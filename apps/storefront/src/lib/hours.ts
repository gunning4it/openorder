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

import { toZonedTime, format } from 'date-fns-tz';
import type { Restaurant, OperatingHours } from './api';

/**
 * Check if restaurant is currently open
 */
export function isRestaurantOpen(
  restaurant: Restaurant,
  operatingHours: OperatingHours[]
): boolean {
  if (!restaurant.acceptingOrders) {
    return false;
  }

  const now = toZonedTime(new Date(), restaurant.timezone);
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = format(now, 'HH:mm', { timeZone: restaurant.timezone });

  const todayHours = operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!todayHours || todayHours.isClosed) {
    return false;
  }

  // Handle overnight shifts (e.g., 22:00 - 02:00)
  if (todayHours.closeTime < todayHours.openTime) {
    return currentTime >= todayHours.openTime || currentTime <= todayHours.closeTime;
  }

  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
}

/**
 * Day names tuple - guarantees exactly 7 elements
 */
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Get day name by index (0-6)
 */
function getDayNameByIndex(dayIndex: number): string {
  return DAY_NAMES[dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6];
}

/**
 * Get the next opening time for the restaurant
 */
export function getNextOpeningTime(
  restaurant: Restaurant,
  operatingHours: OperatingHours[]
): { day: string; time: string } | null {
  if (!restaurant.acceptingOrders) {
    return null;
  }

  const now = toZonedTime(new Date(), restaurant.timezone);
  const currentDayOfWeek = now.getDay();
  const currentTime = format(now, 'HH:mm', { timeZone: restaurant.timezone });

  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDayOfWeek + i) % 7;
    const hours = operatingHours.find((h) => h.dayOfWeek === checkDay);

    if (!hours || hours.isClosed) {
      continue;
    }

    // If checking today
    if (i === 0) {
      // If we haven't passed opening time yet
      if (currentTime < hours.openTime) {
        return {
          day: 'today',
          time: formatTime(hours.openTime),
        };
      }
      // If overnight shift and we're before closing time
      if (hours.closeTime < hours.openTime && currentTime <= hours.closeTime) {
        return {
          day: 'today',
          time: formatTime(hours.openTime),
        };
      }
    } else if (i === 1) {
      return {
        day: 'tomorrow',
        time: formatTime(hours.openTime),
      };
    } else {
      return {
        day: getDayNameByIndex(checkDay),
        time: formatTime(hours.openTime),
      };
    }
  }

  return null;
}

/**
 * Format time from 24h to 12h format
 */
function formatTime(time: string): string {
  const parts = time.split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get formatted hours for display
 */
export function getFormattedHours(hours: OperatingHours): string {
  if (hours.isClosed) {
    return 'Closed';
  }

  const openTime = formatTime(hours.openTime);
  const closeTime = formatTime(hours.closeTime);

  // Handle overnight shifts
  if (hours.closeTime < hours.openTime) {
    return `${openTime} - ${closeTime} (next day)`;
  }

  return `${openTime} - ${closeTime}`;
}

/**
 * Get day name from day of week number (0-6)
 */
export function getDayName(dayOfWeek: number): string {
  return getDayNameByIndex(dayOfWeek);
}
