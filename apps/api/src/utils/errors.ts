// SPDX-License-Identifier: AGPL-3.0
// OpenOrder - Error Handling Utilities

import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN_ERROR');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export function handleError(error: unknown, reply: FastifyReply) {
  // App errors (known errors)
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
      code: error.code,
    });
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'ValidationError',
      message: 'Request validation failed',
      issues: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return reply.status(409).send({
        error: 'ConflictError',
        message: 'A record with this value already exists',
        field: error.meta?.target,
      });
    }

    // Record not found
    if (error.code === 'P2025') {
      return reply.status(404).send({
        error: 'NotFoundError',
        message: 'Record not found',
      });
    }
  }

  // Unknown errors
  console.error('Unhandled error:', error);
  return reply.status(500).send({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
  });
}
