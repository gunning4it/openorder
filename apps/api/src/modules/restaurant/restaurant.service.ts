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

import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type {
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from '@openorder/shared-types';

export class RestaurantService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate slug from name (URL-safe identifier)
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Create a new restaurant
   */
  async createRestaurant(input: CreateRestaurantInput) {
    // Check if slug is already taken
    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: { slug: input.slug },
    });

    if (existingRestaurant) {
      throw new ValidationError('A restaurant with this slug already exists');
    }

    // Create restaurant
    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        email: input.email,
        phone: input.phone,
        timezone: input.timezone || 'America/New_York',
        currency: input.currency || 'USD',
        locale: input.locale || 'en-US',
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country || 'US',
        isActive: true,
        acceptingOrders: true,
        pickupEnabled: true,
        deliveryEnabled: false,
        dineInEnabled: false,
        prepTimeMinutes: 20,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        email: true,
        phone: true,
        timezone: true,
        currency: true,
        locale: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        isActive: true,
        acceptingOrders: true,
        pickupEnabled: true,
        deliveryEnabled: true,
        dineInEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return restaurant;
  }

  /**
   * Get restaurant by slug
   */
  async getRestaurantBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverImageUrl: true,
        email: true,
        phone: true,
        timezone: true,
        currency: true,
        locale: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        latitude: true,
        longitude: true,
        isActive: true,
        acceptingOrders: true,
        pickupEnabled: true,
        deliveryEnabled: true,
        dineInEnabled: true,
        prepTimeMinutes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    return restaurant;
  }

  /**
   * Get restaurant by ID
   */
  async getRestaurantById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    return restaurant;
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const count = await this.prisma.restaurant.count({
      where: { slug },
    });

    return count === 0;
  }

  /**
   * Update restaurant by ID
   * - Verifies restaurant exists
   * - Allows partial updates
   */
  async updateRestaurant(
    id: string,
    data: UpdateRestaurantInput
  ) {
    // Verify restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    // Update restaurant
    const updatedRestaurant = await this.prisma.restaurant.update({
      where: { id },
      data,
    });

    return updatedRestaurant;
  }
}
