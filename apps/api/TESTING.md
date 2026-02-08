# OpenOrder API Testing Guide

This guide explains how to test the OpenOrder API using both automated integration tests and manual testing.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Integration Tests (Vitest)](#integration-tests-vitest)
3. [Manual Testing (curl)](#manual-testing-curl)
4. [Test Coverage](#test-coverage)

---

## Prerequisites

### For Integration Tests:
- Node.js 20+
- pnpm installed
- PostgreSQL database running (test database)
- Redis running

### For Manual Testing:
- API server running on `http://localhost:4000`
- curl installed
- bash shell

---

## Integration Tests (Vitest)

### Setup

1. Install dependencies:
```bash
cd apps/api
pnpm install
```

2. Configure test database:
```bash
# Copy .env and update DATABASE_URL for test database
cp .env .env.test
# Edit .env.test and set DATABASE_URL to test database
```

3. Run migrations on test database:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/openorder_test" pnpm db:deploy
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test src/modules/menu/menu.routes.test.ts

# Run with coverage
pnpm test -- --coverage
```

### Test Structure

Tests are located alongside the modules they test:
- `src/modules/menu/menu.routes.test.ts` - Menu CRUD tests
- `src/modules/media/media.routes.test.ts` - Media upload/delete tests

Test helpers are in:
- `src/test/setup.ts` - Global test setup/teardown
- `src/test/helpers.ts` - Test utilities (auth, database cleanup, etc.)

### What's Tested

#### Menu Module Tests
- ✅ Create menu categories with auth
- ✅ List categories
- ✅ Update categories
- ✅ Create menu items
- ✅ Get menu item by ID
- ✅ Toggle item availability
- ✅ Soft delete items
- ✅ Validate prices are positive
- ✅ Reject unauthorized access
- ✅ Reject access to different restaurant

#### Media Module Tests
- ✅ Upload images (multipart)
- ✅ Validate MIME types
- ✅ Validate file size limits
- ✅ Retrieve images (public endpoint)
- ✅ Delete images with ownership verification
- ✅ Reject unauthorized uploads
- ✅ Reject invalid file types
- ✅ Reject files that are too large
- ✅ Return 404 for non-existent images
- ✅ Return 400 for invalid UUID format
- ✅ Reject deletion from different restaurant

---

## Manual Testing (curl)

### Quick Start

The `test-api.sh` script tests all CRUD endpoints automatically:

```bash
# 1. Start the API server
cd apps/api
pnpm dev

# 2. In another terminal, run the test script
./test-api.sh
```

### What the Script Tests

The script performs **16 comprehensive tests**:

1. **Health Check** - Verifies API is running
2. **Generate Slug** - Tests slug generation utility
3. **Register User** - Creates restaurant and user account
4. **Login** - Authenticates and gets JWT token
5. **Get Restaurant** - Public endpoint test
6. **Create Menu Category** - Tests category creation with auth
7. **List Categories** - Verifies list endpoint
8. **Create Menu Item** - Tests item creation
9. **Get Menu Item** - Tests single item retrieval
10. **Update Menu Item** - Tests partial updates
11. **Toggle Availability** - Tests 86/un-86 feature
12. **Upload Image** - Tests multipart file upload
13. **Get Image** - Tests public image retrieval
14. **Unauthorized Access** - Verifies auth is enforced
15. **Delete Menu Item** - Tests soft delete
16. **Delete Image** - Tests image deletion with ownership

### Manual curl Examples

If you prefer to test endpoints individually:

#### 1. Health Check
```bash
curl http://localhost:4000/health
```

#### 2. Register User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "restaurantName": "My Restaurant",
    "restaurantSlug": "my-restaurant"
  }'
```

#### 3. Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePassword123!"
  }'
```

Save the `accessToken` from the response:
```bash
TOKEN="your-access-token-here"
RESTAURANT_ID="your-restaurant-id-here"
```

#### 4. Create Menu Category
```bash
curl -X POST "http://localhost:4000/restaurants/$RESTAURANT_ID/menu/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Appetizers",
    "description": "Start your meal right",
    "isActive": true
  }'
```

#### 5. Create Menu Item
```bash
CATEGORY_ID="category-id-from-previous-response"

curl -X POST "http://localhost:4000/restaurants/$RESTAURANT_ID/menu/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Buffalo Wings",
    "description": "Spicy chicken wings",
    "price": 1295,
    "categoryId": "'$CATEGORY_ID'",
    "isActive": true,
    "isAvailable": true
  }'
```

#### 6. Upload Image
```bash
# Create a test image or use an existing one
curl -X POST http://localhost:4000/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.png;type=image/png"
```

#### 7. Update Restaurant
```bash
curl -X PUT "http://localhost:4000/restaurants/$RESTAURANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "phone": "555-1234"
  }'
```

---

## Test Coverage

### Current Coverage

| Module | Service | Routes | Features Tested |
|--------|---------|--------|----------------|
| **Menu** | ✅ | ✅ | Categories, Items, Modifiers, Availability, Reordering |
| **Media** | ✅ | ✅ | Upload, Download, Delete, Ownership, Validation |
| **Restaurant** | ✅ | ✅ | Create, Read, Update, Slug generation |

### Authentication & Authorization

All CRUD endpoints test:
- ✅ JWT authentication required
- ✅ RBAC (Owner, Manager, Staff roles)
- ✅ Restaurant ownership verification
- ✅ Cross-restaurant access prevention

### Validation

All endpoints test:
- ✅ Zod schema validation
- ✅ Required fields
- ✅ Field length/format constraints
- ✅ Business rule validation

### Error Handling

Tests verify proper error responses for:
- ✅ 400 - Validation errors
- ✅ 401 - Unauthorized (missing/invalid token)
- ✅ 403 - Forbidden (wrong restaurant)
- ✅ 404 - Not found
- ✅ 413 - Payload too large (file uploads)

---

## Continuous Integration

To run tests in CI/CD:

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test --run --coverage

# Build
pnpm build
```

---

## Troubleshooting

### Tests Fail with Database Errors

Make sure your test database is running and migrations are applied:
```bash
DATABASE_URL="your-test-db-url" pnpm db:deploy
```

### Manual Test Script Fails

1. Verify API server is running: `curl http://localhost:4000/health`
2. Check if database migrations are up to date: `pnpm db:deploy`
3. Verify Redis is running (required for rate limiting)

### Image Upload Tests Fail

Make sure the `/data/uploads` directory exists and is writable:
```bash
mkdir -p /data/uploads
chmod 755 /data/uploads
```

---

## Next Steps

- [ ] Add E2E tests with Playwright
- [ ] Add load testing with k6
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Add database seeding for development
- [ ] Create Postman/Insomnia collection

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Fastify Testing](https://fastify.dev/docs/latest/Guides/Testing/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
