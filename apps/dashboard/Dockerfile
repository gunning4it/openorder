# SPDX-License-Identifier: AGPL-3.0
# OpenOrder Dashboard - Production Dockerfile
# Vite SPA build served by nginx

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/dashboard/ ./apps/dashboard/
COPY packages/shared-types/ ./packages/shared-types/
COPY packages/ui/ ./packages/ui/
COPY turbo.json ./

# Build
RUN pnpm turbo run build --filter=@openorder/dashboard

# Production stage - nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

# Copy nginx config (will create later)
# COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
