---
name: api-crud
description: Generate CRUD API endpoints following OpenOrder patterns (Fastify, Prisma, Zod, RBAC)
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# API CRUD Generator

Generate production-ready CRUD API endpoints for OpenOrder following established patterns with Fastify, Prisma ORM, Zod validation, and JWT authentication.

## OpenOrder API Stack

- **Framework:** Fastify with plugin-based modular routes
- **Database:** Prisma ORM + PostgreSQL
- **Validation:** Zod schemas from `@openorder/shared-types`
- **Auth:** JWT with role-based access control (OWNER > MANAGER > STAFF > KITCHEN)
- **Errors:** Custom error classes with `handleError` utility
- **Module System:** ESM with `.js` extensions required

## Project Structure

```
apps/api/src/
├── modules/
│   └── {module}/
│       ├── {module}.service.ts  # Business logic + Prisma
│       └── {module}.routes.ts   # HTTP layer + auth
├── utils/errors.ts               # NotFoundError, ValidationError, etc.
├── config/database.ts            # Prisma client singleton
└── server.ts                     # Route registration
```

## Workflow

### 1. Understand the Resource

Ask yourself:
- What is the resource name? (e.g., MenuItem, ModifierGroup)
- What relationships does it have? (belongs to restaurant, has many X)
- Does it need `sortOrder` auto-management?
- What fields from Prisma schema are relevant?

### 2. Verify Schemas Exist

**Check shared-types:**
```bash
# Read the relevant schema file
Read: /packages/shared-types/src/menu.ts
```

Look for:
- `createXSchema` - Zod schema for POST requests
- `updateXSchema` - Zod schema for PUT requests
- `CreateXInput` - TypeScript type
- `UpdateXInput` - TypeScript type

If schemas don't exist, stop and tell the user to add them first.

### 3. Verify Prisma Model

**Check database schema:**
```bash
Read: /apps/api/prisma/schema.prisma
```

Find the model and check:
- Field names and types
- Relationships (`@relation`)
- Cascade delete rules (`onDelete: Cascade`)
- Unique constraints
- Indexes

### 4. Generate Service Layer

**File:** `/apps/api/src/modules/{module}/{module}.service.ts`

**Pattern:**
```typescript
/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 * AGPL-3.0 License
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type { CreateXInput, UpdateXInput } from '@openorder/shared-types';

export class XService {
  constructor(private prisma: PrismaClient) {}

  async create(restaurantId: string, data: CreateXInput) {
    // 1. Verify parent exists (if nested resource)
    // 2. Handle sortOrder auto-generation if needed
    // 3. Create with Prisma
    return await this.prisma.x.create({ data: { ...data, restaurantId } });
  }

  async getById(id: string, restaurantId: string) {
    const resource = await this.prisma.x.findFirst({
      where: { id, restaurantId },
      include: { /* related data */ },
    });

    if (!resource) {
      throw new NotFoundError('X not found');
    }

    return resource;
  }

  async list(restaurantId: string) {
    return await this.prisma.x.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' }, // or createdAt
    });
  }

  async update(id: string, restaurantId: string, data: UpdateXInput) {
    // Verify ownership
    await this.getById(id, restaurantId);

    return await this.prisma.x.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, restaurantId: string) {
    // Verify ownership
    await this.getById(id, restaurantId);

    await this.prisma.x.delete({ where: { id } });
  }
}
```

**Key Rules:**
- ✅ AGPL license header
- ✅ Always verify `restaurantId` ownership
- ✅ Use `NotFoundError` for missing resources
- ✅ Use `ValidationError` for business rule violations
- ✅ No `any` types
- ✅ Import with `.js` extensions

### 5. Generate Routes Layer

**File:** `/apps/api/src/modules/{module}/{module}.routes.ts`

**Pattern:**
```typescript
/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 * AGPL-3.0 License
 */

import { FastifyPluginAsync } from 'fastify';
import { createXSchema, updateXSchema } from '@openorder/shared-types';
import { XService } from './x.service.js';
import { verifyAuth, requireRole } from '../auth/auth.middleware.js';
import { handleError } from '../../utils/errors.js';
import { prisma } from '../../config/database.js';
import type { JwtPayload } from '../../plugins/jwt.js';

const xService = new XService(prisma);

export const xRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/restaurants/:restaurantId/x
   * Auth: OWNER, MANAGER
   */
  fastify.post(
    '/restaurants/:restaurantId/x',
    { preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')] },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId } = request.params as { restaurantId: string };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        const parseResult = createXSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const resource = await xService.create(restaurantId, parseResult.data);

        return reply.status(201).send({ success: true, data: resource });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * GET /api/restaurants/:restaurantId/x
   * Auth: All authenticated
   */
  fastify.get(
    '/restaurants/:restaurantId/x',
    { preHandler: [verifyAuth] },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId } = request.params as { restaurantId: string };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        const resources = await xService.list(restaurantId);

        return reply.send({ success: true, data: resources });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * PUT /api/restaurants/:restaurantId/x/:id
   * Auth: OWNER, MANAGER
   */
  fastify.put(
    '/restaurants/:restaurantId/x/:id',
    { preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')] },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, id } = request.params as {
          restaurantId: string;
          id: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        const parseResult = updateXSchema.safeParse(request.body);
        if (!parseResult.success) {
          throw parseResult.error;
        }

        const resource = await xService.update(id, restaurantId, parseResult.data);

        return reply.send({ success: true, data: resource });
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  /**
   * DELETE /api/restaurants/:restaurantId/x/:id
   * Auth: OWNER, MANAGER
   */
  fastify.delete(
    '/restaurants/:restaurantId/x/:id',
    { preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')] },
    async (request, reply) => {
      try {
        const user = request.user as JwtPayload;
        const { restaurantId, id } = request.params as {
          restaurantId: string;
          id: string;
        };

        if (user.restaurantId !== restaurantId) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        await xService.delete(id, restaurantId);

        return reply.status(204).send();
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
};
```

**Key Rules:**
- ✅ JSDoc comments on every endpoint
- ✅ `preHandler` array for auth middleware
- ✅ Verify `user.restaurantId === restaurantId` in every handler
- ✅ Use `safeParse` and throw Zod error directly
- ✅ Response format: `{ success: true, data: ... }`
- ✅ Status codes: 201 (create), 200 (success), 204 (delete), 403 (forbidden), 404 (not found)

### 6. Register Routes

**Edit:** `/apps/api/src/server.ts`

Add import:
```typescript
import { xRoutes } from './modules/x/x.routes.js';
```

Register in `start()` function:
```typescript
await fastify.register(xRoutes);
```

### 7. Build & Verify

```bash
cd /Users/brucewayne/openorder/apps/api
pnpm build
pnpm type-check
```

Must have zero TypeScript errors.

## Common Patterns

### Auto Sort Order

```typescript
// Get max sortOrder for this restaurant
const maxSortOrder = await this.prisma.menuCategory.aggregate({
  where: { restaurantId },
  _max: { sortOrder: true },
});

const sortOrder = data.sortOrder ?? (maxSortOrder._max.sortOrder ?? -1) + 1;
```

### Soft Delete (isActive pattern)

```typescript
async delete(id: string, restaurantId: string) {
  await this.getById(id, restaurantId);

  await this.prisma.menuItem.update({
    where: { id },
    data: { isActive: false },
  });
}
```

### Toggle Endpoint (Quick Actions)

```typescript
fastify.patch(
  '/restaurants/:restaurantId/items/:id/availability',
  { preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER', 'STAFF')] },
  async (request, reply) => {
    // ... auth checks ...

    const { isAvailable } = request.body;
    await itemService.toggleAvailability(id, restaurantId, isAvailable);

    return reply.send({ success: true });
  }
);
```

### Reorder Endpoint (sortOrder management)

```typescript
async reorder(restaurantId: string, data: ReorderInput) {
  // Verify all belong to restaurant
  const items = await this.prisma.menuItem.findMany({
    where: { id: { in: data.itemIds }, restaurantId },
  });

  if (items.length !== data.itemIds.length) {
    throw new ValidationError('One or more items not found');
  }

  // Update in transaction
  await this.prisma.$transaction(
    data.itemIds.map((itemId: string, index: number) =>
      this.prisma.menuItem.update({
        where: { id: itemId },
        data: { sortOrder: index },
      })
    )
  );

  return this.list(restaurantId);
}
```

## Error Handling

**Import:**
```typescript
import { NotFoundError, ValidationError, AuthError, ForbiddenError } from '../../utils/errors.js';
```

**Usage:**
```typescript
// 404 - Resource not found
throw new NotFoundError('Category not found');

// 400 - Business rule violation
throw new ValidationError('Max quantity cannot be negative');

// 401 - Authentication required
throw new AuthError('Invalid token');

// 403 - Insufficient permissions
throw new ForbiddenError('Access denied');
```

**Zod Errors:**
```typescript
// Throw Zod error directly - handleError will format it properly
const parseResult = schema.safeParse(request.body);
if (!parseResult.success) {
  throw parseResult.error; // ✅ Correct
}

// DON'T do this:
throw new ValidationError('Invalid', parseResult.error); // ❌ Wrong
```

## Authentication Roles

From highest to lowest permission:

1. **OWNER** - Full restaurant access
2. **MANAGER** - Menu, orders, settings
3. **STAFF** - Orders only
4. **KITCHEN** - View orders (KDS)

**Middleware Examples:**
```typescript
// All authenticated users
{ preHandler: [verifyAuth] }

// OWNER and MANAGER only
{ preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER')] }

// All roles (explicit)
{ preHandler: [verifyAuth, requireRole('OWNER', 'MANAGER', 'STAFF', 'KITCHEN')] }
```

## Quality Checklist

Before completing, verify:

- [ ] AGPL-3.0 license header on all files
- [ ] All imports use `.js` extensions (ESM)
- [ ] No `any` types anywhere
- [ ] Restaurant ownership verified in all operations
- [ ] Zod schemas imported from `@openorder/shared-types`
- [ ] Authentication middleware on all endpoints
- [ ] Correct roles specified per endpoint
- [ ] Error handling with `handleError()`
- [ ] Consistent response format: `{ success: true, data: ... }`
- [ ] TypeScript compiles: `pnpm build` passes
- [ ] Type-check passes: `pnpm type-check` passes
- [ ] Routes registered in `server.ts`
- [ ] JSDoc comments on all public methods

## Anti-Patterns to Avoid

### ❌ Missing Restaurant Ownership Check

```typescript
// BAD - anyone can access any restaurant's data
const item = await this.prisma.menuItem.findUnique({ where: { id } });

// GOOD - verify ownership
const item = await this.prisma.menuItem.findFirst({
  where: { id, restaurantId },
});
```

### ❌ Wrong ValidationError Usage

```typescript
// BAD - ValidationError only takes message
throw new ValidationError('Invalid', zodError.errors);

// GOOD - throw Zod error directly
throw parseResult.error;
```

### ❌ Missing `.js` Extensions

```typescript
// BAD - ESM requires extensions
import { XService } from './x.service';

// GOOD
import { XService } from './x.service.js';
```

### ❌ Using `any` Types

```typescript
// BAD
async create(data: any) { }

// GOOD
async create(restaurantId: string, data: CreateXInput) { }
```

### ❌ No Auth Verification in Routes

```typescript
// BAD - missing verification
fastify.post('/restaurants/:restaurantId/items', async (request, reply) => {
  // Missing: if (user.restaurantId !== restaurantId) { ... }
});

// GOOD
if (user.restaurantId !== restaurantId) {
  return reply.status(403).send({ error: 'Access denied' });
}
```

## Reference Implementations

Study these existing modules:
- `/apps/api/src/modules/menu/` - Category CRUD (complete reference)
- `/apps/api/src/modules/media/` - Image upload with multipart
- `/apps/api/src/modules/auth/` - Authentication patterns

## When to Use This Skill

Use `/api-crud` when you need to:

- Generate new CRUD endpoints for a resource
- Follow OpenOrder's API patterns consistently
- Ensure authentication, validation, and error handling are correct
- Avoid common mistakes and anti-patterns
- Speed up API development with proven patterns

## Example Invocation

```
User: "Create CRUD endpoints for menu items"

You should:
1. Check MenuItem model in Prisma schema
2. Verify schemas in shared-types
3. Generate menu.service.ts with all methods
4. Generate menu.routes.ts with auth
5. Register routes in server.ts
6. Build and verify
7. Report completion
```
