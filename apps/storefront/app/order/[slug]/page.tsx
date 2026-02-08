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
import { isRestaurantOpen } from '../../../src/lib/hours';
import MenuDisplay from '../../../src/components/menu/MenuDisplay';
import CartButton from '../../../src/components/cart/CartButton';
import CartSidebar from '../../../src/components/cart/CartSidebar';
import ClosedBanner from '../../../src/components/restaurant/ClosedBanner';
import OperatingHours from '../../../src/components/restaurant/OperatingHours';
import CartStateUpdater from '../../../src/components/cart/CartStateUpdater';

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

  const isOpen = isRestaurantOpen(menuData.restaurant, menuData.operatingHours);

  return (
    <>
      {/* Closed Banner */}
      {!isOpen && (
        <ClosedBanner restaurant={menuData.restaurant} operatingHours={menuData.operatingHours} />
      )}

      {/* Cover Image */}
      {menuData.restaurant.coverImageUrl && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="mb-8 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={menuData.restaurant.coverImageUrl}
              alt={`${menuData.restaurant.name} cover`}
              className="w-full h-48 sm:h-64 lg:h-80 object-cover"
            />
          </div>
        </div>
      )}

      {/* Restaurant Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Display - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <MenuDisplay menu={menuData} />
          </div>

          {/* Sidebar - Operating Hours */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <OperatingHours
                restaurant={menuData.restaurant}
                operatingHours={menuData.operatingHours}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cart State Updater */}
      <CartStateUpdater restaurantSlug={params.slug} isRestaurantOpen={isOpen} />

      {/* Cart Components */}
      {isOpen && (
        <>
          <CartButton />
          <CartSidebar />
        </>
      )}
    </>
  );
}
