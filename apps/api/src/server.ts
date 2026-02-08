// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - API Server Entry Point
// Fastify server with all plugins and routes

import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import { loadEnv, getEnv } from './config/env.js';
import { getLogger } from './utils/logger.js';
import { handleError } from './utils/errors.js';
import { configureCors } from './plugins/cors.js';
import { configureRateLimit } from './plugins/rate-limit.js';
import { configureJwt } from './plugins/jwt.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { restaurantRoutes } from './modules/restaurant/restaurant.routes.js';
import { redis } from './config/redis.js';
import { prisma } from './config/database.js';

// Load environment variables
loadEnv();
const env = getEnv();

// Create Fastify instance
const fastify = Fastify({
  logger: getLogger(),
  trustProxy: true, // Trust X-Forwarded-* headers (for nginx)
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
});

// Global error handler
fastify.setErrorHandler((error, _request, reply) => {
  handleError(error, reply);
});

async function start() {
  try {
    // Connect to Redis
    await redis.connect();

    // Register security plugins
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    });

    // Register CORS
    await fastify.register(configureCors);

    // Register rate limiting
    await fastify.register(configureRateLimit);

    // Register JWT
    await fastify.register(configureJwt);

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(authRoutes);
    await fastify.register(restaurantRoutes);

    // Start server
    await fastify.listen({
      port: env.API_PORT,
      host: '0.0.0.0',
    });

    console.log(`✅ OpenOrder API server running on port ${env.API_PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Public URL: ${env.PUBLIC_URL}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    await redis.quit();
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');
  await fastify.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
start();
