/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 * AGPL-3.0 License
 */

import { beforeAll, afterAll } from 'vitest';
import { loadEnv } from '../config/env.js';
import { prisma } from '../config/database.js';

// Load environment variables before tests
loadEnv();

// Set test-specific upload path
process.env.UPLOAD_PATH = '/tmp/data/uploads';

beforeAll(async () => {
  // Test database is expected to be running
  // In a real setup, you'd use Testcontainers or a test database
  console.log('🧪 Test setup: Database connected');
});

afterAll(async () => {
  // Clean up database connections
  await prisma.$disconnect();
  console.log('🧪 Test teardown: Database disconnected');
});
