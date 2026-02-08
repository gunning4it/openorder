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

import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

/**
 * Dynamic sitemap generation for all active restaurant pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];

  try {
    // Fetch all active restaurants (would need an API endpoint for this)
    // For now, return basic sitemap structure
    // TODO: Add GET /api/restaurants endpoint that returns list of active restaurant slugs

    // Example of what this would look like with restaurant data:
    // const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    // const response = await fetch(`${apiUrl}/restaurants`);
    // const restaurants = await response.json();
    //
    // restaurants.forEach((restaurant) => {
    //   if (restaurant.isActive) {
    //     urls.push({
    //       url: `${BASE_URL}/order/${restaurant.slug}`,
    //       lastModified: restaurant.updatedAt,
    //       changeFrequency: 'weekly',
    //       priority: 0.8,
    //     });
    //   }
    // });
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return urls;
}
