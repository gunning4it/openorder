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

import type { Restaurant, OperatingHours, MenuCategory } from '../../lib/api';
import { getDayName } from '../../lib/hours';

interface RestaurantSchemaProps {
  restaurant: Restaurant;
  operatingHours: OperatingHours[];
  categories: MenuCategory[];
}

/**
 * Generate Schema.org JSON-LD structured data for restaurant
 * Helps search engines understand the restaurant, menu, and hours
 */
export default function RestaurantSchema({
  restaurant,
  operatingHours,
  categories,
}: RestaurantSchemaProps) {
  // Format operating hours for Schema.org
  const openingHoursSpecification = operatingHours
    .filter((hours) => !hours.isClosed)
    .map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: getDayName(hours.dayOfWeek),
      opens: hours.openTime,
      closes: hours.closeTime,
    }));

  // Build menu sections from categories
  const hasMenuSection = categories.map((category) => ({
    '@type': 'MenuSection',
    name: category.name,
    description: category.description,
    hasMenuItem: category.items.map((item) => ({
      '@type': 'MenuItem',
      name: item.name,
      description: item.description,
      offers: {
        '@type': 'Offer',
        price: (item.price / 100).toFixed(2),
        priceCurrency: restaurant.currency,
      },
      image: item.imageUrl,
      nutrition: item.calories
        ? {
            '@type': 'NutritionInformation',
            calories: `${item.calories} calories`,
          }
        : undefined,
      suitableForDiet: [
        ...(item.tags?.includes('vegetarian') ? ['https://schema.org/VegetarianDiet'] : []),
        ...(item.tags?.includes('vegan') ? ['https://schema.org/VeganDiet'] : []),
      ],
    })),
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    description: restaurant.description,
    image: restaurant.logoUrl || restaurant.coverImageUrl,
    logo: restaurant.logoUrl,
    url: `${process.env.NEXT_PUBLIC_URL || 'https://openorder.com'}/order/${restaurant.slug}`,
    telephone: restaurant.phone,
    email: restaurant.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [restaurant.addressLine1, restaurant.addressLine2].filter(Boolean).join(', '),
      addressLocality: restaurant.city,
      addressRegion: restaurant.state,
      postalCode: restaurant.postalCode,
      addressCountry: restaurant.country,
    },
    openingHoursSpecification,
    servesCuisine: categories.map((cat) => cat.name),
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection,
    },
    acceptsReservations: false,
    priceRange: '$$', // Can be calculated from menu items if needed
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
