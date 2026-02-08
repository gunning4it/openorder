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

import { FastifyPluginAsync } from 'fastify';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  generateSlugSchema,
} from '@openorder/shared-types';
import { RestaurantService } from './restaurant.service.js';
import { verifyAuth, requireRole } from '../auth/auth.middleware.js';
import { handleError } from '../../utils/errors.js';
import { prisma } from '../../config/database.js';
import type { JwtPayload } from '../../plugins/jwt.js';

const restaurantService = new RestaurantService(prisma);

export const restaurantRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/restaurants
   * Create a new restaurant
   * - Requires authentication (OWNER role)
   * - Validates slug uniqueness
   * - Returns created restaurant
   */
  fastify.post(
    '/restaurants',
    {
      preHandler: [verifyAuth, requireRole('OWNER')],
    },
    async (request, reply) => {
      try {
        // Validate request body
        const parseResult = createRestaurantSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        // Create restaurant
        const restaurant = await restaurantService.createRestaurant(
          parseResult.data
        );

        return reply.status(201).send({
          success: true,
          data: restaurant,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/restaurants/:slug
   * Get restaurant by slug
   * - Public endpoint (no authentication required)
   * - Returns restaurant details
   */
  fastify.get('/restaurants/:slug', async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };

      const restaurant = await restaurantService.getRestaurantBySlug(slug);

      return reply.send({
        success: true,
        data: restaurant,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  /**
   * PUT /api/restaurants/:id
   * Update restaurant by ID
   * - Requires authentication (OWNER role)
   * - Verifies user owns the restaurant
   * - Allows partial updates
   */
  fastify.put(
    '/restaurants/:id',
    {
      preHandler: [verifyAuth, requireRole('OWNER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { id } = request.params as { id: string };

        // Verify user owns this restaurant
        if (user.restaurantId !== id) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        // Validate request body
        const parseResult = updateRestaurantSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        // Update restaurant
        const restaurant = await restaurantService.updateRestaurant(
          id,
          parseResult.data
        );

        return reply.send({
          success: true,
          data: restaurant,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/restaurants/check-slug/:slug
   * Check if slug is available
   * - Public endpoint
   * - Returns availability status
   */
  fastify.get('/restaurants/check-slug/:slug', async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };

      const isAvailable = await restaurantService.isSlugAvailable(slug);

      return reply.send({
        success: true,
        data: {
          slug,
          available: isAvailable,
        },
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  /**
   * POST /api/restaurants/generate-slug
   * Generate slug from name
   * - Public endpoint
   * - Returns generated slug
   */
  fastify.post('/restaurants/generate-slug', async (request, reply) => {
    try {
      // Validate request body
      const parseResult = generateSlugSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw parseResult.error;
      }

      const slug = restaurantService.generateSlug(parseResult.data.name);

      return reply.send({
        success: true,
        data: {
          name: parseResult.data.name,
          slug,
        },
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });
};
