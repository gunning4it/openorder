---
name: docker-init
description: Initialize Docker development environment with database migrations. Use for first-time setup or after pulling major changes.
disable-model-invocation: true
allowed-tools: Bash(docker*), Bash(cp*), Read
---

# Docker Development Environment Setup

This skill initializes the Docker development environment with proper setup steps.

## Workflow

1. **Check Environment Configuration**

   ```bash
   # Check if .env exists
   if [ ! -f .env ]; then
     echo "⚠️  .env file not found"
   fi
   ```

   **If .env missing:**
   - Copy template: `cp .env.example .env`
   - Show required variables:
     - `DATABASE_URL` - PostgreSQL connection string
     - `REDIS_URL` - Redis connection string
     - `APP_SECRET` - Used for JWT signing and config encryption
     - `DB_PASSWORD` - Database password for Docker Compose

   **Generate APP_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

   **Example .env:**
   ```env
   DATABASE_URL="postgresql://openorder:your_password@localhost:5432/openorder"
   REDIS_URL="redis://localhost:6379"
   APP_SECRET="<generated-secret-here>"
   DB_PASSWORD="your_password"
   NODE_ENV="development"
   ```

2. **Choose Environment**

   Ask user:
   - **Development:** Full hot-reload, exposed ports, volumes for live code
   - **Production:** Optimized builds, minimal exposed ports

   ```
   Which environment do you want to start?
   1. Development (recommended for local work)
   2. Production (for testing production builds)
   ```

3. **Start Docker Services**

   **Development Mode:**
   ```bash
   docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
   ```

   **Production Mode:**
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

   **Services Started:**
   - `postgres` - PostgreSQL database
   - `redis` - Redis cache/queue backend
   - `api` - Fastify API server
   - `storefront` - Next.js customer ordering app
   - `dashboard` - React SPA for restaurant management
   - `widget` - Embeddable Web Component

4. **Wait for PostgreSQL Readiness**

   ```bash
   echo "Waiting for PostgreSQL to be ready..."
   docker compose exec -T postgres pg_isready -U openorder || sleep 5
   ```

   Retry up to 30 seconds with 5-second intervals.

5. **Run Database Migrations**

   ```bash
   echo "Running database migrations..."
   docker compose exec api npx prisma migrate deploy
   ```

   **What this does:**
   - Applies all pending migrations from `apps/api/prisma/migrations/`
   - Creates tables, indexes, constraints
   - Idempotent - safe to run multiple times

   **If migration fails:**
   - Check DATABASE_URL is correct
   - Verify PostgreSQL is running: `docker compose ps`
   - Check migration files for syntax errors
   - View API logs: `docker compose logs api`

6. **Generate Prisma Client**

   ```bash
   docker compose exec api npx prisma generate
   ```

   Ensures Prisma Client is up-to-date with schema.

7. **Verify Services are Running**

   ```bash
   docker compose ps
   ```

   **Expected output:**
   ```
   NAME                STATUS              PORTS
   openorder-api       Up 30 seconds       0.0.0.0:4000->4000/tcp
   openorder-storefront Up 30 seconds      0.0.0.0:3000->3000/tcp
   openorder-dashboard Up 30 seconds       0.0.0.0:3001->3001/tcp
   openorder-postgres  Up 30 seconds       0.0.0.0:5432->5432/tcp
   openorder-redis     Up 30 seconds       0.0.0.0:6379->6379/tcp
   ```

8. **Show Service Endpoints**

   ```
   ✅ OpenOrder Development Environment Ready!

   Services:
   - API:        http://localhost:4000
   - Storefront: http://localhost:3000
   - Dashboard:  http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis:      localhost:6379

   Useful commands:
   - View logs:      docker compose logs -f
   - Stop services:  docker compose down
   - Restart:        docker compose restart
   - Reset database: docker compose down -v && docker compose up -d

   Next steps:
   1. Visit http://localhost:3001 to access the dashboard
   2. Create a restaurant account
   3. Configure menu and payment settings
   4. Test ordering at http://localhost:3000/{restaurant-slug}
   ```

9. **Health Check**

   ```bash
   # Test API is responding
   curl -f http://localhost:4000/health || echo "⚠️  API not responding yet, give it a few seconds..."
   ```

## Common Issues

### Port Conflicts

**Error: Bind for 0.0.0.0:4000 failed: port is already allocated**

```bash
# Find process using port
lsof -ti:4000

# Kill process or use different port in docker-compose.yml
# Change: "4000:4000" to "4001:4000"
```

### Database Connection Failures

**Error: Can't reach database server**

```bash
# Check PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Verify DATABASE_URL matches docker-compose.yml settings
cat .env | grep DATABASE_URL
```

### Migration Failures

**Error: Migration failed to apply cleanly**

```bash
# View detailed migration logs
docker compose logs api

# Reset database (⚠️  DELETES ALL DATA)
docker compose down -v
docker compose up -d
docker compose exec api npx prisma migrate deploy
```

### Build Failures

**Error: Cannot find module '@openorder/shared-types'**

```bash
# Rebuild shared packages
docker compose exec api npm run build

# Or rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Development Workflow

### Code Changes (Development Mode)

**Frontend (Storefront/Dashboard):**
- Changes to `apps/storefront/` or `apps/dashboard/` are hot-reloaded automatically
- No need to restart containers

**Backend (API):**
- Changes to `apps/api/src/` restart the server automatically via nodemon
- Check logs: `docker compose logs -f api`

**Shared Packages:**
- Changes to `packages/*/src/` require rebuild:
  ```bash
  docker compose exec api npm run build
  ```

### Database Schema Changes

```bash
# 1. Edit apps/api/prisma/schema.prisma
# 2. Create migration
docker compose exec api npx prisma migrate dev --name add_feature

# 3. Restart API to pick up new Prisma Client
docker compose restart api
```

### Stopping Services

**Stop all:**
```bash
docker compose down
```

**Stop and remove volumes (⚠️  deletes database):**
```bash
docker compose down -v
```

**Stop specific service:**
```bash
docker compose stop api
```

### Viewing Logs

**All services:**
```bash
docker compose logs -f
```

**Specific service:**
```bash
docker compose logs -f api
docker compose logs -f postgres
```

**Since timestamp:**
```bash
docker compose logs --since 5m
```

## Production Considerations

When testing production builds:

1. **Build images:**
   ```bash
   docker compose -f docker/docker-compose.yml build
   ```

2. **Start in production mode:**
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

3. **Run migrations:**
   ```bash
   docker compose exec api npx prisma migrate deploy
   ```

4. **Verify environment:**
   ```bash
   docker compose exec api env | grep NODE_ENV
   # Should output: NODE_ENV=production
   ```

## Cleanup

**Remove all containers and volumes:**
```bash
docker compose down -v --remove-orphans
```

**Remove all images:**
```bash
docker compose down --rmi all
```

**Start fresh:**
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Self-Hosting Notes

For production self-hosting:

- Use environment-specific `.env` files (`.env.production`)
- Set strong `APP_SECRET` (min 32 characters)
- Use managed PostgreSQL/Redis for reliability
- Configure backup strategy for database
- Set up monitoring (health checks, logs)
- Use reverse proxy (nginx) for SSL termination
- Configure proper CORS origins

See `docs/deployment.md` for full production setup guide.
