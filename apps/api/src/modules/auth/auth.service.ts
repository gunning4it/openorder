// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Authentication Service
// Handles password hashing, JWT generation, and user authentication

import argon2 from 'argon2';
import { prisma } from '../../config/database.js';
import { AuthError } from '../../utils/errors.js';
import type { JwtPayload } from '../../plugins/jwt.js';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  restaurantId: string;
  role?: 'OWNER' | 'MANAGER' | 'STAFF' | 'KITCHEN';
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Hash password using Argon2id
   * Industry-standard, GPU-resistant algorithm
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id, // Argon2id (hybrid mode)
      memoryCost: 65536, // 64 MiB
      timeCost: 3, // 3 iterations
      parallelism: 4, // 4 threads
    });
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }

  /**
   * Register a new staff member
   * First user for a restaurant is always OWNER
   */
  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.staff.findFirst({
      where: {
        restaurantId: input.restaurantId,
        email: input.email
      },
    });

    if (existingUser) {
      throw new AuthError('User with this email already exists');
    }

    // Check if this is the first user for the restaurant
    const staffCount = await prisma.staff.count({
      where: { restaurantId: input.restaurantId },
    });

    const role = staffCount === 0 ? 'OWNER' : (input.role || 'STAFF');

    // Hash password
    const passwordHash = await this.hashPassword(input.password);

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role,
        restaurantId: input.restaurantId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        restaurantId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return staff;
  }

  /**
   * Authenticate user with email and password
   */
  async login(input: LoginInput) {
    // Find user by email
    const staff = await prisma.staff.findFirst({
      where: { email: input.email },
    });

    if (!staff) {
      throw new AuthError('Invalid email or password');
    }

    // Check if user is active
    if (!staff.isActive) {
      throw new AuthError('Account is disabled');
    }

    // Verify password
    const isValid = await this.verifyPassword(staff.passwordHash, input.password);

    if (!isValid) {
      throw new AuthError('Invalid email or password');
    }

    return {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      restaurantId: staff.restaurantId,
    };
  }

  /**
   * Generate JWT payload from staff data
   */
  createJwtPayload(staff: {
    id: string;
    restaurantId: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF' | 'KITCHEN';
  }): JwtPayload {
    return {
      staffId: staff.id,
      restaurantId: staff.restaurantId,
      role: staff.role,
    };
  }

  /**
   * Generate refresh token (longer-lived)
   */
  createRefreshToken(staffId: string): string {
    // In production, store refresh tokens in Redis with expiration
    // For now, we'll use a simple approach
    return `refresh_${staffId}_${Date.now()}`;
  }
}

export const authService = new AuthService();
