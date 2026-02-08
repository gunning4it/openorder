# OpenOrder Claude Code Skills

Custom skills that extend Claude's capabilities for OpenOrder development.

## Available Skills

### `/prisma-migration` - Database Migration Helper
Creates Prisma migrations with proper naming and validation.

**Usage:** `/prisma-migration`

**When to use:**
- After modifying `apps/api/prisma/schema.prisma`
- When adding new database tables or fields
- When changing field types or constraints

**What it does:**
- Detects schema changes
- Generates descriptive migration name
- Creates migration with `npx prisma migrate dev`
- Regenerates Prisma Client
- Reminds about testing on fresh database

---

### `/commit` - Conventional Commits
Enforces conventional commit format with AGPL co-authoring.

**Usage:** `/commit`

**When to use:**
- Every time you're ready to commit changes
- Instead of manually running `git commit`

**What it does:**
- Analyzes changed files with `git status` and `git diff`
- Determines appropriate commit type (feat, fix, docs, etc.)
- Generates concise commit message
- Stages specific files (avoids `git add -A`)
- Creates commit with Claude co-authorship trailer
- Handles pre-commit hook failures correctly

---

### `/adapter-scaffold` - Adapter Generator
Scaffolds new POS or payment adapter implementations.

**Usage:** `/adapter-scaffold`

**When to use:**
- Adding support for new POS system (Square, Toast, Clover, etc.)
- Adding support for new payment provider (Stripe, PayPal, etc.)

**What it does:**
- Asks for adapter type (POS or Payment) and vendor name
- Reads existing adapter interfaces
- Generates new adapter file with all required methods
- Includes AGPL-3.0 header
- Adds webhook signature verification stubs
- Creates test file stub
- Updates package exports

---

### `/monorepo-check` - Monorepo Validation
Runs comprehensive checks across all packages.

**Usage:** `/monorepo-check`

**When to use:**
- Before creating pull requests
- After making cross-package changes
- After modifying shared-types or Prisma schema
- To verify local changes pass CI checks

**What it does:**
- Runs `npm run type-check` across all packages
- Runs `npm run lint` to check code style
- Runs `npm test` to verify all tests pass
- Diagnoses failures with specific file/line numbers
- Suggests fixes for common issues

---

### `/docker-init` - Docker Environment Setup
Initializes Docker development environment with migrations.

**Usage:** `/docker-init`

**When to use:**
- First-time project setup
- After pulling major changes
- When resetting development environment
- When helping new contributors get started

**What it does:**
- Checks for `.env` file (copies from `.env.example` if missing)
- Starts Docker services (Postgres, Redis, API, Storefront, Dashboard)
- Waits for PostgreSQL to be ready
- Runs database migrations
- Generates Prisma Client
- Shows service endpoints and useful commands

---

### `/ui-design` - Frontend Designer
Enforces modern UX best practices and design system consistency.

**Usage:** `/ui-design` (or let Claude invoke automatically when creating/reviewing UI code)

**When to use:**
- Creating new React components
- Implementing design mockups
- Reviewing existing UI for consistency
- Building forms, buttons, cards, or interactive elements
- Refactoring UI for accessibility

**What it does:**
- Enforces Base 8 spacing system (8px, 16px, 24px, etc.)
- Ensures WCAG AA color contrast (4.5:1 ratio minimum)
- Requires all interactive elements to have hover, active, and focus states
- Validates semantic HTML (buttons not divs, proper heading hierarchy)
- Checks accessibility (aria-labels, alt text, keyboard navigation)
- Prevents common anti-patterns (div soup, poor contrast, missing loading states)
- Ensures mobile-responsive design with proper breakpoints

**Example patterns enforced:**
- ✅ `<div className="p-4 gap-6 mb-8">` (Base 8 spacing)
- ❌ `<div className="p-3 gap-5 mb-7">` (Non-standard spacing)
- ✅ `<button className="focus:ring-2">` (Accessible)
- ❌ `<div onClick={...}>` (Not semantic)

---

### `/security-audit` - Security Engineer
Audits codebase for vulnerabilities, secrets, and dependency risks.

**Usage:** `/security-audit`

**When to use:**
- Before every commit (especially to main branch)
- After adding new dependencies
- When reviewing pull requests
- Before deploying to production
- After security advisories are published
- During regular security audits

**What it does:**
- Scans for hardcoded secrets (Stripe keys, AWS keys, database passwords)
- Checks git history for accidentally committed `.env` files
- Runs `npm audit` for known vulnerabilities
- Verifies all packages have `"private": true` (prevents accidental publishing)
- Checks turbo.json for sensitive environment variables
- Validates SECURITY.md exists
- Checks webhook signature verification in adapters
- Looks for SQL injection risks
- Verifies JWT secret and password hashing configuration
- Checks rate limiting setup

**Output format:**
- Critical Findings (fix immediately)
- Warnings (fix within 24h)
- Passing Checks

---

## Adding New Skills

See: https://code.claude.com/docs/skills

1. Create new directory: `.claude/skills/skill-name/`
2. Add `SKILL.md` with frontmatter and instructions
3. Test with `/skill-name`
4. Commit to repository (all contributors get the skill automatically)

## Skill Frontmatter

Each skill includes frontmatter with:

- `name`: Skill identifier (used with `/skill-name`)
- `description`: When to use this skill
- `disable-model-invocation`: Whether skill can auto-invoke
- `allowed-tools`: Restricted tool access for safety

## How Skills Work

- **Project-scoped:** Stored in `.claude/skills/`, version-controlled with code
- **Automatic discovery:** Claude loads all skills when you start a session
- **Manual invocation:** Use `/skill-name` to explicitly trigger
- **Automatic invocation:** Some skills trigger automatically based on context
- **Shared with team:** Everyone who clones the repo gets the same skills

## Benefits

1. **Consistency:** All developers follow same patterns (conventional commits, adapter architecture, AGPL headers)
2. **Speed:** Automate repetitive workflows (migrations, Docker setup, commits)
3. **Quality:** Enforce best practices (monorepo checks before PRs, security audits, UX guidelines)
4. **Onboarding:** New contributors get guided workflows (`/docker-init`)
5. **Documentation:** Skills are self-documenting (instructions live with code)

## Integration with CI/CD

These skills complement GitHub Actions:

- **Local:** Skills run on developer machine (instant feedback)
- **CI:** GitHub Actions run same checks on PRs (gate merges)
- **Benefits:** Catch issues before pushing, reduce CI round-trips

Example workflow:
1. Make code changes
2. Run `/monorepo-check` locally
3. Fix any issues
4. Run `/security-audit` to check for secrets
5. Run `/commit` to create conventional commit
6. Push to GitHub (CI runs same checks)

## Tips

- Use skills instead of manual commands (faster, more consistent)
- Skills enforce OpenOrder-specific patterns (AGPL headers, adapter interfaces, Base 8 spacing)
- Skills are markdown files - easy to modify and version control
- Check this README to discover which skill solves your current task

## Questions?

- Read individual skill files in `.claude/skills/{skill-name}/SKILL.md`
- Check `CLAUDE.md` for project-specific guidance
- Ask Claude: "What skills are available?" or "How do I use /commit?"
