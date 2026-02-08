---
name: commit
description: Create conventional commits following OpenOrder standards with AGPL co-authoring
disable-model-invocation: true
allowed-tools: Bash(git*)
---

# Conventional Commit Helper

This skill enforces conventional commit format with AGPL license awareness.

## Workflow

1. **Check Repository State**
   ```bash
   git status
   ```
   - See all untracked and modified files
   - Identify what needs to be staged

2. **Understand Changes**
   ```bash
   git diff
   git diff --staged
   ```
   - Review both staged and unstaged changes
   - Understand the full scope of modifications

3. **Determine Commit Type**

   **feat:** New features
   - Adding restaurant dashboard feature
   - New POS adapter
   - New API endpoint

   **fix:** Bug fixes
   - Fixing payment processing error
   - Correcting order calculation
   - Resolving webhook parsing issue

   **docs:** Documentation only
   - README updates
   - API documentation
   - Code comments

   **refactor:** Code restructuring without behavior change
   - Moving files
   - Renaming variables
   - Extracting functions

   **test:** Adding or updating tests
   - New integration tests
   - E2E test updates
   - Test fixtures

   **chore:** Tooling, dependencies, build config
   - Dependency updates
   - Build configuration
   - CI/CD changes

   **perf:** Performance improvements
   - Database query optimization
   - Bundle size reduction
   - Caching improvements

4. **Generate Commit Message**

   **Format:**
   ```
   <type>: <subject>

   <optional body>

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```

   **Subject Guidelines:**
   - Use imperative mood ("add feature" not "added feature")
   - Lowercase first letter
   - No period at the end
   - Max 72 characters
   - Focus on "why" not "what" (the diff shows "what")

   **Examples:**
   ```
   feat: add real-time order status updates via SSE
   fix: prevent duplicate order creation on double-click
   docs: update Docker setup instructions
   refactor: extract payment adapter interface
   test: add integration tests for webhook verification
   chore: update Prisma to v5.8.0
   ```

5. **Stage Files**

   **Prefer specific files over blanket staging:**
   ```bash
   # Good - explicit files
   git add apps/api/src/routes/orders.ts apps/api/src/services/order-service.ts

   # Avoid - catches everything including unintended files
   git add -A
   git add .
   ```

   **Never stage:**
   - `.env` files
   - `credentials.json`
   - Private keys
   - Large binaries
   - `node_modules/`

6. **Create Commit**

   **Use heredoc for proper formatting:**
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: add real-time order status updates via SSE

   Implement Server-Sent Events endpoint for customers to track
   order status without polling. Includes automatic reconnection
   and connection timeout handling.

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

7. **Verify Commit**
   ```bash
   git status
   git log -1 --pretty=format:"%h %s"
   ```

8. **Handle Pre-Commit Hook Failures**

   If pre-commit hook fails:
   - **DO NOT** use `--no-verify` (bypasses safety checks)
   - **DO NOT** use `--amend` (would modify previous commit)
   - Fix the issues (linting, formatting, tests)
   - Re-stage files
   - Create a **NEW** commit

   Example:
   ```bash
   # Hook failed due to linting errors
   npm run lint:fix
   git add apps/api/src/routes/orders.ts
   git commit -m "$(cat <<'EOF'
   feat: add real-time order status updates via SSE

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

## Scope Guidelines (Optional)

For larger projects, add scope to commits:

```
feat(api): add webhook signature verification
fix(dashboard): prevent order duplication on refresh
docs(setup): update Docker Compose instructions
```

**Common scopes:**
- `api` - Backend changes
- `storefront` - Customer-facing app
- `dashboard` - Restaurant management app
- `widget` - Embeddable widget
- `pos-adapters` - POS integrations
- `payment-adapters` - Payment providers
- `shared-types` - TypeScript types
- `ui` - Shared components

## Breaking Changes

If introducing breaking changes:

```
feat!: change order API response format

BREAKING CHANGE: Order API now returns ISO timestamps instead of
Unix timestamps. Update all clients to parse ISO 8601 format.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Multiple Changes

If commit includes unrelated changes, split into separate commits:

```bash
# Bad - mixing concerns
git add apps/api/src/routes/orders.ts apps/dashboard/src/components/Header.tsx
git commit -m "fix: various updates"

# Good - separate commits
git add apps/api/src/routes/orders.ts
git commit -m "fix: prevent duplicate order creation"

git add apps/dashboard/src/components/Header.tsx
git commit -m "fix: correct header alignment on mobile"
```

## Co-Author Attribution

Always include Claude co-authorship trailer:

```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

This is required for AGPL compliance and transparency about AI-assisted development.

## What NOT to Commit

- Environment files (`.env`, `.env.local`)
- API keys or secrets
- `node_modules/`
- Build artifacts (`dist/`, `.next/`, `out/`)
- IDE-specific files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Large binaries or media files (use Git LFS if needed)

These should already be in `.gitignore`, but verify before staging.
