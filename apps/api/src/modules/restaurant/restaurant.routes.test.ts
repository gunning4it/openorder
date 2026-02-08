/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 * AGPL-3.0 License
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  createTestServer,
  createTestRestaurant,
  createTestToken,
  cleanupTestData,
} from '../../test/helpers.js';

describe('Restaurant Routes', () => {
  let fastify: FastifyInstance;
  let token: string;
  let restaurantId: string;
  let restaurantSlug: string;

  beforeAll(async () => {
    fastify = await createTestServer();

    // Create test restaurant and user
    const { restaurant, user } = await createTestRestaurant();
    restaurantId = restaurant.id;
    restaurantSlug = restaurant.slug;

    // Create auth token
    token = createTestToken(fastify, {
      staffId: user.id,
      restaurantId: restaurant.id,
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await cleanupTestData(restaurantId);
    await fastify.close();
  });

  describe('Slug Generation', () => {
    it('should generate slug from restaurant name', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/restaurants/generate-slug',
        headers: {
          'Content-Type': 'application/json',
        },
        payload: {
          name: 'My Awesome Restaurant',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.slug).toBe('my-awesome-restaurant');
      expect(body.data.name).toBe('My Awesome Restaurant');
    });

    it('should generate slug with numbers and hyphens', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/restaurants/generate-slug',
        headers: {
          'Content-Type': 'application/json',
        },
        payload: {
          name: 'Café #1 & Grill',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should reject empty name', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/restaurants/generate-slug',
        headers: {
          'Content-Type': 'application/json',
        },
        payload: {
          name: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Slug Availability', () => {
    it('should check if slug is available', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/restaurants/check-slug/available-slug-123',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.slug).toBe('available-slug-123');
      expect(body.data.available).toBe(true);
    });

    it('should return false for taken slug', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/restaurants/check-slug/${restaurantSlug}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.available).toBe(false);
    });
  });

  describe('Get Restaurant', () => {
    it('should get restaurant by slug (public endpoint)', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/restaurants/${restaurantSlug}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.slug).toBe(restaurantSlug);
      expect(body.data.id).toBe(restaurantId);
      expect(body.data.name).toBeDefined();
    });

    it('should return 404 for non-existent restaurant', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/restaurants/non-existent-slug',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Create Restaurant', () => {
    it('should create a new restaurant with authentication', async () => {
      // Create a new user token (simulating a new owner)
      const newOwnerToken = createTestToken(fastify, {
        staffId: 'new-owner-id',
        restaurantId: 'will-be-created',
        role: 'OWNER',
      });

      const timestamp = Date.now();
      const response = await fastify.inject({
        method: 'POST',
        url: '/restaurants',
        headers: {
          authorization: `Bearer ${newOwnerToken}`,
          'Content-Type': 'application/json',
        },
        payload: {
          name: `New Restaurant ${timestamp}`,
          slug: `new-restaurant-${timestamp}`,
          description: 'A brand new restaurant',
          email: `new${timestamp}@example.com`,
          phone: '555-0123',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          currency: 'USD',
          timezone: 'America/Los_Angeles',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(`New Restaurant ${timestamp}`);
      expect(body.data.slug).toBe(`new-restaurant-${timestamp}`);
      expect(body.data.isActive).toBe(true);

      // Cleanup the created restaurant
      const { prisma } = await import('../../config/database.js');
      await prisma.restaurant.delete({
        where: { id: body.data.id },
      });
    });

    it('should reject duplicate slug', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/restaurants',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        payload: {
          name: 'Duplicate Restaurant',
          slug: restaurantSlug, // Existing slug
        },
      });

      expect(response.statusCode).toBe(400);
      // Just verify it returns a validation error (400 status is sufficient)
    });

    it('should reject creation without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/restaurants',
        headers: {
          'Content-Type': 'application/json',
        },
        payload: {
          name: 'Unauthorized Restaurant',
          slug: 'unauthorized-restaurant',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate slug format', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/restaurants',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        payload: {
          name: 'Invalid Slug Restaurant',
          slug: 'Invalid Slug!', // Invalid characters
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/restaurants',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        payload: {
          // Missing name and slug
          description: 'Missing required fields',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Update Restaurant', () => {
    it('should update restaurant details', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: `/restaurants/${restaurantId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        payload: {
          description: 'Updated description',
          phone: '555-9999',
          acceptingOrders: false,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.description).toBe('Updated description');
      expect(body.data.phone).toBe('555-9999');
      expect(body.data.acceptingOrders).toBe(false);
    });

    it('should reject update without authentication', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: `/restaurants/${restaurantId}`,
        headers: {
          'Content-Type': 'application/json',
        },
        payload: {
          description: 'Unauthorized update',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject update from different restaurant owner', async () => {
      const wrongToken = createTestToken(fastify, {
        staffId: 'wrong-user-id',
        restaurantId: 'wrong-restaurant-id',
        role: 'OWNER',
      });

      const response = await fastify.inject({
        method: 'PUT',
        url: `/restaurants/${restaurantId}`,
        headers: {
          authorization: `Bearer ${wrongToken}`,
          'Content-Type': 'application/json',
        },
        payload: {
          description: 'Forbidden update',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should validate update fields', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: `/restaurants/${restaurantId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        payload: {
          currency: 'INVALID', // Should be 3-letter code
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should allow partial updates', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: `/restaurants/${restaurantId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        payload: {
          prepTimeMinutes: 30, // Only update one field
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.prepTimeMinutes).toBe(30);
    });
  });
});
