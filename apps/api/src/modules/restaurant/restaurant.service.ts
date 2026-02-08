// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Restaurant Service
// Business logic for restaurant management

import { prisma } from '../../config/database.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

export interface CreateRestaurantInput {
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export class RestaurantService {
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
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { slug: input.slug },
    });

    if (existingRestaurant) {
      throw new ValidationError('A restaurant with this slug already exists');
    }

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
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
    const restaurant = await prisma.restaurant.findUnique({
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
    const restaurant = await prisma.restaurant.findUnique({
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
    const count = await prisma.restaurant.count({
      where: { slug },
    });

    return count === 0;
  }
}

export const restaurantService = new RestaurantService();
