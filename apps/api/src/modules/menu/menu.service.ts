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

import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type {
  CreateMenuCategoryInput,
  UpdateMenuCategoryInput,
  ReorderCategoriesInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  ToggleAvailabilityInput,
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
  CreateModifierInput,
  UpdateModifierInput,
  PublicMenuResponse,
} from '@openorder/shared-types';

export class MenuService {
  constructor(private prisma: PrismaClient) {}

  // ============================================================
  // MENU CATEGORY CRUD
  // ============================================================

  /**
   * Create a new menu category
   * - Auto-assigns sortOrder (max + 1)
   * - Validates restaurant exists
   */
  async createCategory(restaurantId: string, data: CreateMenuCategoryInput) {
    // Verify restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    // Get max sortOrder for this restaurant
    const maxSortOrder = await this.prisma.menuCategory.aggregate({
      where: { restaurantId },
      _max: { sortOrder: true },
    });

    const sortOrder = data.sortOrder ?? (maxSortOrder._max.sortOrder ?? -1) + 1;

    // Create category
    const category = await this.prisma.menuCategory.create({
      data: {
        ...data,
        restaurantId,
        sortOrder,
      },
    });

    return category;
  }

  /**
   * Update a menu category
   * - Verifies category belongs to restaurant
   * - Allows partial updates
   */
  async updateCategory(
    categoryId: string,
    restaurantId: string,
    data: UpdateMenuCategoryInput
  ) {
    // Verify category exists and belongs to restaurant
    const category = await this.prisma.menuCategory.findFirst({
      where: {
        id: categoryId,
        restaurantId,
      },
    });

    if (!category) {
      throw new NotFoundError(
        'Category not found or does not belong to this restaurant'
      );
    }

    // Update category
    const updatedCategory = await this.prisma.menuCategory.update({
      where: { id: categoryId },
      data,
    });

    return updatedCategory;
  }

  /**
   * Delete a menu category
   * - Cascade deletes handled by Prisma schema (items, modifiers)
   * - Verifies category belongs to restaurant
   */
  async deleteCategory(categoryId: string, restaurantId: string) {
    // Verify category exists and belongs to restaurant
    const category = await this.prisma.menuCategory.findFirst({
      where: {
        id: categoryId,
        restaurantId,
      },
    });

    if (!category) {
      throw new NotFoundError(
        'Category not found or does not belong to this restaurant'
      );
    }

    // Delete category (cascade deletes items)
    await this.prisma.menuCategory.delete({
      where: { id: categoryId },
    });
  }

  /**
   * List all categories for a restaurant
   * - Orders by sortOrder ASC
   * - Includes item count
   */
  async listCategories(restaurantId: string) {
    const categories = await this.prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    // Transform to include itemCount
    return categories.map((category) => ({
      ...category,
      itemCount: category._count.items,
      _count: undefined, // Remove _count from response
    }));
  }

  /**
   * Reorder categories
   * - Updates sortOrder for all provided categories
   * - Uses transaction for atomicity
   */
  async reorderCategories(
    restaurantId: string,
    data: ReorderCategoriesInput
  ) {
    // Verify all categories belong to restaurant
    const categories = await this.prisma.menuCategory.findMany({
      where: {
        id: { in: data.categoryIds },
        restaurantId,
      },
    });

    if (categories.length !== data.categoryIds.length) {
      throw new ValidationError(
        'One or more categories not found or do not belong to this restaurant'
      );
    }

    // Update sortOrder in transaction
    await this.prisma.$transaction(
      data.categoryIds.map((categoryId: string, index: number) =>
        this.prisma.menuCategory.update({
          where: { id: categoryId },
          data: { sortOrder: index },
        })
      )
    );

    // Return updated categories
    return this.listCategories(restaurantId);
  }

  /**
   * Get a single category by ID
   * - Verifies category belongs to restaurant
   * - Includes items
   */
  async getCategory(categoryId: string, restaurantId: string) {
    const category = await this.prisma.menuCategory.findFirst({
      where: {
        id: categoryId,
        restaurantId,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            isActive: true,
            isAvailable: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError(
        'Category not found or does not belong to this restaurant'
      );
    }

    return category;
  }

  // ============================================================
  // MENU ITEM CRUD
  // ============================================================

  /**
   * Create a new menu item
   * - Auto-assigns sortOrder within category
   * - Validates category exists and belongs to restaurant
   */
  async createItem(restaurantId: string, data: CreateMenuItemInput) {
    // Verify category exists and belongs to restaurant
    const category = await this.prisma.menuCategory.findFirst({
      where: {
        id: data.categoryId,
        restaurantId,
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found or does not belong to this restaurant');
    }

    // Get max sortOrder within this category
    const maxSortOrder = await this.prisma.menuItem.aggregate({
      where: { categoryId: data.categoryId, restaurantId },
      _max: { sortOrder: true },
    });

    const sortOrder = data.sortOrder ?? (maxSortOrder._max.sortOrder ?? -1) + 1;

    // Create menu item
    const item = await this.prisma.menuItem.create({
      data: {
        ...data,
        restaurantId,
        sortOrder,
      },
    });

    return item;
  }

  /**
   * Get a single menu item by ID
   * - Verifies item belongs to restaurant
   * - Includes modifier groups and modifiers
   */
  async getItem(itemId: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId,
      },
      include: {
        modifierGroups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            modifiers: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Item not found or does not belong to this restaurant');
    }

    return item;
  }

  /**
   * List menu items for a restaurant
   * - Optional filter by categoryId
   * - Orders by category, then sortOrder
   * - Includes modifier groups
   */
  async listItems(restaurantId: string, filters?: { categoryId?: string }) {
    const items = await this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
      },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
      include: {
        modifierGroups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            modifiers: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    return items;
  }

  /**
   * Update a menu item
   * - Verifies item belongs to restaurant
   * - Allows moving to different category (if new category belongs to restaurant)
   * - Allows partial updates
   */
  async updateItem(
    itemId: string,
    restaurantId: string,
    data: UpdateMenuItemInput
  ) {
    // Verify item exists and belongs to restaurant
    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId,
      },
    });

    if (!item) {
      throw new NotFoundError('Item not found or does not belong to this restaurant');
    }

    // If changing category, verify new category belongs to restaurant
    if (data.categoryId && data.categoryId !== item.categoryId) {
      const newCategory = await this.prisma.menuCategory.findFirst({
        where: {
          id: data.categoryId,
          restaurantId,
        },
      });

      if (!newCategory) {
        throw new NotFoundError('New category not found or does not belong to this restaurant');
      }
    }

    // Update item
    const updatedItem = await this.prisma.menuItem.update({
      where: { id: itemId },
      data,
    });

    return updatedItem;
  }

  /**
   * Delete a menu item (soft delete)
   * - Sets isActive = false to preserve order history
   * - Verifies item belongs to restaurant
   */
  async deleteItem(itemId: string, restaurantId: string) {
    // Verify item exists and belongs to restaurant
    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId,
      },
    });

    if (!item) {
      throw new NotFoundError('Item not found or does not belong to this restaurant');
    }

    // Soft delete: set isActive = false
    await this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isActive: false },
    });
  }

  /**
   * Toggle item availability (86/un-86)
   * - Quick action for STAFF to mark items unavailable
   * - Verifies item belongs to restaurant
   */
  async toggleAvailability(
    itemId: string,
    restaurantId: string,
    data: ToggleAvailabilityInput
  ) {
    // Verify item exists and belongs to restaurant
    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId,
      },
    });

    if (!item) {
      throw new NotFoundError('Item not found or does not belong to this restaurant');
    }

    // Update availability
    const updatedItem = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: data.isAvailable },
    });

    return updatedItem;
  }

  // ============================================================
  // MODIFIER GROUP CRUD
  // ============================================================

  /**
   * Create a new modifier group for a menu item
   * - Auto-assigns sortOrder (max + 1)
   * - Verifies menu item exists and belongs to restaurant
   */
  async createModifierGroup(
    menuItemId: string,
    restaurantId: string,
    data: CreateModifierGroupInput
  ) {
    // Verify menu item exists and belongs to restaurant
    const menuItem = await this.prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurantId,
      },
    });

    if (!menuItem) {
      throw new NotFoundError('Menu item not found or does not belong to this restaurant');
    }

    // Get max sortOrder for this menu item
    const maxSortOrder = await this.prisma.menuModifierGroup.aggregate({
      where: { menuItemId },
      _max: { sortOrder: true },
    });

    const sortOrder = data.sortOrder ?? (maxSortOrder._max.sortOrder ?? -1) + 1;

    // Create modifier group
    const group = await this.prisma.menuModifierGroup.create({
      data: {
        ...data,
        menuItemId,
        sortOrder,
      },
    });

    return group;
  }

  /**
   * Update a modifier group
   * - Verifies group belongs to restaurant through menu item
   */
  async updateModifierGroup(
    groupId: string,
    restaurantId: string,
    data: UpdateModifierGroupInput
  ) {
    // Verify group exists and belongs to restaurant
    const group = await this.prisma.menuModifierGroup.findFirst({
      where: {
        id: groupId,
        menuItem: {
          restaurantId,
        },
      },
    });

    if (!group) {
      throw new NotFoundError('Modifier group not found or does not belong to this restaurant');
    }

    // Update group
    const updatedGroup = await this.prisma.menuModifierGroup.update({
      where: { id: groupId },
      data,
    });

    return updatedGroup;
  }

  /**
   * Delete a modifier group
   * - Cascade deletes modifiers (handled by Prisma schema)
   * - Verifies group belongs to restaurant through menu item
   */
  async deleteModifierGroup(groupId: string, restaurantId: string) {
    // Verify group exists and belongs to restaurant
    const group = await this.prisma.menuModifierGroup.findFirst({
      where: {
        id: groupId,
        menuItem: {
          restaurantId,
        },
      },
    });

    if (!group) {
      throw new NotFoundError('Modifier group not found or does not belong to this restaurant');
    }

    // Delete group (cascade deletes modifiers)
    await this.prisma.menuModifierGroup.delete({
      where: { id: groupId },
    });
  }

  /**
   * List modifier groups for a menu item
   * - Orders by sortOrder ASC
   * - Includes modifiers
   */
  async listModifierGroups(menuItemId: string, restaurantId: string) {
    // Verify menu item exists and belongs to restaurant
    const menuItem = await this.prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurantId,
      },
    });

    if (!menuItem) {
      throw new NotFoundError('Menu item not found or does not belong to this restaurant');
    }

    const groups = await this.prisma.menuModifierGroup.findMany({
      where: { menuItemId },
      orderBy: { sortOrder: 'asc' },
      include: {
        modifiers: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return groups;
  }

  // ============================================================
  // MODIFIER CRUD
  // ============================================================

  /**
   * Create a new modifier within a modifier group
   * - Auto-assigns sortOrder (max + 1)
   * - Verifies modifier group exists and belongs to restaurant
   */
  async createModifier(
    modifierGroupId: string,
    restaurantId: string,
    data: CreateModifierInput
  ) {
    // Verify modifier group exists and belongs to restaurant
    const group = await this.prisma.menuModifierGroup.findFirst({
      where: {
        id: modifierGroupId,
        menuItem: {
          restaurantId,
        },
      },
    });

    if (!group) {
      throw new NotFoundError('Modifier group not found or does not belong to this restaurant');
    }

    // Get max sortOrder for this modifier group
    const maxSortOrder = await this.prisma.menuModifier.aggregate({
      where: { modifierGroupId },
      _max: { sortOrder: true },
    });

    const sortOrder = data.sortOrder ?? (maxSortOrder._max.sortOrder ?? -1) + 1;

    // Create modifier
    const modifier = await this.prisma.menuModifier.create({
      data: {
        ...data,
        modifierGroupId,
        sortOrder,
      },
    });

    return modifier;
  }

  /**
   * Update a modifier
   * - Verifies modifier belongs to restaurant through modifier group → menu item
   */
  async updateModifier(
    modifierId: string,
    restaurantId: string,
    data: UpdateModifierInput
  ) {
    // Verify modifier exists and belongs to restaurant
    const modifier = await this.prisma.menuModifier.findFirst({
      where: {
        id: modifierId,
        modifierGroup: {
          menuItem: {
            restaurantId,
          },
        },
      },
    });

    if (!modifier) {
      throw new NotFoundError('Modifier not found or does not belong to this restaurant');
    }

    // Update modifier
    const updatedModifier = await this.prisma.menuModifier.update({
      where: { id: modifierId },
      data,
    });

    return updatedModifier;
  }

  /**
   * Delete a modifier
   * - Verifies modifier belongs to restaurant through modifier group → menu item
   */
  async deleteModifier(modifierId: string, restaurantId: string) {
    // Verify modifier exists and belongs to restaurant
    const modifier = await this.prisma.menuModifier.findFirst({
      where: {
        id: modifierId,
        modifierGroup: {
          menuItem: {
            restaurantId,
          },
        },
      },
    });

    if (!modifier) {
      throw new NotFoundError('Modifier not found or does not belong to this restaurant');
    }

    // Delete modifier
    await this.prisma.menuModifier.delete({
      where: { id: modifierId },
    });
  }

  // ============================================================
  // PUBLIC MENU API
  // ============================================================

  /**
   * Get public menu for a restaurant by slug
   * - No authentication required
   * - Returns only active categories and items
   * - Includes full modifier hierarchy
   * - Optimized with two queries (restaurant + categories)
   * - Sorted by sortOrder
   */
  async getPublicMenu(slug: string): Promise<PublicMenuResponse> {
    // Fetch restaurant info
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    // Fetch categories with full menu hierarchy
    const categories = await this.prisma.menuCategory.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            modifierGroups: {
              orderBy: { sortOrder: 'asc' },
              include: {
                modifiers: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    // Convert taxRate from Decimal to number
    const taxRate = restaurant.taxRate.toNumber();

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        logoUrl: restaurant.logoUrl,
        coverImageUrl: restaurant.coverImageUrl,
        phone: restaurant.phone,
        email: restaurant.email,
        brandColor: restaurant.brandColor,
        acceptingOrders: restaurant.acceptingOrders,
        addressLine1: restaurant.addressLine1,
        addressLine2: restaurant.addressLine2,
        city: restaurant.city,
        state: restaurant.state,
        postalCode: restaurant.postalCode,
        country: restaurant.country,
        timezone: restaurant.timezone,
        currency: restaurant.currency,
        locale: restaurant.locale,
        pickupEnabled: restaurant.pickupEnabled,
        deliveryEnabled: restaurant.deliveryEnabled,
        dineInEnabled: restaurant.dineInEnabled,
        prepTimeMinutes: restaurant.prepTimeMinutes,
        taxRate,
        taxInclusive: restaurant.taxInclusive,
        tipsEnabled: restaurant.tipsEnabled,
        tipPresets: restaurant.tipPresets as number[],
      },
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        items: category.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          compareAtPrice: item.compareAtPrice,
          imageUrl: item.imageUrl,
          ingredients: item.ingredients as string[],
          allergens: item.allergens as string[],
          tags: item.tags as string[],
          calories: item.calories,
          isAvailable: item.isAvailable,
          modifierGroups: item.modifierGroups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            required: group.required,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
            modifiers: group.modifiers.map((modifier) => ({
              id: modifier.id,
              name: modifier.name,
              price: modifier.price,
              isAvailable: modifier.isAvailable,
              calories: modifier.calories,
            })),
          })),
        })),
      })),
    };
  }
}
