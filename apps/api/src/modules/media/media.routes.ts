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
import multipart from '@fastify/multipart';
import { MediaService } from './media.service.js';
import { verifyAuth, requireRole } from '../auth/auth.middleware.js';
import { handleError } from '../../utils/errors.js';
import type { JwtPayload } from '../../plugins/jwt.js';
import {
  uploadImageSchema,
  MAX_IMAGE_FILE_SIZE,
} from '@openorder/shared-types';

const mediaService = new MediaService();

export const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  // Register multipart plugin for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: MAX_IMAGE_FILE_SIZE,
      files: 1, // Only allow one file per upload
    },
  });

  /**
   * POST /api/media/upload
   * Upload an image file
   * - Requires authentication (OWNER or MANAGER)
   * - Validates image type and size
   * - Processes and stores image
   * - Returns image ID and URL
   */
  fastify.post(
    '/media/upload',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;

        // Get file from multipart request
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: 'No file uploaded',
          });
        }

        // Convert stream to buffer
        const buffer = await data.toBuffer();

        // Validate with Zod schema
        const parseResult = uploadImageSchema.safeParse({
          filename: data.filename,
          mimeType: data.mimetype,
          size: buffer.length,
        });

        if (!parseResult.success) {
          // Throw the Zod error directly - handleError will format it
          throw parseResult.error;
        }

        // Upload and process image
        const result = await mediaService.uploadImage(buffer, {
          filename: data.filename,
          mimeType: data.mimetype,
          restaurantId: user.restaurantId,
        });

        return reply.status(201).send({
          success: true,
          data: result,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/media/:id
   * Retrieve an image by ID
   * - Public endpoint (no authentication required)
   * - Returns image with appropriate Content-Type
   * - Caches for 1 year
   */
  fastify.get('/media/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Validate ID format (UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return reply.status(400).send({
          error: 'Invalid image ID format',
        });
      }

      // Check if image exists
      const exists = await mediaService.imageExists(id);
      if (!exists) {
        return reply.status(404).send({
          error: 'Image not found',
        });
      }

      // Get image
      const image = await mediaService.getImage(id);

      // Set cache headers (1 year)
      reply
        .header('Content-Type', image.mimeType)
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .send(image.buffer);
    } catch (error) {
      return handleError(error, reply);
    }
  });

  /**
   * DELETE /api/media/:id
   * Delete an image by ID
   * - Requires authentication (OWNER or MANAGER)
   * - Verifies restaurant ownership
   * - Deletes image from storage
   */
  fastify.delete(
    '/media/:id',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { id } = request.params as { id: string };

        // Validate ID format (UUID)
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          return reply.status(400).send({
            error: 'Invalid image ID format',
          });
        }

        // Check if image exists
        const exists = await mediaService.imageExists(id);
        if (!exists) {
          return reply.status(404).send({
            error: 'Image not found',
          });
        }

        // Verify restaurant ownership
        const metadata = await mediaService.getImageMetadata(id);
        if (metadata.restaurantId && metadata.restaurantId !== user.restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this image',
          });
        }

        // Delete image
        await mediaService.deleteImage(id);

        return reply.status(204).send();
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
};
