// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Health Check Routes
// Used by Docker health checks and monitoring

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Basic health check
  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Detailed health check with dependencies
  fastify.get('/health/detailed', async (_request, reply) => {
    const health: {
      status: string;
      timestamp: string;
      uptime: number;
      database: string;
      redis: string;
      error?: string;
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'unknown',
      redis: 'unknown',
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'degraded';
    }

    // Check Redis
    try {
      await redis.ping();
      health.redis = 'connected';
    } catch (error) {
      health.redis = 'disconnected';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(health);
  });
};
