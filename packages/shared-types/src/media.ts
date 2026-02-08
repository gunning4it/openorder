/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 * AGPL-3.0 License
 */

import { z } from 'zod';

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Maximum file size (5MB)
 */
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Default image processing settings
 */
export const DEFAULT_IMAGE_MAX_WIDTH = 800;
export const DEFAULT_IMAGE_QUALITY = 85;

/**
 * Zod schema for image upload validation
 * Note: Actual file buffer validation happens after multipart parsing
 */
export const uploadImageSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    errorMap: () => ({
      message: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
    }),
  }),
  size: z
    .number()
    .max(MAX_IMAGE_FILE_SIZE, `File size exceeds maximum of ${MAX_IMAGE_FILE_SIZE / 1024 / 1024}MB`)
    .optional(),
});

/**
 * Upload image options
 */
export interface UploadImageOptions {
  filename: string;
  mimeType: string;
  restaurantId?: string;
  maxWidth?: number;
  quality?: number;
}

/**
 * Upload image result
 */
export interface UploadImageResult {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * TypeScript types derived from Zod schemas
 */
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
