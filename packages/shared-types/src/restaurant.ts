/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 * AGPL-3.0 License
 */

import { z } from 'zod';

/**
 * Zod schema for creating a restaurant
 */
export const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  description: z.string().max(1000).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20).optional(),
  timezone: z.string().optional(),
  currency: z.string().length(3, 'Currency must be 3-letter code').optional(),
  locale: z.string().optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2, 'Country must be 2-letter code').optional(),
});

/**
 * Zod schema for updating a restaurant
 */
export const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
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
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
  acceptingOrders: z.boolean().optional(),
  pickupEnabled: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  dineInEnabled: z.boolean().optional(),
  prepTimeMinutes: z.number().int().min(0).max(300).optional(),
});

/**
 * Zod schema for generating slug from name
 */
export const generateSlugSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type GenerateSlugInput = z.infer<typeof generateSlugSchema>;
