// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Pino Logger Configuration

import pino from 'pino';
import { getEnv } from '../config/env.js';

const env = getEnv();

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  } : undefined,
});
