# Contributing to OpenOrder

Thank you for your interest in contributing to OpenOrder! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, collaborative, and constructive. We're building this for independent restaurants who need help competing with big platforms.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Install dependencies**: `npm install`
4. **Start development environment**: `npm run dev`

## Development Workflow

### Before You Start

- Check existing issues to avoid duplicate work
- For major changes, open an issue first to discuss your approach
- Make sure you understand the [architecture](./openorder-architecture-plan.md)

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following our code style
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Run type checking: `npm run type-check`
6. Run linter: `npm run lint`
7. Format code: `npm run format`

### Commit Messages

Follow conventional commits format:

```
feat: add menu item image upload
fix: resolve order status update race condition
docs: update self-hosting guide
refactor: simplify payment adapter interface
test: add integration tests for POS sync
```

### Pull Requests

1. Push your branch to your fork
2. Open a pull request against `main`
3. Fill out the PR template completely
4. Link any related issues
5. Wait for CI checks to pass
6. Address review feedback

## Project Structure

This is a Turborepo monorepo. Key directories:

- `apps/api` - Fastify backend server
- `apps/storefront` - Next.js customer-facing ordering pages
- `apps/dashboard` - React SPA for restaurant management
- `apps/widget` - Embeddable widget
- `packages/shared-types` - Shared TypeScript types
- `packages/ui` - Shared component library
- `packages/pos-adapters` - POS integration adapters
- `packages/payment-adapters` - Payment provider adapters

## Code Style

- TypeScript for all new code
- Functional components with hooks (React)
- Async/await over promises
- Descriptive variable names
- Comments for complex logic only
- Types over interfaces (unless extending)

## Testing

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Run tests before committing: `npm test`

## Database Changes

Database schema changes require Prisma migrations:

```bash
cd apps/api
npx prisma migrate dev --name descriptive_migration_name
```

Always test migrations on a fresh database.

## Documentation

- Update relevant docs in `/docs` for feature changes
- Add JSDoc comments for public APIs
- Update README if adding user-facing features

## Questions?

- Open a [discussion](https://github.com/openorder/openorder/discussions)
- Check existing [issues](https://github.com/openorder/openorder/issues)
- Review the [architecture plan](./openorder-architecture-plan.md)

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.
