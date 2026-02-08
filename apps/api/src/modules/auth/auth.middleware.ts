// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Authentication Middleware
// JWT verification and RBAC enforcement

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthError, ForbiddenError } from '../../utils/errors.js';
import type { JwtPayload } from '../../plugins/jwt.js';

/**
 * Middleware to verify JWT token
 */
export async function verifyAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...allowedRoles: Array<'OWNER' | 'MANAGER' | 'STAFF' | 'KITCHEN'>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.user as JwtPayload;

    if (!user) {
      throw new AuthError('Authentication required');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
    }
  };
}

/**
 * Middleware to check if user belongs to the restaurant
 */
export async function requireRestaurantAccess(
  restaurantId: string,
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  const user = request.user as JwtPayload;

  if (!user) {
    throw new AuthError('Authentication required');
  }

  if (user.restaurantId !== restaurantId) {
    throw new ForbiddenError('You do not have access to this restaurant');
  }
}
