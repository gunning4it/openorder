/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 * AGPL-3.0 License
 */

import Fastify, { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { configureJwt } from '../plugins/jwt.js';
import { menuRoutes } from '../modules/menu/menu.routes.js';
import { mediaRoutes } from '../modules/media/media.routes.js';
import { restaurantRoutes } from '../modules/restaurant/restaurant.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { hash } from 'argon2';

/**
 * Create a test Fastify instance with all routes
 */
export async function createTestServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false, // Disable logging in tests
  });

  // Register JWT plugin
  await fastify.register(configureJwt);

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(restaurantRoutes);
  await fastify.register(menuRoutes);
  await fastify.register(mediaRoutes);

  await fastify.ready();

  return fastify;
}

/**
 * Create a test restaurant with a staff
 */
export async function createTestRestaurant() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);

  const restaurant = await prisma.restaurant.create({
    data: {
      name: `Test Restaurant ${timestamp}`,
      slug: `test-rest-${timestamp}-${random}`,
      timezone: 'America/New_York',
      currency: 'USD',
      locale: 'en-US',
      country: 'US',
      isActive: true,
      acceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: false,
      dineInEnabled: false,
      prepTimeMinutes: 20,
    },
  });

  const staff = await prisma.staff.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      passwordHash: await hash('password123'),
      name: 'Test User',
      restaurantId: restaurant.id,
      role: 'OWNER',
      isActive: true,
    },
  });

  return { restaurant, user: staff };
}

/**
 * Create a test JWT token for a staff
 */
export function createTestToken(
  fastify: FastifyInstance,
  payload: {
    staffId: string;
    restaurantId: string;
    role: string;
  }
): string {
  return fastify.jwt.sign(payload);
}

/**
 * Clean up test data
 */
export async function cleanupTestData(restaurantId: string) {
  if (!restaurantId) {
    return; // Nothing to clean up
  }

  try {
    // Delete in order due to foreign key constraints
    await prisma.menuModifier.deleteMany({
      where: {
        modifierGroup: {
          menuItem: {
            restaurantId,
          },
        },
      },
    });

    await prisma.menuModifierGroup.deleteMany({
      where: {
        menuItem: {
          restaurantId,
        },
      },
    });

    await prisma.menuItem.deleteMany({
      where: { restaurantId },
    });

    await prisma.menuCategory.deleteMany({
      where: { restaurantId },
    });

    await prisma.staff.deleteMany({
      where: { restaurantId },
    });

    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });
  } catch (error) {
    // Ignore cleanup errors (restaurant might not exist)
    console.warn('Cleanup error:', error);
  }
}
