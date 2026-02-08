// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Authentication Routes
// Login, register, refresh token endpoints

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { handleError } from '../../utils/errors.js';
import { prisma } from '../../config/database.js';
import type { JwtPayload } from '../../plugins/jwt.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
  restaurantId: z.string().cuid(),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF', 'KITCHEN']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register new user
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const data = registerSchema.parse(request.body);

      const staff = await authService.register(data);

      // Generate access token
      const payload = authService.createJwtPayload(staff);
      const accessToken = fastify.jwt.sign(payload);

      // Generate refresh token
      const refreshToken = authService.createRefreshToken(staff.id);

      // Set refresh token as httpOnly cookie (7 days)
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return reply.status(201).send({
        accessToken,
        user: staff,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Login
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const data = loginSchema.parse(request.body);

      const staff = await authService.login(data);

      // Generate access token
      const payload = authService.createJwtPayload(staff);
      const accessToken = fastify.jwt.sign(payload);

      // Generate refresh token
      const refreshToken = authService.createRefreshToken(staff.id);

      // Set refresh token as httpOnly cookie (7 days)
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return reply.send({
        accessToken,
        user: staff,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Logout
  fastify.post('/auth/logout', async (_request, reply) => {
    // Clear refresh token cookie
    reply.clearCookie('refreshToken', {
      path: '/',
    });

    return reply.send({ message: 'Logged out successfully' });
  });

  // Refresh access token
  fastify.post('/auth/refresh', async (_request, reply) => {
    try {
      const refreshToken = _request.cookies.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({
          error: 'AuthError',
          message: 'Refresh token not found',
        });
      }

      // In production, validate refresh token against Redis
      // For now, we'll just extract the staff ID
      const [, staffId] = refreshToken.split('_');

      if (!staffId) {
        return reply.status(401).send({
          error: 'AuthError',
          message: 'Invalid refresh token',
        });
      }

      // Get staff from database
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });

      if (!staff || !staff.isActive) {
        return reply.status(401).send({
          error: 'AuthError',
          message: 'Invalid refresh token',
        });
      }

      // Generate new access token
      const payload = authService.createJwtPayload(staff);
      const accessToken = fastify.jwt.sign(payload);

      return reply.send({
        accessToken,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get current user
  fastify.get('/auth/me', {
    onRequest: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          error: 'AuthError',
          message: 'Invalid or expired token',
        });
      }
    },
  }, async (request, reply) => {
    const user = request.user as JwtPayload;

    if (!user) {
      return reply.status(401).send({
        error: 'AuthError',
        message: 'Not authenticated',
      });
    }

    // Get full staff details
    const staff = await prisma.staff.findUnique({
      where: { id: user.staffId },
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

    if (!staff) {
      return reply.status(404).send({
        error: 'NotFoundError',
        message: 'User not found',
      });
    }

    return reply.send({ user: staff });
  });
};
