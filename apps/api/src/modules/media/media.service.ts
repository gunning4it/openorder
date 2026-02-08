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

import sharp from 'sharp';
import type { IStorageAdapter } from './storage.interface.js';
import { LocalStorageAdapter } from './storage.local.js';
import { ValidationError } from '../../utils/errors.js';
import type {
  UploadImageOptions,
  UploadImageResult,
} from '@openorder/shared-types';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_SIZE,
  DEFAULT_IMAGE_MAX_WIDTH,
  DEFAULT_IMAGE_QUALITY,
} from '@openorder/shared-types';

export class MediaService {
  private storage: IStorageAdapter;
  private publicUrl: string;

  constructor(
    publicUrl = process.env.PUBLIC_URL || 'http://localhost:4000',
    uploadPath = process.env.UPLOAD_PATH || '/data/uploads'
  ) {
    this.storage = new LocalStorageAdapter(uploadPath);
    this.publicUrl = publicUrl;
  }

  /**
   * Upload and process an image
   * - Validates file type and size
   * - Resizes image with Sharp
   * - Stores in storage adapter
   * @param buffer - Image buffer
   * @param options - Upload options
   * @returns Upload result with URL
   */
  async uploadImage(
    buffer: Buffer,
    options: UploadImageOptions
  ): Promise<UploadImageResult> {
    // Validate MIME type
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(options.mimeType)) {
      throw new ValidationError(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`
      );
    }

    // Validate file size
    if (buffer.length > MAX_IMAGE_FILE_SIZE) {
      throw new ValidationError(
        `File size exceeds maximum of ${MAX_IMAGE_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Process image with Sharp
    const processedBuffer = await this.processImage(
      buffer,
      options.maxWidth || DEFAULT_IMAGE_MAX_WIDTH,
      options.quality || DEFAULT_IMAGE_QUALITY
    );

    // Store image
    const id = await this.storage.upload(processedBuffer, {
      filename: options.filename,
      mimeType: options.mimeType,
      size: processedBuffer.length,
      restaurantId: options.restaurantId,
    });

    // Generate URL
    const url = this.generateUrl(id);

    return {
      id,
      url,
      filename: options.filename,
      mimeType: options.mimeType,
      size: processedBuffer.length,
    };
  }

  /**
   * Get image by ID
   * @param id - Image ID
   * @returns Image buffer and metadata
   */
  async getImage(id: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const file = await this.storage.get(id);

    return {
      buffer: file.buffer,
      mimeType: file.metadata.mimeType,
    };
  }

  /**
   * Get image metadata by ID (for ownership verification)
   * @param id - Image ID
   * @returns Image metadata including restaurantId
   */
  async getImageMetadata(id: string): Promise<{ restaurantId?: string }> {
    const file = await this.storage.get(id);
    return {
      restaurantId: file.metadata.restaurantId,
    };
  }

  /**
   * Delete image by ID
   * @param id - Image ID
   */
  async deleteImage(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  /**
   * Check if image exists
   * @param id - Image ID
   */
  async imageExists(id: string): Promise<boolean> {
    return this.storage.exists(id);
  }

  /**
   * Process image with Sharp
   * - Resize to max width while maintaining aspect ratio
   * - Optimize quality
   * - Convert to appropriate format
   */
  private async processImage(
    buffer: Buffer,
    maxWidth: number,
    quality: number
  ): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Only resize if image is wider than maxWidth
      if (metadata.width && metadata.width > maxWidth) {
        image.resize(maxWidth, undefined, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // Apply format-specific optimizations
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        image.jpeg({ quality, mozjpeg: true });
      } else if (metadata.format === 'png') {
        image.png({ quality, compressionLevel: 9 });
      } else if (metadata.format === 'webp') {
        image.webp({ quality });
      }

      return image.toBuffer();
    } catch (error) {
      throw new ValidationError(
        `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate public URL for image
   */
  private generateUrl(id: string): string {
    return `${this.publicUrl}/api/media/${id}`;
  }
}
