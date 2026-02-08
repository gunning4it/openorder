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

import type { Metadata } from 'next';
import { getPublicMenu } from '../../../src/lib/api';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const menuData = await getPublicMenu(params.slug);

  if (!menuData) {
    return {
      title: 'Restaurant Not Found',
    };
  }

  const { restaurant } = menuData;

  return {
    title: `Order from ${restaurant.name} | Online Menu`,
    description:
      restaurant.description ||
      `Browse the menu and order online from ${restaurant.name}`,
    openGraph: {
      title: `${restaurant.name} - Order Online`,
      description: restaurant.description || `Order from ${restaurant.name}`,
      images: restaurant.logoUrl ? [restaurant.logoUrl] : [],
      type: 'website',
    },
  };
}

export default async function MenuPage({
  params,
}: {
  params: { slug: string };
}) {
  const menuData = await getPublicMenu(params.slug);

  if (!menuData) {
    return null; // Will be handled by notFound() in layout
  }

  const { categories } = menuData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cover Image */}
      {menuData.restaurant.coverImageUrl && (
        <div className="mb-8 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={menuData.restaurant.coverImageUrl}
            alt={`${menuData.restaurant.name} cover`}
            className="w-full h-48 sm:h-64 lg:h-80 object-cover"
          />
        </div>
      )}

      {/* Menu Content Placeholder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Menu</h2>
        <p className="text-gray-600">
          Menu display will be implemented in Task #15.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Found {categories.length} categories with{' '}
          {categories.reduce((total, cat) => total + cat.items.length, 0)} items
        </p>
      </div>
    </div>
  );
}
