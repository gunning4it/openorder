// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Restaurant Routes
// Create and retrieve restaurants

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { restaurantService } from './restaurant.service.js';
import { handleError } from '../../utils/errors.js';

const createRestaurantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(1000).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  timezone: z.string().optional(),
  currency: z.string().length(3).optional(),
  locale: z.string().optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
});

export const restaurantRoutes: FastifyPluginAsync = async (fastify) => {
  // Create restaurant
  fastify.post('/restaurants', async (request, reply) => {
    try {
      const data = createRestaurantSchema.parse(request.body);

      const restaurant = await restaurantService.createRestaurant(data);

      return reply.status(201).send({
        restaurant,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get restaurant by slug
  fastify.get('/restaurants/:slug', async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };

      const restaurant = await restaurantService.getRestaurantBySlug(slug);

      return reply.send({
        restaurant,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Check if slug is available
  fastify.get('/restaurants/check-slug/:slug', async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };

      const isAvailable = await restaurantService.isSlugAvailable(slug);

      return reply.send({
        slug,
        available: isAvailable,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Generate slug from name
  fastify.post('/restaurants/generate-slug', async (request, reply) => {
    try {
      const { name } = request.body as { name: string };

      if (!name || typeof name !== 'string') {
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Name is required',
        });
      }

      const slug = restaurantService.generateSlug(name);

      return reply.send({
        name,
        slug,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });
};
