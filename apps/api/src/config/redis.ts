// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Redis Client Singleton
// IORedis instance for rate limiting, caching, and BullMQ

import { Redis } from 'ioredis';
import { getEnv } from './env.js';

let redisInstance: Redis | null = null;
let shutdownHandlersRegistered = false;

function getRedisClient(): Redis {
  if (!redisInstance) {
    const env = getEnv();

    redisInstance = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    // Connection error handling
    redisInstance.on('error', (err: Error) => {
      console.error('Redis connection error:', err);
    });

    redisInstance.on('connect', () => {
      console.log('✅ Redis connected');
    });

    // Register graceful shutdown handlers only once
    if (!shutdownHandlersRegistered) {
      process.on('SIGINT', async () => {
        if (redisInstance) await redisInstance.quit();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        if (redisInstance) await redisInstance.quit();
        process.exit(0);
      });

      shutdownHandlersRegistered = true;
    }
  }

  return redisInstance;
}

// Export as a getter property for backwards compatibility
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedisClient();
    const value = client[prop as keyof Redis];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
