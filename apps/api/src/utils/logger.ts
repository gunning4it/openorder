// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Pino Logger Configuration

import pino from 'pino';
import type { Logger } from 'pino';
import { getEnv } from '../config/env.js';

let loggerInstance: Logger | null = null;

/**
 * Get or create the logger instance (lazy-loaded after env is initialized)
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    const env = getEnv();
    loggerInstance = pino({
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
  }
  return loggerInstance;
}

// For backwards compatibility and convenience
export const logger = {
  get fatal() { return getLogger().fatal.bind(getLogger()); },
  get error() { return getLogger().error.bind(getLogger()); },
  get warn() { return getLogger().warn.bind(getLogger()); },
  get info() { return getLogger().info.bind(getLogger()); },
  get debug() { return getLogger().debug.bind(getLogger()); },
  get trace() { return getLogger().trace.bind(getLogger()); },
  child: (...args: Parameters<Logger['child']>) => getLogger().child(...args),
};
