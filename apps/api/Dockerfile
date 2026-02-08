# SPDX-License-Identifier: AGPL-3.0
# OpenOrder API - Production Dockerfile
# Multi-stage build for minimal image size

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/pos-adapters/package.json ./packages/pos-adapters/
COPY packages/payment-adapters/package.json ./packages/payment-adapters/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api/ ./apps/api/
COPY packages/shared-types/ ./packages/shared-types/
COPY packages/pos-adapters/ ./packages/pos-adapters/
COPY packages/payment-adapters/ ./packages/payment-adapters/
COPY turbo.json ./

# Generate Prisma Client
RUN cd apps/api && pnpm prisma generate

# Build
RUN pnpm turbo run build --filter=@openorder/api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm and production dependencies only
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/pos-adapters/package.json ./packages/pos-adapters/
COPY packages/payment-adapters/package.json ./packages/payment-adapters/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema and migrations
COPY apps/api/prisma ./apps/api/prisma/

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/server.js"]
