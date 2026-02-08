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

export default function Footer() {
  const { restaurant } = useRestaurant();

  const hasAddress =
    restaurant.addressLine1 || restaurant.city || restaurant.state || restaurant.postalCode;

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-2 text-sm text-gray-600">
              {hasAddress && (
                <address className="not-italic">
                  {restaurant.addressLine1 && <div>{restaurant.addressLine1}</div>}
                  {restaurant.addressLine2 && <div>{restaurant.addressLine2}</div>}
                  {(restaurant.city || restaurant.state || restaurant.postalCode) && (
                    <div>
                      {restaurant.city}
                      {restaurant.city && restaurant.state && ', '}
                      {restaurant.state} {restaurant.postalCode}
                    </div>
                  )}
                </address>
              )}
              {restaurant.phone && (
                <div>
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="hover:text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-all duration-200"
                  >
                    {restaurant.phone}
                  </a>
                </div>
              )}
              {restaurant.email && (
                <div>
                  <a
                    href={`mailto:${restaurant.email}`}
                    className="hover:text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-all duration-200"
                  >
                    {restaurant.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Powered By */}
          <div className="flex flex-col items-start md:items-end justify-end">
            <p className="text-sm text-gray-600">
              Powered by{' '}
              <a
                href="https://github.com/openorder/openorder"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-900 hover:text-gray-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-all duration-200"
              >
                OpenOrder
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Open-source restaurant ordering platform
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
