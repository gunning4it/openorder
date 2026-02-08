// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Prisma Client Singleton
// Ensures a single Prisma instance across the application

import { PrismaClient } from '@prisma/client';
import { getEnv } from './env.js';

const env = getEnv();

// Prisma Client singleton pattern
// Prevents multiple instances in development (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
