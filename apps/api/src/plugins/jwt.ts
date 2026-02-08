// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - JWT Plugin
// Handles JSON Web Token authentication

import { FastifyPluginAsync } from 'fastify';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { getEnv } from '../config/env.js';

const env = getEnv();

export const configureJwt: FastifyPluginAsync = async (fastify) => {
  // Register cookie plugin first (JWT depends on it)
  await fastify.register(cookie);

  // Register JWT
  await fastify.register(jwt, {
    secret: env.APP_SECRET,
    sign: {
      expiresIn: '15m', // Access tokens expire in 15 minutes
    },
    cookie: {
      cookieName: 'refreshToken',
      signed: false, // We'll use JWT signature instead
    },
  });
};

// JWT payload interface
export interface JwtPayload {
  staffId: string;
  restaurantId: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'KITCHEN';
}

// Augment @fastify/jwt types to use our JWT payload
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JwtPayload;
  }
}
