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

import { notFound } from 'next/navigation';
import { getPublicMenu } from '../../../src/lib/api';
import { RestaurantProvider } from '../../../src/contexts/RestaurantContext';
import Header from '../../../src/components/layout/Header';
import Footer from '../../../src/components/layout/Footer';

export default async function OrderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  // Fetch restaurant and menu data (Server Component)
  const menuData = await getPublicMenu(params.slug);

  if (!menuData) {
    notFound();
  }

  const { restaurant, operatingHours } = menuData;

  // Apply custom CSS if provided
  const customStyles = restaurant.customCss
    ? `<style>${restaurant.customCss}</style>`
    : '';

  return (
    <RestaurantProvider restaurant={restaurant} operatingHours={operatingHours}>
      {customStyles && (
        <div dangerouslySetInnerHTML={{ __html: customStyles }} />
      )}
      <div
        className="min-h-screen flex flex-col bg-gray-50"
        style={
          {
            '--brand-color': restaurant.brandColor,
          } as React.CSSProperties
        }
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </RestaurantProvider>
  );
}
