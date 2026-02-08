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
  createMenuCategorySchema,
  updateMenuCategorySchema,
  reorderCategoriesSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  toggleAvailabilitySchema,
  createModifierGroupSchema,
  updateModifierGroupSchema,
  createModifierSchema,
  updateModifierSchema,
} from '@openorder/shared-types';
import { MenuService } from './menu.service.js';
import { verifyAuth, requireRole } from '../auth/auth.middleware.js';
import { handleError } from '../../utils/errors.js';
import { prisma } from '../../config/database.js';
import type { JwtPayload } from '../../plugins/jwt.js';

const menuService = new MenuService(prisma);

export const menuRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================================
  // MENU CATEGORY ROUTES
  // ============================================================

  /**
   * POST /api/restaurants/:restaurantId/menu/categories
   * Create a new menu category
   * - Requires authentication (OWNER or MANAGER)
   * - Validates request body with Zod
   */
  fastify.post(
    '/restaurants/:restaurantId/menu/categories',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId } = request.params as { restaurantId: string };

        // Verify user has access to this restaurant
        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        // Validate request body
        const parseResult = createMenuCategorySchema.safeParse(request.body);
        if (!parseResult.success) {
          // Throw the Zod error directly - handleError will format it
          throw parseResult.error;
        }

        // Create category
        const category = await menuService.createCategory(
          restaurantId,
          parseResult.data
        );

        return reply.status(201).send({
          success: true,
          data: category,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/restaurants/:restaurantId/menu/categories
   * List all categories for a restaurant
   * - Requires authentication
   */
  fastify.get(
    '/restaurants/:restaurantId/menu/categories',
    {
      preHandler: [verifyAuth],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId } = request.params as { restaurantId: string };

        // Verify user has access to this restaurant
        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        // Get categories
        const categories = await menuService.listCategories(restaurantId);

        return reply.send({
          success: true,
          data: categories,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/restaurants/:restaurantId/menu/categories/:categoryId
   * Get a single category by ID
   * - Requires authentication
   * - Includes items
   */
  fastify.get(
    '/restaurants/:restaurantId/menu/categories/:categoryId',
    {
      preHandler: [verifyAuth],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, categoryId } = request.params as {
          restaurantId: string;
          categoryId: string;
        };

        // Verify user has access to this restaurant
        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        // Get category
        const category = await menuService.getCategory(categoryId, restaurantId);

        return reply.send({
          success: true,
          data: category,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * PUT /api/restaurants/:restaurantId/menu/categories/:categoryId
   * Update a menu category
   * - Requires authentication (OWNER or MANAGER)
   * - Validates request body with Zod
   */
  fastify.put(
    '/restaurants/:restaurantId/menu/categories/:categoryId',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, categoryId } = request.params as {
          restaurantId: string;
          categoryId: string;
        };

        // Verify user has access to this restaurant
        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        // Validate request body
        const parseResult = updateMenuCategorySchema.safeParse(request.body);
        if (!parseResult.success) {
          // Throw the Zod error directly - handleError will format it
          throw parseResult.error;
        }

        // Update category
        const category = await menuService.updateCategory(
          categoryId,
          restaurantId,
          parseResult.data
        );

        return reply.send({
          success: true,
          data: category,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * DELETE /api/restaurants/:restaurantId/menu/categories/:categoryId
   * Delete a menu category
   * - Requires authentication (OWNER or MANAGER)
   * - Cascade deletes items
   */
  fastify.delete(
    '/restaurants/:restaurantId/menu/categories/:categoryId',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, categoryId } = request.params as {
          restaurantId: string;
          categoryId: string;
        };

        // Verify user has access to this restaurant
        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        // Delete category
        await menuService.deleteCategory(categoryId, restaurantId);

        return reply.status(204).send();
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * POST /api/restaurants/:restaurantId/menu/categories/reorder
   * Reorder categories
   * - Requires authentication (OWNER or MANAGER)
   * - Updates sortOrder for all categories
   */
  fastify.post(
    '/restaurants/:restaurantId/menu/categories/reorder',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId } = request.params as { restaurantId: string };

        // Verify user has access to this restaurant
        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        // Validate request body
        const parseResult = reorderCategoriesSchema.safeParse(request.body);
        if (!parseResult.success) {
          // Throw the Zod error directly - handleError will format it
          throw parseResult.error;
        }

        // Reorder categories
        const categories = await menuService.reorderCategories(
          restaurantId,
          parseResult.data
        );

        return reply.send({
          success: true,
          data: categories,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  // ============================================================
  // MENU ITEM ROUTES
  // ============================================================

  /**
   * POST /api/restaurants/:restaurantId/menu/items
   * Create a new menu item
   * - Requires authentication (OWNER or MANAGER)
   */
  fastify.post(
    '/restaurants/:restaurantId/menu/items',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId } = request.params as { restaurantId: string };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const parseResult = createMenuItemSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const item = await menuService.createItem(restaurantId, parseResult.data);

        return reply.status(201).send({
          success: true,
          data: item,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/restaurants/:restaurantId/menu/items
   * List all menu items for a restaurant
   * - Optional filter by categoryId query parameter
   * - Requires authentication
   */
  fastify.get(
    '/restaurants/:restaurantId/menu/items',
    {
      preHandler: [verifyAuth],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId } = request.params as { restaurantId: string };
        const { categoryId } = request.query as { categoryId?: string };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const items = await menuService.listItems(restaurantId, {
          categoryId,
        });

        return reply.send({
          success: true,
          data: items,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/restaurants/:restaurantId/menu/items/:itemId
   * Get a single menu item by ID
   * - Includes modifier groups and modifiers
   * - Requires authentication
   */
  fastify.get(
    '/restaurants/:restaurantId/menu/items/:itemId',
    {
      preHandler: [verifyAuth],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, itemId } = request.params as {
          restaurantId: string;
          itemId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const item = await menuService.getItem(itemId, restaurantId);

        return reply.send({
          success: true,
          data: item,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * PUT /api/restaurants/:restaurantId/menu/items/:itemId
   * Update a menu item
   * - Requires authentication (OWNER or MANAGER)
   */
  fastify.put(
    '/restaurants/:restaurantId/menu/items/:itemId',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, itemId } = request.params as {
          restaurantId: string;
          itemId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const parseResult = updateMenuItemSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const item = await menuService.updateItem(
          itemId,
          restaurantId,
          parseResult.data
        );

        return reply.send({
          success: true,
          data: item,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * DELETE /api/restaurants/:restaurantId/menu/items/:itemId
   * Delete a menu item (soft delete - sets isActive = false)
   * - Requires authentication (OWNER or MANAGER)
   */
  fastify.delete(
    '/restaurants/:restaurantId/menu/items/:itemId',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, itemId } = request.params as {
          restaurantId: string;
          itemId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        await menuService.deleteItem(itemId, restaurantId);

        return reply.status(204).send();
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * PATCH /api/restaurants/:restaurantId/menu/items/:itemId/availability
   * Toggle item availability (86/un-86 action)
   * - Requires authentication (OWNER, MANAGER, or STAFF)
   */
  fastify.patch(
    '/restaurants/:restaurantId/menu/items/:itemId/availability',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER', 'STAFF')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, itemId } = request.params as {
          restaurantId: string;
          itemId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const parseResult = toggleAvailabilitySchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const item = await menuService.toggleAvailability(
          itemId,
          restaurantId,
          parseResult.data
        );

        return reply.send({
          success: true,
          data: item,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  // ============================================================
  // MODIFIER GROUP ROUTES
  // ============================================================

  /**
   * POST /api/restaurants/:restaurantId/menu/items/:itemId/modifier-groups
   * Create a new modifier group for a menu item
   * - Requires authentication (OWNER or MANAGER)
   */
  fastify.post(
    '/restaurants/:restaurantId/menu/items/:itemId/modifier-groups',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, itemId } = request.params as {
          restaurantId: string;
          itemId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const parseResult = createModifierGroupSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const group = await menuService.createModifierGroup(
          itemId,
          restaurantId,
          parseResult.data
        );

        return reply.status(201).send({
          success: true,
          data: group,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/restaurants/:restaurantId/menu/items/:itemId/modifier-groups
   * List all modifier groups for a menu item
   * - Requires authentication
   */
  fastify.get(
    '/restaurants/:restaurantId/menu/items/:itemId/modifier-groups',
    {
      preHandler: [verifyAuth],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, itemId } = request.params as {
          restaurantId: string;
          itemId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const groups = await menuService.listModifierGroups(itemId, restaurantId);

        return reply.send({
          success: true,
          data: groups,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * PUT /api/restaurants/:restaurantId/menu/modifier-groups/:groupId
   * Update a modifier group
   * - Requires authentication (OWNER or MANAGER)
   */
  fastify.put(
    '/restaurants/:restaurantId/menu/modifier-groups/:groupId',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, groupId } = request.params as {
          restaurantId: string;
          groupId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const parseResult = updateModifierGroupSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const group = await menuService.updateModifierGroup(
          groupId,
          restaurantId,
          parseResult.data
        );

        return reply.send({
          success: true,
          data: group,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * DELETE /api/restaurants/:restaurantId/menu/modifier-groups/:groupId
   * Delete a modifier group
   * - Requires authentication (OWNER or MANAGER)
   * - Cascade deletes modifiers
   */
  fastify.delete(
    '/restaurants/:restaurantId/menu/modifier-groups/:groupId',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, groupId } = request.params as {
          restaurantId: string;
          groupId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        await menuService.deleteModifierGroup(groupId, restaurantId);

        return reply.status(204).send();
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  // ============================================================
  // MODIFIER ROUTES
  // ============================================================

  /**
   * POST /api/restaurants/:restaurantId/menu/modifier-groups/:groupId/modifiers
   * Create a new modifier within a modifier group
   * - Requires authentication (OWNER or MANAGER)
   */
  fastify.post(
    '/restaurants/:restaurantId/menu/modifier-groups/:groupId/modifiers',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, groupId } = request.params as {
          restaurantId: string;
          groupId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const parseResult = createModifierSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const modifier = await menuService.createModifier(
          groupId,
          restaurantId,
          parseResult.data
        );

        return reply.status(201).send({
          success: true,
          data: modifier,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * PUT /api/restaurants/:restaurantId/menu/modifiers/:modifierId
   * Update a modifier
   * - Requires authentication (OWNER or MANAGER)
   */
  fastify.put(
    '/restaurants/:restaurantId/menu/modifiers/:modifierId',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, modifierId } = request.params as {
          restaurantId: string;
          modifierId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        const parseResult = updateModifierSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const modifier = await menuService.updateModifier(
          modifierId,
          restaurantId,
          parseResult.data
        );

        return reply.send({
          success: true,
          data: modifier,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * DELETE /api/restaurants/:restaurantId/menu/modifiers/:modifierId
   * Delete a modifier
   * - Requires authentication (OWNER or MANAGER)
   */
  fastify.delete(
    '/restaurants/:restaurantId/menu/modifiers/:modifierId',
    {
      preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')],
    },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, modifierId } = request.params as {
          restaurantId: string;
          modifierId: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({
            error: 'You do not have access to this restaurant',
          });
        }

        await menuService.deleteModifier(modifierId, restaurantId);

        return reply.status(204).send();
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  // ============================================================
  // PUBLIC MENU API
  // ============================================================

  /**
   * GET /api/restaurants/:slug/menu
   * Get public menu for a restaurant (for customer storefront)
   * - PUBLIC - No authentication required
   * - Cached for 1 minute (max-age=60)
   * - Returns only active categories and items
   * - Includes full modifier hierarchy
   * - Optimized for SSR
   */
  fastify.get(
    '/restaurants/:slug/menu',
    async (request, reply) => {
      try {
        const { slug } = request.params as { slug: string };

        // Get public menu (single optimized query)
        const menu = await menuService.getPublicMenu(slug);

        // Set cache headers for CDN/browser caching
        reply.header('Cache-Control', 'public, max-age=60');

        return reply.send({
          success: true,
          data: menu,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
};
