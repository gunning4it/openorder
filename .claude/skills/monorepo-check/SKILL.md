---
name: monorepo-check
description: Run comprehensive checks across the entire monorepo. Use before creating PRs or after making cross-package changes.
disable-model-invocation: false
allowed-tools: Bash(npm run*), Bash(cd apps/*), Bash(cd packages/*)
---

# Monorepo Orchestration & Validation

This skill runs comprehensive checks across the entire Turborepo monorepo.

## Workflow

1. **Verify Clean State**
   ```bash
   git status
   ```
   - Check for uncommitted changes
   - Warn if there are unstaged changes that might affect tests

2. **Type Checking**
   ```bash
   npm run type-check
   ```

   **What it does:**
   - Runs TypeScript compiler in all packages
   - Validates types across package boundaries
   - Checks Prisma Client types are up-to-date

   **If it fails:**
   - Parse error output to identify which package failed
   - Show file path and line number
   - Common fixes:
     - **Type errors after schema change:** Run `cd apps/api && npx prisma generate`
     - **Type errors in shared-types:** Rebuild shared-types: `cd packages/shared-types && npm run build`
     - **Missing imports:** Check if dependency was added to package.json
     - **Workspace dependency issues:** Run `npm install` from root

3. **Linting**
   ```bash
   npm run lint
   ```

   **What it does:**
   - Runs ESLint across all packages
   - Checks code style and potential bugs
   - Validates import ordering

   **If it fails:**
   - Show specific files with errors
   - Offer to auto-fix: `npm run lint:fix`
   - Manual fixes required for:
     - Unused variables
     - Missing dependencies in useEffect
     - Incorrect TypeScript types
     - Security issues (eval, dangerouslySetInnerHTML)

4. **Testing**
   ```bash
   npm test
   ```

   **What it does:**
   - Runs Vitest tests in all packages
   - Includes unit and integration tests
   - May spin up Testcontainers for API tests

   **If it fails:**
   - Show failed test output
   - Identify which package failed
   - Suggest debugging approach:
     - **Unit tests:** Check test expectations vs actual output
     - **Integration tests:** Verify database is accessible
     - **Flaky tests:** Run `npm test -- --reporter=verbose` for details

5. **Build Validation (Optional)**
   ```bash
   npm run build
   ```

   **What it does:**
   - Builds all apps and packages
   - Validates production build succeeds
   - Checks for build-time errors

   **If it fails:**
   - Check for missing environment variables
   - Verify all dependencies installed
   - Check for circular dependencies
   - Validate Next.js/Vite config

6. **Report Results**

   **Success Output:**
   ```
   ✅ Monorepo Check Complete

   Type Checking: ✅ Passed (8 packages)
   Linting:       ✅ Passed (0 errors, 2 warnings)
   Testing:       ✅ Passed (142 tests, 0 failed)

   All checks passed! Safe to create PR.
   ```

   **Failure Output:**
   ```
   ❌ Monorepo Check Failed

   Type Checking: ✅ Passed
   Linting:       ❌ Failed
   Testing:       ⏭️  Skipped (linting must pass first)

   Errors in apps/dashboard/src/components/OrderList.tsx:

   Line 42: 'order' is assigned a value but never used
   Line 58: Missing dependency 'fetchOrders' in useEffect

   Fix with: npm run lint:fix
   Or manually resolve the issues above.
   ```

## Error Diagnosis

### Type Checking Errors

**Error: Cannot find module '@openorder/shared-types'**
```bash
# Fix: Rebuild shared types
cd packages/shared-types && npm run build
npm install
```

**Error: Property 'X' does not exist on type 'Y'**
- Check if Prisma schema changed: `cd apps/api && npx prisma generate`
- Verify shared-types exports the type
- Check TypeScript version compatibility

### Linting Errors

**Error: 'React' must be in scope when using JSX**
- Add `import React from 'react'` (React 17-)
- Or remove (React 18+ doesn't require it)

**Error: Unexpected any**
- Replace `any` with proper type
- Use `unknown` if type is truly unknown

### Test Failures

**Error: Cannot connect to database**
```bash
# Start Docker services
docker compose -f docker/docker-compose.yml up -d postgres redis

# Wait for readiness
sleep 5

# Retry tests
npm test
```

**Error: Timeout exceeded**
- Increase timeout in test: `it('test', async () => { ... }, 10000)`
- Check if test is hanging on async operation

## Cross-Package Considerations

### Dependency Changes

If you modified `package.json` in any package:
```bash
# Reinstall from root
npm install

# Verify workspace links
npm list --depth=0
```

### Shared Types Changes

If you modified `packages/shared-types/src/`:
```bash
# Rebuild shared types
cd packages/shared-types && npm run build

# Rebuild dependent packages
cd ../../apps/storefront && npm run build
cd ../dashboard && npm run build
```

### Prisma Schema Changes

If you modified `apps/api/prisma/schema.prisma`:
```bash
# Regenerate Prisma Client
cd apps/api && npx prisma generate

# Rebuild packages that import Prisma types
cd ../../packages/shared-types && npm run build
```

## Performance Optimization

**Turbo Cache:**
Turborepo caches build outputs. If builds seem stale:
```bash
# Clear cache
npx turbo clean

# Rebuild everything
npm run build
```

**Parallel Execution:**
Turbo runs tasks in parallel when possible. Check pipeline in `turbo.json`:
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],  // Depends on dependencies building first
      "outputs": ["dist/**", ".next/**"]
    }
  }
}
```

## Pre-PR Checklist

Before creating a pull request:

- [ ] All type checks pass
- [ ] No linting errors (warnings acceptable if documented)
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No uncommitted changes
- [ ] Conventional commit format used
- [ ] AGPL headers present on new files
- [ ] Documentation updated if needed

## CI/CD Integration

This skill mirrors what GitHub Actions will run:

**.github/workflows/test.yml:**
```yaml
- run: npm install --frozen-lockfile
- run: npm run type-check
- run: npm run lint
- run: npm test
- run: npm run build
```

Running locally ensures CI will pass.

## Monorepo-Specific Issues

**Phantom Dependencies:**
If a package works locally but fails in CI:
- It may be importing a dependency it doesn't declare
- Check `package.json` has all required dependencies
- Use `pnpm` to prevent hoisting (stricter than npm)

**Circular Dependencies:**
If builds hang or fail mysteriously:
```bash
# Check for circular imports
npx madge --circular --extensions ts,tsx apps/api/src
```

**Version Mismatches:**
If types don't match across packages:
```bash
# Ensure consistent versions
npm list react
npm list typescript
```

Fix by aligning versions in root `package.json`.

## Quick Fixes

**After pulling changes:**
```bash
npm install
npm run type-check
```

**After modifying shared code:**
```bash
npx turbo clean
npm run build
```

**Before creating PR:**
```bash
npm run type-check && npm run lint && npm test
```
