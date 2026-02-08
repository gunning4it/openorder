// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - CORS Plugin
// Configures Cross-Origin Resource Sharing for storefront and dashboard

import { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';
import { getEnv } from '../config/env.js';

export const configureCors: FastifyPluginAsync = async (fastify) => {
  const env = getEnv();

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests from storefront, dashboard, and widget
      const allowedOrigins = [
        env.PUBLIC_URL,
        `${env.PUBLIC_URL}:3000`, // Storefront dev
        `${env.PUBLIC_URL}:3001`, // Dashboard dev
        'http://localhost:3000',
        'http://localhost:3001',
      ];

      // Allow if no origin (same-origin) or if origin is in whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
};
