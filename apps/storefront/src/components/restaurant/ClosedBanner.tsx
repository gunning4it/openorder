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

import type { Restaurant, OperatingHours } from '../../lib/api';
import { getNextOpeningTime } from '../../lib/hours';

interface ClosedBannerProps {
  restaurant: Restaurant;
  operatingHours: OperatingHours[];
}

export default function ClosedBanner({ restaurant, operatingHours }: ClosedBannerProps) {
  const nextOpening = getNextOpeningTime(restaurant, operatingHours);

  return (
    <div
      className="bg-amber-50 border-l-4 border-amber-600 px-6 py-4"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-amber-900">
              We&apos;re currently closed
            </h3>
            {nextOpening ? (
              <p className="mt-1 text-sm text-amber-800">
                We open {nextOpening.day} at {nextOpening.time}. You can browse our menu, but
                ordering is not available right now.
              </p>
            ) : (
              <p className="mt-1 text-sm text-amber-800">
                You can browse our menu, but ordering is not available right now.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
