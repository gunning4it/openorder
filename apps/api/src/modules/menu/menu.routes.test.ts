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

describe('Menu Routes', () => {
  let fastify: FastifyInstance;
  let token: string;
  let restaurantId: string;
  let categoryId: string;
  let itemId: string;

  beforeAll(async () => {
    fastify = await createTestServer();

    // Create test restaurant and user
    const { restaurant, user } = await createTestRestaurant();
    restaurantId = restaurant.id;

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

  describe('Menu Categories', () => {
    it('should create a menu category', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: `/restaurants/${restaurantId}/menu/categories`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          name: 'Appetizers',
          description: 'Start your meal right',
          isActive: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Appetizers');
      expect(body.data.sortOrder).toBe(0);

      categoryId = body.data.id;
    });

    it('should list menu categories', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/restaurants/${restaurantId}/menu/categories`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should update a menu category', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: `/restaurants/${restaurantId}/menu/categories/${categoryId}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          name: 'Starters',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Starters');
    });

    it('should reject unauthorized access', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: `/restaurants/${restaurantId}/menu/categories`,
        payload: {
          name: 'Unauthorized Category',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject access to different restaurant', async () => {
      const wrongToken = createTestToken(fastify, {
        staffId: 'wrong-user-id',
        restaurantId: 'wrong-restaurant-id',
        role: 'OWNER',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: `/restaurants/${restaurantId}/menu/categories`,
        headers: {
          authorization: `Bearer ${wrongToken}`,
        },
        payload: {
          name: 'Forbidden Category',
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Menu Items', () => {
    it('should create a menu item', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: `/restaurants/${restaurantId}/menu/items`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          name: 'Buffalo Wings',
          description: 'Spicy chicken wings',
          price: 1295, // $12.95 in cents
          categoryId,
          isActive: true,
          isAvailable: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Buffalo Wings');
      expect(body.data.price).toBe(1295);

      itemId = body.data.id;
    });

    it('should get a menu item', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/restaurants/${restaurantId}/menu/items/${itemId}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(itemId);
    });

    it('should toggle item availability', async () => {
      const response = await fastify.inject({
        method: 'PATCH',
        url: `/restaurants/${restaurantId}/menu/items/${itemId}/availability`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          isAvailable: false,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.isAvailable).toBe(false);
    });

    it('should validate price is positive', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: `/restaurants/${restaurantId}/menu/items`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          name: 'Invalid Item',
          price: -100, // Negative price
          categoryId,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should delete a menu item (soft delete)', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/restaurants/${restaurantId}/menu/items/${itemId}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(204);
    });
  });
});
