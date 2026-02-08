// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Rate Limiting Plugin
// Redis-backed rate limiting to prevent abuse

import { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { redis } from '../config/redis.js';

export const configureRateLimit: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    global: true,
    max: 100, // 100 requests
    timeWindow: '1 minute', // per minute
    redis: redis,
    skipOnError: true, // Don't fail if Redis is down
    keyGenerator: (request) => {
      // Use IP address as key
      return request.ip;
    },
  });
};
