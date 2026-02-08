# OpenOrder

**Open-source restaurant ordering and management platform**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## What is OpenOrder?

OpenOrder is a free, self-hostable restaurant ordering platform that gives restaurants complete control over their online ordering experience. No commissions, no lock-in, full data ownership.

### Features

- **Beautiful ordering pages** — SSR-optimized storefront for fast loading and SEO
- **Embeddable widget** — Add ordering to any website with 2 lines of code
- **Real-time dashboard** — Manage orders, menu, and settings
- **Kitchen display system** — Optimized for tablets
- **POS integration** — Connect Square, Toast, Clover, or any system via webhooks
- **Flexible payments** — Stripe Connect (default) or bring your own payment processor
- **Full data ownership** — Self-host it, own everything

## Quick Start

```bash
# Clone the repository
git clone https://github.com/openorder/openorder.git
cd openorder

# Run the setup wizard
npx @openorder/cli init

# Start everything with Docker
docker compose up -d

# Visit http://localhost:3000/dashboard
```

## Project Structure

This is a monorepo managed with [Turborepo](https://turbo.build/repo):

```
openorder/
├── apps/
│   ├── api/          # Fastify API server
│   ├── storefront/   # Next.js customer-facing ordering pages
│   ├── dashboard/    # React SPA for restaurant management
│   └── widget/       # Embeddable ordering widget
├── packages/
│   ├── shared-types/     # TypeScript types shared across apps
│   ├── ui/               # Shared component library
│   ├── pos-adapters/     # POS integration adapters
│   └── payment-adapters/ # Payment provider adapters
├── docker/           # Docker Compose configuration
└── docs/            # Documentation
```

## Development

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

```bash
# Install dependencies
npm install

# Start development environment
npm run dev
```

This starts:
- API server on http://localhost:4000
- Storefront on http://localhost:3000
- Dashboard on http://localhost:3001
- PostgreSQL on localhost:5432
- Redis on localhost:6379

### Available Scripts

- `npm run dev` — Start all apps in development mode
- `npm run build` — Build all apps for production
- `npm run test` — Run tests across all packages
- `npm run lint` — Lint all code
- `npm run type-check` — TypeScript type checking
- `npm run format` — Format code with Prettier

## Documentation

- [Architecture Plan](./docs/openorder-architecture-plan.md)
- [Self-Hosting Guide](./docs/self-hosting.md) (coming soon)
- [POS Integration Guide](./docs/pos-integration-guide.md) (coming soon)
- [Payment Setup](./docs/payment-setup.md) (coming soon)
- [Embedding Guide](./docs/embedding-guide.md) (coming soon)
- [Contributing](./docs/contributing.md) (coming soon)

## Architecture

OpenOrder follows a clean architecture with:

- **Monorepo structure** for shared types and coordinated releases
- **PostgreSQL + Prisma** for type-safe data access and automatic migrations
- **Redis + BullMQ** for reliable job queues and real-time pub/sub
- **Fastify** for high-performance API server
- **Next.js** for SEO-optimized storefront (SSR)
- **React + Vite** for fast dashboard experience
- **Adapter pattern** for POS and payment provider flexibility

See the [Architecture Plan](./docs/openorder-architecture-plan.md) for full details.

## License

This project is licensed under the **AGPL-3.0** License.

This means:
- ✅ Free to use, modify, and self-host
- ✅ Can be used commercially
- ✅ Must share modifications if you run it as a service
- ❌ Cannot create a proprietary SaaS without open-sourcing your changes

See [LICENSE](./LICENSE) for full terms.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./docs/contributing.md) for guidelines.

See the [Architecture Plan](./docs/openorder-architecture-plan.md) for detailed roadmap.

## Support

- [GitHub Issues](https://github.com/openorder/openorder/issues)
- [Discussions](https://github.com/openorder/openorder/discussions)

## Why OpenOrder?

Restaurants pay 15-30% commission to DoorDash, Grubhub, and Uber Eats on every order. They don't own their customer data, can't control the experience, and are locked into the platform's ecosystem.

**OpenOrder gives restaurants their independence back.**

---

Built with ❤️ for independent restaurants everywhere.
