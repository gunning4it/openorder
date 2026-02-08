// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Prisma Client Singleton
// Ensures a single Prisma instance across the application

import { PrismaClient } from '@prisma/client';
import { getEnv } from './env.js';

// Prisma Client singleton pattern
// Prevents multiple instances in development (hot reload)
declare global {
  var __prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient | null = null;
let shutdownHandlersRegistered = false;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const env = getEnv();

    prismaInstance = global.__prisma || new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (env.NODE_ENV !== 'production') {
      global.__prisma = prismaInstance;
    }

    // Register graceful shutdown handlers only once
    if (!shutdownHandlersRegistered) {
      process.on('SIGINT', async () => {
        if (prismaInstance) await prismaInstance.$disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        if (prismaInstance) await prismaInstance.$disconnect();
        process.exit(0);
      });

      shutdownHandlersRegistered = true;
    }
  }

  return prismaInstance;
}

// Export as a getter property for backwards compatibility
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
