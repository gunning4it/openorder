/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 * AGPL-3.0 License
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import {
  createTestServer,
  createTestRestaurant,
  createTestToken,
  cleanupTestData,
} from '../../test/helpers.js';

describe('Media Routes', () => {
  let fastify: FastifyInstance;
  let token: string;
  let restaurantId: string;
  let uploadedImageId: string;

  // Create a 1x1 PNG for testing
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

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

  describe('Image Upload', () => {
    it('should upload an image', async () => {
      const form = new FormData();
      form.append('file', testImageBuffer, {
        filename: 'test.png',
        contentType: 'image/png',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
        payload: form,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.url).toContain('/api/media/');
      expect(body.data.mimeType).toBe('image/png');

      uploadedImageId = body.data.id;
    });

    it('should reject unauthorized upload', async () => {
      const form = new FormData();
      form.append('file', testImageBuffer, {
        filename: 'test.png',
        contentType: 'image/png',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: form.getHeaders(),
        payload: form,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject invalid file type', async () => {
      const form = new FormData();
      form.append('file', Buffer.from('not an image'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
        payload: form,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject file that is too large', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const form = new FormData();
      form.append('file', largeBuffer, {
        filename: 'large.png',
        contentType: 'image/png',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
        payload: form,
      });

      // Fastify multipart throws error before route handler, may return 500 or 413
      expect([413, 500]).toContain(response.statusCode);
    });
  });

  describe('Image Retrieval', () => {
    it('should retrieve an uploaded image', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/media/${uploadedImageId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('image/png');
      expect(response.headers['cache-control']).toContain('public');
    });

    it('should return 404 for non-existent image', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/media/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/media/invalid-uuid',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Image Deletion', () => {
    it('should delete an image with proper ownership', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/media/${uploadedImageId}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(204);
    });

    it('should reject deletion without authentication', async () => {
      // First upload a new image
      const form = new FormData();
      form.append('file', testImageBuffer, {
        filename: 'test2.png',
        contentType: 'image/png',
      });

      const uploadResponse = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
        payload: form,
      });

      const { data } = JSON.parse(uploadResponse.body);

      // Try to delete without auth
      const deleteResponse = await fastify.inject({
        method: 'DELETE',
        url: `/media/${data.id}`,
      });

      expect(deleteResponse.statusCode).toBe(401);
    });

    it('should reject deletion from different restaurant', async () => {
      // First upload a new image
      const form = new FormData();
      form.append('file', testImageBuffer, {
        filename: 'test3.png',
        contentType: 'image/png',
      });

      const uploadResponse = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
        payload: form,
      });

      const { data } = JSON.parse(uploadResponse.body);

      // Create token for different restaurant
      const wrongToken = createTestToken(fastify, {
        staffId: 'wrong-user-id',
        restaurantId: 'wrong-restaurant-id',
        role: 'OWNER',
      });

      // Try to delete with wrong restaurant
      const deleteResponse = await fastify.inject({
        method: 'DELETE',
        url: `/media/${data.id}`,
        headers: {
          authorization: `Bearer ${wrongToken}`,
        },
      });

      expect(deleteResponse.statusCode).toBe(403);
    });
  });
});
