// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Environment Configuration Validation
// Uses Zod for runtime environment variable validation

import { z } from 'zod';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  API_PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).default('4000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Security
  APP_SECRET: z.string().min(32, 'APP_SECRET must be at least 32 characters for security'),

  // Public URL
  PUBLIC_URL: z.string().url().default('http://localhost'),

  // Optional Stripe keys (can be configured per-restaurant in dashboard)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

export function loadEnv(): Env {
  if (env) {
    return env;
  }

  // Load .env file from project root (../../.env from this file)
  const envPath = resolve(__dirname, '../../../../.env');
  config({ path: envPath });

  try {
    env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export function getEnv(): Env {
  if (!env) {
    throw new Error('Environment not loaded. Call loadEnv() first.');
  }
  return env;
}
