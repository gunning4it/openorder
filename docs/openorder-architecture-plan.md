# OpenOrder: Open-Source Restaurant Ordering Platform
## Architecture & Engineering Plan — v2

**License:** AGPL-3.0
**Payment Model:** Stripe Connect (Direct Charges) with architectural flexibility for BYO
**Target:** Production-grade, self-hostable, embeddable ordering system for restaurants

---

## Table of Contents

1. [Problem Statement & Product Vision](#1-problem-statement--product-vision)
2. [Key Architectural Decisions (ADRs)](#2-key-architectural-decisions)
3. [System Architecture](#3-system-architecture)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Data Model](#5-data-model)
6. [The Storefront (Customer Ordering Experience)](#6-the-storefront)
7. [The Embeddable Widget & SDK](#7-the-embeddable-widget--sdk)
8. [The Restaurant Dashboard](#8-the-restaurant-dashboard)
9. [POS Integration Layer](#9-pos-integration-layer)
10. [Payment Architecture](#10-payment-architecture)
11. [Self-Hosting & Deployment](#11-self-hosting--deployment)
12. [API Design](#12-api-design)
13. [Security Model](#13-security-model)
14. [Testing Strategy](#14-testing-strategy)
15. [Phased Build Plan](#15-phased-build-plan)
16. [Risk Register](#16-risk-register)

---

## 1. Problem Statement & Product Vision

### The Problem
Restaurants pay 15–30% commission to DoorDash/Grubhub/Seamless on every order. They don't own their customer data, can't control the experience, and are locked into the platform's POS and payment processing. Small and independent restaurants are disproportionately hurt.

### The Vision
**OpenOrder** is a free, open-source, self-hostable restaurant ordering and management platform. Restaurants get:

- A **beautiful ordering page** they can link from Google Maps, Instagram, their website, anywhere
- An **embeddable ordering widget** (2 lines of code) for their existing site
- A **real-time restaurant dashboard** for managing orders, menu, and settings
- A **kitchen display system (KDS)** optimized for tablets
- **BYO POS** — plug in Square, Toast, Clover, or any system via webhooks
- **BYO payment processing** — or get started instantly with Stripe Connect
- **Full data ownership** — self-host it, own everything

### What This Is NOT
This is not a consumer marketplace. There is no "OpenOrder app" where customers browse restaurants. Each restaurant gets their own standalone ordering experience. The value prop is operational independence, not consumer traffic.

---

## 2. Key Architectural Decisions

### ADR-001: Monorepo with Turborepo
**Decision:** Single monorepo using Turborepo for build orchestration.
**Rationale:** Shared TypeScript types between API, dashboard, storefront, and widget are critical for type safety across the order lifecycle. A monorepo ensures the `Order` type in the API is the same `Order` type rendered in the dashboard. At this project's scale, the coordination cost of separate repos far exceeds the cost of a monorepo.
**Trade-off:** Larger repo, more complex CI. Acceptable for the type safety and DX gains.
**Revisit when:** The team exceeds ~10 engineers or if build times exceed 5 minutes.

### ADR-002: Next.js for Storefront, React + Vite for Dashboard
**Decision:** The customer-facing storefront (ordering page) uses Next.js (App Router, RSC). The restaurant dashboard uses React + Vite (SPA).
**Rationale:** The storefront needs SSR/SSG for SEO (Google needs to crawl the menu for Maps integration), fast initial load, and dynamic OG meta tags per restaurant. The dashboard is an authenticated SPA where SEO is irrelevant and SPA routing is simpler. Using Next.js for both would add unnecessary complexity to the dashboard.
**Trade-off:** Two different frontend build pipelines. Mitigated by shared component library in the monorepo.

### ADR-003: PostgreSQL + Prisma ORM
**Decision:** PostgreSQL as the sole database. Prisma as the ORM with migration management.
**Rationale:** PostgreSQL's JSONB columns provide flexibility for menu schemas and POS adapter configs without sacrificing relational integrity for orders and payments. Prisma provides type-safe database access, excellent migration tooling (`prisma migrate deploy` runs automatically in Docker), and introspection for debugging. The migration story is critical for self-hosters — Prisma's `migrate deploy` is idempotent and runs on container startup, meaning self-hosters get schema updates automatically when they pull a new Docker image.
**Alternatives considered:** Drizzle ORM (lighter weight, but migration tooling is less mature for the Docker auto-deploy pattern). Raw SQL with node-pg (too much boilerplate for an open-source project where contributors need to ramp quickly).
**Trade-off:** Prisma adds ~30MB to the Docker image and has a cold-start penalty. Acceptable.

### ADR-004: Stripe Connect with Direct Charges (Default), Payment Adapter Interface for BYO
**Decision:** Stripe Connect using direct charges as the default payment method. Abstract behind a `PaymentAdapter` interface to allow future BYO payment providers.
**Rationale:** Direct charges mean the restaurant is the merchant of record. The payment appears on the customer's credit card statement as the restaurant's name, not "OpenOrder." This is the correct model for a platform that doesn't want to be a payment facilitator. The restaurant bears Stripe fees (2.9% + $0.30), the platform takes $0 application fee by default (deployers can configure a fee if they want to monetize). The `PaymentAdapter` interface ensures we don't hardcode Stripe throughout the codebase.
**Trade-off:** Direct charges require the connected account (restaurant) to be in the same country as the customer paying. This is fine for restaurant ordering (local business) but would matter for a global marketplace. Not our concern.

### ADR-005: Embeddable Widget via Web Component (Shadow DOM) + iframe Fallback
**Decision:** The primary embed mechanism is a Web Component using Shadow DOM. An iframe embed is also supported as a simpler fallback.
**Rationale:** Web Components with Shadow DOM provide style isolation (restaurant's site CSS won't break the widget and vice versa), work on any website regardless of framework, and allow the widget to resize dynamically with the page. The iframe fallback exists because some platforms (Squarespace, Wix) restrict custom JavaScript but allow iframes. Both approaches load the same underlying React app — the Web Component mounts it in a shadow root, the iframe loads it in a standalone page.
**Trade-off:** Web Components have slightly more complex build pipeline. Shadow DOM can cause issues with some CSS-in-JS libraries (mitigated by using Tailwind, which compiles to static CSS).

### ADR-006: AGPL-3.0 License
**Decision:** AGPL-3.0 for all platform code.
**Rationale:** Ensures that anyone who runs a modified version of OpenOrder as a service must share their modifications. This protects the open-source community — a company can't fork the project, add features, and run it as a proprietary SaaS without contributing back. This is the same model used by GitLab, Discourse, and Mastodon.
**Implication:** Companies can still self-host it internally without sharing code. The AGPL trigger is "conveying to users over a network" — if they modify it and offer it to restaurants as a service, they must open-source their changes.

### ADR-007: Redis for Queues, Caching, and Real-Time Pub/Sub
**Decision:** Redis serves triple duty: BullMQ job queues, caching layer, and pub/sub for real-time updates (via Socket.IO Redis adapter).
**Rationale:** One dependency instead of three. Redis is already battle-tested for all three use cases. BullMQ provides reliable webhook delivery with retries. Redis pub/sub enables horizontal scaling of WebSocket connections (multiple API server instances can broadcast to the same restaurant's dashboard). The self-hosting story stays simple — `docker compose up` runs Postgres and Redis, that's it.
**Trade-off:** Redis is an additional container. But the alternative (in-memory queues) doesn't survive restarts and can't scale horizontally.

### ADR-008: File Storage Abstraction (Local + S3-Compatible)
**Decision:** Menu item images are stored via a `StorageAdapter` interface. Default implementation writes to local filesystem (Docker volume). Optional S3-compatible adapter for production (works with AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces).
**Rationale:** Self-hosters running Docker on a VPS shouldn't need an AWS account to upload menu photos. Local filesystem with a Docker volume is the simplest default. Production deployments and anyone needing CDN delivery can swap in S3.
**Implementation:** Images are served via the API server (GET /api/media/:id) with aggressive cache headers. The API proxies from whatever storage backend is configured. This means the public URL is always the same regardless of storage backend.

---

## 3. System Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Customer Touchpoints         │
                    ├──────────┬────────────┬──────────────┤
                    │ Direct   │ Embedded   │ Google Maps  │
                    │ Link     │ Widget     │ / Social     │
                    │ (SSR)    │ (Shadow    │ Link         │
                    │          │  DOM)      │ (→ Direct)   │
                    └─────┬────┴─────┬──────┴───────┬──────┘
                          │          │              │
                          ▼          ▼              ▼
                    ┌─────────────────────────────────────┐
                    │      Storefront (Next.js SSR)       │
                    │  /order/:slug — public ordering UI  │
                    │  Menu, cart, checkout, order status  │
                    └──────────────┬──────────────────────┘
                                   │ REST API calls
                                   ▼
┌──────────────┐   ┌─────────────────────────────────────┐   ┌──────────────┐
│  Restaurant  │   │         API Server (Fastify)        │   │  Kitchen     │
│  Dashboard   │◄──┤  Auth, Orders, Menus, Payments,     ├──►│  Display     │
│  (React SPA) │   │  POS Sync, Webhooks, Media          │   │  (React SPA) │
│              │──►│                                      │   │  (tablets)   │
└──────────────┘   └─────┬─────────┬──────────┬──────────┘   └──────────────┘
     ▲ WebSocket         │         │          │                    ▲ WebSocket
     │                   │         │          │                    │
     └───────────────────┤         │          ├────────────────────┘
                         ▼         ▼          ▼
                   ┌─────────┐ ┌───────┐ ┌─────────┐
                   │Postgres │ │ Redis │ │  File   │
                   │  (data) │ │(queue,│ │ Storage │
                   │         │ │cache, │ │(local/  │
                   │         │ │pubsub)│ │  S3)    │
                   └─────────┘ └───┬───┘ └─────────┘
                                   │
                          ┌────────▼─────────┐
                          │   BullMQ Workers  │
                          │  ┌──────────────┐ │
                          │  │ Webhook      │ │
                          │  │ Delivery     │ │
                          │  ├──────────────┤ │
                          │  │ POS Sync     │ │
                          │  ├──────────────┤ │
                          │  │ Notification │ │
                          │  │ (email/SMS)  │ │
                          │  └──────────────┘ │
                          └──────────────────-┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────────┐
              │  Square  │  │  Toast   │  │   Generic    │
              │  POS API │  │  POS API │  │   Webhook    │
              └──────────┘  └──────────┘  └──────────────┘
```

### Why Fastify (not Express)?
Fastify is 2-3x faster than Express, has built-in JSON schema validation (we can validate every request/response against the schema), first-class TypeScript support, and a mature plugin system. The ecosystem is large enough in 2026 that library compatibility is not a concern.

---

## 4. Monorepo Structure

```
openorder/
├── apps/
│   ├── api/                    # Fastify API server + BullMQ workers
│   │   ├── src/
│   │   │   ├── modules/        # Domain modules (see below)
│   │   │   │   ├── auth/
│   │   │   │   ├── menu/
│   │   │   │   ├── order/
│   │   │   │   ├── payment/
│   │   │   │   ├── pos/
│   │   │   │   ├── restaurant/
│   │   │   │   ├── media/
│   │   │   │   └── webhook/
│   │   │   ├── adapters/       # POS + Payment adapters
│   │   │   │   ├── pos/
│   │   │   │   │   ├── square.adapter.ts
│   │   │   │   │   ├── toast.adapter.ts
│   │   │   │   │   ├── clover.adapter.ts
│   │   │   │   │   └── generic-webhook.adapter.ts
│   │   │   │   └── payment/
│   │   │   │       ├── stripe-connect.adapter.ts
│   │   │   │       ├── stripe-direct.adapter.ts    # BYO Stripe keys
│   │   │   │       └── webhook-payment.adapter.ts  # B2 generic
│   │   │   ├── workers/        # BullMQ job processors
│   │   │   ├── lib/            # Shared utilities
│   │   │   └── server.ts       # Fastify app entry
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── storefront/             # Next.js — customer ordering pages
│   │   ├── app/
│   │   │   ├── order/[slug]/   # Main ordering page (SSR)
│   │   │   │   ├── page.tsx
│   │   │   │   └── opengraph-image.tsx  # Dynamic OG images
│   │   │   ├── order/[slug]/status/[orderId]/  # Order tracking
│   │   │   └── api/            # Next.js API routes (BFF proxy)
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── dashboard/              # React + Vite — restaurant management
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── orders/     # Real-time order management
│   │   │   │   ├── menu/       # Menu editor
│   │   │   │   ├── kitchen/    # KDS (full-screen mode)
│   │   │   │   ├── settings/   # POS, payments, restaurant config
│   │   │   │   └── analytics/  # Sales, popular items
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── widget/                 # Embeddable ordering widget
│       ├── src/
│       │   ├── web-component.ts    # Custom element definition
│       │   ├── Widget.tsx          # React root for widget
│       │   └── iframe-entry.ts     # iframe bootstrap
│       ├── rollup.config.ts        # Bundles to single JS file
│       └── package.json
│
├── packages/
│   ├── shared-types/           # TypeScript types shared across apps
│   │   ├── src/
│   │   │   ├── order.ts
│   │   │   ├── menu.ts
│   │   │   ├── restaurant.ts
│   │   │   ├── payment.ts
│   │   │   └── pos.ts
│   │   └── package.json
│   │
│   ├── ui/                     # Shared component library
│   │   ├── src/
│   │   │   ├── primitives/     # Radix-based primitives
│   │   │   ├── components/     # Composed components
│   │   │   └── styles/         # Tailwind presets + tokens
│   │   └── package.json
│   │
│   ├── pos-adapters/           # POS adapter interfaces + implementations
│   │   ├── src/
│   │   │   ├── types.ts        # IPosAdapter interface
│   │   │   ├── square/
│   │   │   ├── toast/
│   │   │   ├── clover/
│   │   │   └── generic/
│   │   └── package.json
│   │
│   └── payment-adapters/       # Payment adapter interfaces + implementations
│       ├── src/
│       │   ├── types.ts        # IPaymentAdapter interface
│       │   ├── stripe-connect/
│       │   ├── stripe-direct/
│       │   └── webhook/
│       └── package.json
│
├── docker/
│   ├── docker-compose.yml          # Full stack: API + Storefront + Dashboard + Postgres + Redis
│   ├── docker-compose.dev.yml      # Dev overrides (hot reload, exposed ports)
│   ├── .env.example                # Annotated env template
│   └── nginx.conf                  # Reverse proxy config
│
├── docs/
│   ├── self-hosting.md
│   ├── pos-integration-guide.md
│   ├── payment-setup.md
│   ├── embedding-guide.md
│   └── contributing.md
│
├── turbo.json
├── package.json
├── LICENSE                         # AGPL-3.0
└── README.md
```

---

## 5. Data Model

### Core Schema (Prisma)

```prisma
// ============================================================
// RESTAURANT
// ============================================================
model Restaurant {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique    // URL-safe identifier: /order/{slug}
  description   String?
  logoUrl       String?
  coverImageUrl String?
  phone         String?
  email         String?
  timezone      String   @default("America/New_York")
  currency      String   @default("USD")
  locale        String   @default("en-US")

  // Address (for display + tax calculation)
  addressLine1  String?
  addressLine2  String?
  city          String?
  state         String?
  postalCode    String?
  country       String   @default("US")
  latitude      Float?
  longitude     Float?

  // Operating config
  isActive         Boolean @default(true)
  acceptingOrders  Boolean @default(true)
  orderThrottleMax Int?    // Max orders per 15-min window, null = unlimited

  // Fulfillment options
  pickupEnabled    Boolean @default(true)
  deliveryEnabled  Boolean @default(false)
  dineInEnabled    Boolean @default(false)
  prepTimeMinutes  Int     @default(20)  // Default estimated prep time

  // Appearance / Branding
  brandColor       String  @default("#000000")  // Primary brand color for storefront
  customCss        String? // Optional custom CSS for storefront

  // POS Configuration
  posType          PosType @default(NONE)
  posConfig        Json?   // Encrypted at-rest. Contains API keys, OAuth tokens, webhook URLs.

  // Payment Configuration
  paymentType      PaymentType @default(STRIPE_CONNECT)
  stripeAccountId  String?     // Stripe Connect account ID (for STRIPE_CONNECT)
  paymentConfig    Json?       // Encrypted. BYO Stripe keys or webhook config.

  // Tax configuration
  taxRate          Decimal  @default(0) @db.Decimal(5, 4) // e.g., 0.0825 = 8.25%
  taxInclusive     Boolean  @default(false)

  // Tip configuration
  tipsEnabled      Boolean  @default(true)
  tipPresets       Json     @default("[10, 15, 20, 25]") // Percentage presets

  // Relations
  staff            Staff[]
  menuCategories   MenuCategory[]
  menuItems        MenuItem[]
  orders           Order[]
  operatingHours   OperatingHours[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum PosType {
  NONE
  SQUARE
  TOAST
  CLOVER
  GENERIC_WEBHOOK
}

enum PaymentType {
  STRIPE_CONNECT     // Default: Stripe Connect direct charges
  STRIPE_DIRECT      // BYO: Restaurant provides own Stripe keys
  WEBHOOK_PAYMENT    // B2: Generic payment webhook
}

model OperatingHours {
  id           String     @id @default(cuid())
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  dayOfWeek    Int        // 0 = Sunday, 6 = Saturday
  openTime     String     // "09:00" (24hr, restaurant local time)
  closeTime    String     // "22:00"
  isClosed     Boolean    @default(false)

  @@unique([restaurantId, dayOfWeek])
}

// ============================================================
// MENU
// ============================================================
model MenuCategory {
  id           String     @id @default(cuid())
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)

  name         String
  description  String?
  imageUrl     String?
  sortOrder    Int        @default(0)
  isActive     Boolean    @default(true)

  // Availability windows (null = always available)
  availableFrom String?   // "11:00"
  availableTo   String?   // "15:00" (e.g., lunch only)

  items        MenuItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([restaurantId, sortOrder])
}

model MenuItem {
  id             String       @id @default(cuid())
  restaurantId   String
  restaurant     Restaurant   @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  categoryId     String
  category       MenuCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  name           String
  description    String?
  price          Int               // Price in cents (e.g., 1299 = $12.99)
  compareAtPrice Int?              // Original price for showing discounts
  imageUrl       String?

  // Rich details
  ingredients    String[]          // ["flour", "mozzarella", "tomato sauce", "basil"]
  allergens      String[]          // ["gluten", "dairy"]
  tags           String[]          // ["vegetarian", "spicy", "gluten-free", "popular"]
  calories       Int?
  prepTimeMin    Int?              // Item-specific prep time override

  // Availability
  isActive       Boolean           @default(true)
  isAvailable    Boolean           @default(true)  // Real-time 86 status
  stockCount     Int?              // null = unlimited
  maxQuantity    Int               @default(99)    // Max qty per order

  // POS mapping
  posItemId      String?           // External POS item identifier
  posData        Json?             // Additional POS-specific metadata

  sortOrder      Int               @default(0)
  isFeatured     Boolean           @default(false) // Highlighted items

  modifierGroups MenuModifierGroup[]
  orderItems     OrderItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([restaurantId, categoryId, sortOrder])
  @@index([restaurantId, isActive, isAvailable])
}

model MenuModifierGroup {
  id          String   @id @default(cuid())
  menuItemId  String
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)

  name        String              // "Size", "Toppings", "Dressing"
  description String?
  required    Boolean @default(false)
  minSelect   Int     @default(0)
  maxSelect   Int     @default(1)  // 1 = radio, >1 = checkboxes
  sortOrder   Int     @default(0)

  modifiers   MenuModifier[]
}

model MenuModifier {
  id              String            @id @default(cuid())
  modifierGroupId String
  modifierGroup   MenuModifierGroup @relation(fields: [modifierGroupId], references: [id], onDelete: Cascade)

  name            String             // "Large", "Extra Cheese"
  price           Int    @default(0) // Additional price in cents
  isDefault       Boolean @default(false)
  isAvailable     Boolean @default(true)
  posModifierId   String?            // External POS modifier ID
  sortOrder       Int     @default(0)
  calories        Int?

  orderItemModifiers OrderItemModifier[]
}

// ============================================================
// ORDERS
// ============================================================
model Order {
  id             String     @id @default(cuid())
  restaurantId   String
  restaurant     Restaurant @relation(fields: [restaurantId], references: [id])
  orderNumber    Int        // Sequential per-restaurant, human-readable (#1042)

  status         OrderStatus @default(PENDING)
  source         OrderSource @default(ONLINE)
  fulfillmentType FulfillmentType

  // Customer info
  customerName   String
  customerPhone  String?
  customerEmail  String?
  customerNote   String?   // "No onions please", "Ring doorbell"

  // Delivery-specific
  deliveryAddress    String?
  deliveryAddress2   String?
  deliveryCity       String?
  deliveryState      String?
  deliveryPostalCode String?
  deliveryLat        Float?
  deliveryLng        Float?
  deliveryNote       String?

  // Dine-in specific
  tableNumber    String?

  // Scheduling
  isScheduled    Boolean  @default(false) // false = ASAP
  scheduledFor   DateTime?               // Requested pickup/delivery time
  estimatedReady DateTime?               // Calculated ready time

  // Financials (all in cents)
  subtotal       Int       // Sum of item totals
  taxAmount      Int
  tipAmount      Int       @default(0)
  deliveryFee    Int       @default(0)
  discountAmount Int       @default(0)
  total          Int       // subtotal + tax + tip + deliveryFee - discount

  // Payment
  paymentStatus  PaymentStatus @default(UNPAID)
  paymentMethod  String?       // "card", "cash", etc.
  paymentId      String?       // Stripe PaymentIntent ID or external reference
  paymentData    Json?         // Additional payment metadata

  // POS sync
  posOrderId     String?       // External POS order ID after push
  posSyncStatus  PosSyncStatus @default(NOT_SYNCED)
  posSyncError   String?

  // Timestamps
  placedAt       DateTime  @default(now())
  acceptedAt     DateTime?
  preparingAt    DateTime?
  readyAt        DateTime?
  completedAt    DateTime?
  cancelledAt    DateTime?
  cancelReason   String?

  items          OrderItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([restaurantId, status])
  @@index([restaurantId, placedAt])
  @@index([restaurantId, orderNumber])
}

enum OrderStatus {
  PENDING       // Just placed, awaiting restaurant acknowledgment
  ACCEPTED      // Restaurant confirmed
  PREPARING     // Kitchen is working on it
  READY         // Ready for pickup/delivery
  OUT_FOR_DELIVERY
  COMPLETED     // Picked up / delivered
  CANCELLED
}

enum OrderSource {
  ONLINE        // Placed via storefront or widget
  POS           // Pushed from POS system
  PHONE         // Manually entered by staff
  WALK_IN       // Manually entered by staff
}

enum FulfillmentType {
  PICKUP
  DELIVERY
  DINE_IN
}

enum PaymentStatus {
  UNPAID
  PENDING       // Payment initiated but not confirmed
  PAID
  PARTIALLY_REFUNDED
  REFUNDED
  FAILED
}

enum PosSyncStatus {
  NOT_SYNCED
  SYNCING
  SYNCED
  FAILED
}

model OrderItem {
  id           String   @id @default(cuid())
  orderId      String
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItemId   String
  menuItem     MenuItem @relation(fields: [menuItemId], references: [id])

  name         String   // Snapshot at time of order (menu may change)
  quantity     Int
  unitPrice    Int      // Price per unit in cents at time of order
  totalPrice   Int      // (unitPrice + modifier prices) * quantity
  specialNotes String?

  modifiers    OrderItemModifier[]
}

model OrderItemModifier {
  id           String       @id @default(cuid())
  orderItemId  String
  orderItem    OrderItem    @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  modifierId   String
  modifier     MenuModifier @relation(fields: [modifierId], references: [id])

  name         String       // Snapshot
  price        Int          // Snapshot
}

// ============================================================
// STAFF & AUTH
// ============================================================
model Staff {
  id           String     @id @default(cuid())
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)

  email        String
  name         String
  passwordHash String
  role         StaffRole  @default(STAFF)
  isActive     Boolean    @default(true)
  lastLoginAt  DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([restaurantId, email])
}

enum StaffRole {
  OWNER         // Full access, can delete restaurant
  MANAGER       // All ops, can manage staff
  STAFF         // View/manage orders, no settings access
  KITCHEN       // KDS view only
}
```

### Key Schema Design Notes

**Why prices in cents (Int)?** Floating point math causes rounding errors ($10.10 + $10.20 ≠ $20.30 in IEEE 754). Storing cents as integers is the standard practice in every payment system (Stripe, Square, etc.). The UI formats for display. This is non-negotiable in production fintech.

**Why snapshot names on OrderItem?** A restaurant might rename "Classic Burger" to "Signature Burger" after someone orders. The order record must reflect what the customer actually ordered, not the current menu state.

**Why orderNumber (sequential Int)?** Customers and kitchen staff need to reference "#1042", not "cuid_abc123def". This is a per-restaurant auto-incrementing sequence, managed by a Postgres sequence per restaurant.

---

## 6. The Storefront (Customer Ordering Experience)

### URL Structure
```
https://{domain}/order/{restaurant-slug}
```

This is the link restaurants share everywhere — Google Maps, Instagram bio, printed on receipts, texted to customers. For self-hosters, `{domain}` is whatever domain they deploy to. Each restaurant gets a unique slug (e.g., `joes-pizza-brooklyn`).

### Page Architecture (Next.js App Router)

```
/order/[slug]                    → Menu + ordering page (SSR)
/order/[slug]/status/[orderId]   → Order tracking (live updates via SSE)
```

### SEO & Social Sharing
The ordering page is SSR'd with full meta tags per restaurant:

```html
<title>Order from Joe's Pizza Brooklyn | Pickup & Delivery</title>
<meta name="description" content="Order pizza, pasta, and more from Joe's Pizza...">
<meta property="og:image" content="/order/joes-pizza/opengraph-image">
<meta property="og:title" content="Joe's Pizza Brooklyn — Order Online">
<link rel="canonical" href="https://example.com/order/joes-pizza-brooklyn">
```

The OG image is dynamically generated (Next.js `opengraph-image.tsx`) — it renders the restaurant's logo, cover image, and name as a branded social card. When a restaurant shares their link on Facebook, Instagram, or iMessage, it shows a rich preview.

### Google Maps Integration
Restaurants add their ordering URL as the "Order" link in their Google Business Profile. Google explicitly supports this — there's a field for online ordering URLs. The SSR page with proper schema.org markup (`Restaurant`, `Menu`, `FoodEstablishment`) helps Google understand the page.

### Menu UI Requirements

The customer-facing menu must support:

| Feature | Implementation |
|---------|---------------|
| **Categories** | Sticky horizontal scroll tabs (like DoorDash). Tap to jump-scroll to section. |
| **Item images** | Lazy-loaded, responsive (srcset for 1x/2x/3x), with blur-up placeholder. WebP with JPEG fallback. |
| **Prices** | Displayed in restaurant's currency with locale-aware formatting (`Intl.NumberFormat`). |
| **Descriptions** | Truncated with "read more" expand. Max 2 lines in grid view. |
| **Ingredients** | Shown on item detail sheet/modal. Searchable for allergen filtering. |
| **Allergens** | Icon badges on item cards (🌾 gluten, 🥜 nuts, 🥛 dairy, etc.). Filterable. |
| **Tags** | Badges: "Popular", "New", "Spicy 🌶️", "Vegetarian 🌱". "Popular" auto-calculated from order frequency. |
| **Favorites** | Heart icon on items. Persisted in localStorage (no account needed). Favorites section at top of menu if any exist. |
| **Quantities** | +/- stepper on each item in cart. Min 1, max per item's `maxQuantity`. |
| **Modifiers** | Sheet/modal with radio groups (single select) and checkbox groups (multi select). Visually show required vs optional. Price adjustments shown inline. |
| **Availability** | Unavailable items shown grayed out with "Sold Out" badge. Not hidden — customers should see what they're missing. |
| **Taxes** | Calculated per order, shown as line item in cart. Rate from restaurant config. |
| **Tips** | Preset buttons (10%, 15%, 20%, 25%) + custom amount. Shown after subtotal in checkout. |
| **Scheduled orders** | Toggle between "ASAP" and "Schedule for later" with date/time picker respecting operating hours. |

### UI Standard
The storefront must be visually competitive with DoorDash, Uber Eats, and Sweetgreen's native apps. This means:

- **Design system:** Built on Radix UI primitives + Tailwind CSS. Custom design tokens derived from the restaurant's `brandColor` — the entire storefront adapts to the restaurant's brand.
- **Motion:** Subtle, purposeful animations (Framer Motion). Cart drawer slides, item modals scale, quantity steppers bounce.
- **Mobile-first:** 70%+ of restaurant ordering traffic is mobile. The storefront is designed for phones first, then scales up to desktop.
- **Performance:** Core Web Vitals targets: LCP < 1.5s, FID < 50ms, CLS < 0.05. Image optimization is critical — Next.js `<Image>` with automatic WebP, lazy loading, and blur placeholders.
- **Accessibility:** WCAG 2.1 AA. Full keyboard navigation, screen reader support, focus management in modals, sufficient color contrast. This is both ethically correct and legally required in many jurisdictions.

---

## 7. The Embeddable Widget & SDK

### Integration Methods (from simplest to most flexible)

#### Method 1: Direct Link (Zero Code)
```
https://your-openorder-instance.com/order/joes-pizza
```
Shared as a URL. No integration needed. This is what goes on Google Maps.

#### Method 2: Button Embed (One Line)
```html
<a href="https://your-instance.com/order/joes-pizza"
   style="background:#FF4500;color:white;padding:12px 24px;border-radius:8px;
          text-decoration:none;font-family:system-ui;font-weight:600">
  Order Online
</a>
```
A styled link. Works everywhere, including Squarespace, Wix, WordPress.

#### Method 3: iframe Embed (Two Lines)
```html
<iframe src="https://your-instance.com/order/joes-pizza?embed=true"
        style="width:100%;min-height:700px;border:none;"
        allow="payment" title="Order from Joe's Pizza">
</iframe>
```
The storefront detects the `?embed=true` param and hides the header/footer, rendering only the menu and cart. The iframe resizes dynamically via `postMessage`.

#### Method 4: Web Component Embed (Recommended for Modern Sites)
```html
<script src="https://your-instance.com/widget/openorder.js" defer></script>
<open-order restaurant="joes-pizza" theme="auto"></open-order>
```
This is the premium embed experience. The `openorder.js` script registers a `<open-order>` Web Component that:

1. Creates a Shadow DOM (style isolation — the restaurant's site CSS can't break it)
2. Mounts a lightweight React app inside the shadow root
3. Fetches the menu from the API and renders the full ordering experience
4. Handles checkout via Stripe Elements (rendered within the shadow root)
5. Communicates with the host page via Custom Events:
   ```javascript
   document.querySelector('open-order')
     .addEventListener('order:placed', (e) => {
       console.log('Order placed!', e.detail.orderId);
       // Track in analytics, show confirmation, etc.
     });
   ```

**Attributes:**
| Attribute | Description | Default |
|-----------|-------------|---------|
| `restaurant` | Restaurant slug | (required) |
| `theme` | `"light"`, `"dark"`, or `"auto"` (follows system) | `"auto"` |
| `accent-color` | Override brand color | Restaurant's brandColor |
| `compact` | `"true"` for minimal height | `"false"` |
| `lang` | Language override | Restaurant's locale |

### Why NOT a Full SDK?

An SDK (npm package with React components) adds complexity for the restaurant with minimal benefit. The restaurant owner isn't a developer — they need copy-paste HTML, not `npm install`. The Web Component IS the SDK. Developers who want deeper integration can listen to Custom Events and call the REST API directly. No npm package needed.

The only scenario where a JS SDK package would make sense is if third-party developers are building apps on top of OpenOrder (e.g., a loyalty program that reads order history). That's a v3 concern. For now, the REST API is the developer interface.

---

## 8. The Restaurant Dashboard

### Design System
The dashboard uses the same **Radix + Tailwind** foundation as the storefront but with a dashboard-specific design language:

- **Component library:** shadcn/ui as the base (it's the 2026 standard for app UIs — accessible, composable, customizable). We vendor it into our `packages/ui` and extend/modify components as needed.
- **Data tables:** TanStack Table for sortable, filterable order lists.
- **Charts:** Recharts for analytics (lightweight, composable, React-native).
- **Forms:** React Hook Form + Zod validation (same Zod schemas shared with API for end-to-end type safety).
- **Real-time:** Socket.IO client for live order updates. New orders trigger a sound notification + toast.

### Key Screens

| Screen | Priority | Description |
|--------|----------|-------------|
| **Orders** | P0 | Real-time order queue. Cards with status columns (Kanban-style): Pending → Preparing → Ready → Completed. Drag or tap to advance. Sound alert on new order. Filter by status, date, source. |
| **Kitchen Display (KDS)** | P0 | Full-screen mode optimized for kitchen tablets. Large fonts, high contrast, no chrome. Shows active orders as cards with item lists. Tap to mark items done. Auto-advances when all items done. Timer shows elapsed time per order (turns yellow at prep time, red at 2x). |
| **Menu Editor** | P0 | WYSIWYG-style editor. Drag to reorder categories and items. Inline editing of names, prices, descriptions. Image upload with crop/preview. Toggle availability per item. Modifier group builder. |
| **Settings: General** | P0 | Restaurant name, address, hours, branding, fulfillment options. |
| **Settings: POS** | P1 | Select POS type, enter API key or complete OAuth flow, configure webhook URLs, test connection. |
| **Settings: Payments** | P0 | Stripe Connect onboarding button, or toggle to BYO Stripe keys. Shows payment status and recent payouts. |
| **Settings: Ordering Page** | P1 | Preview of storefront. Copy shareable link. Copy embed code (with preview). Custom CSS editor. |
| **Analytics** | P2 | Revenue over time, orders by day/hour, popular items, average order value, fulfillment type breakdown. |

### Onboarding Flow (First-Time Setup)
The dashboard guides new restaurants through setup with a step-by-step wizard:

1. **Restaurant basics** — Name, address, phone, operating hours
2. **Menu** — Add first category and 3+ items (we provide templates: "Pizza Shop", "Coffee Shop", "General")
3. **Branding** — Upload logo, set brand color, preview storefront
4. **Payments** — "Set up Stripe" button that launches Connect onboarding OR "I'll use my own" toggle
5. **Go live** — Shows the shareable link + embed code. Big "You're live!" celebration screen.

The entire flow should take under 10 minutes. This is the key UX differentiator — DoorDash onboarding takes weeks. OpenOrder takes minutes.

---

## 9. POS Integration Layer

### Adapter Interface

```typescript
// packages/pos-adapters/src/types.ts

interface IPosAdapter {
  readonly type: PosType;

  // Connection
  testConnection(config: PosConfig): Promise<{ success: boolean; error?: string }>;

  // Menu sync (POS → OpenOrder)
  pullMenu(config: PosConfig): Promise<PosMenu>;

  // Order push (OpenOrder → POS)
  pushOrder(config: PosConfig, order: NormalizedOrder): Promise<{ posOrderId: string }>;

  // Order status (POS → OpenOrder, via webhook handler)
  parseWebhook(headers: Record<string, string>, body: unknown): Promise<PosWebhookEvent | null>;

  // Inventory updates
  parseStockUpdate(headers: Record<string, string>, body: unknown): Promise<PosStockEvent | null>;

  // Optional: OAuth flow support
  getOAuthUrl?(redirectUri: string, state: string): string;
  handleOAuthCallback?(code: string, state: string): Promise<PosConfig>;
}

interface PosMenu {
  categories: Array<{
    externalId: string;
    name: string;
    items: Array<{
      externalId: string;
      name: string;
      description?: string;
      price: number; // In cents
      imageUrl?: string;
      modifierGroups?: Array<{
        externalId: string;
        name: string;
        required: boolean;
        minSelect: number;
        maxSelect: number;
        modifiers: Array<{
          externalId: string;
          name: string;
          price: number;
        }>;
      }>;
    }>;
  }>;
}

interface NormalizedOrder {
  externalId: string; // OpenOrder's order ID
  orderNumber: number;
  items: Array<{
    posItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    modifiers: Array<{ posModifierId: string; name: string; price: number }>;
    specialNotes?: string;
  }>;
  fulfillmentType: 'pickup' | 'delivery' | 'dine_in';
  customerName: string;
  customerPhone?: string;
  scheduledFor?: Date;
  specialInstructions?: string;
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  total: number;
}

type PosWebhookEvent =
  | { type: 'order.accepted'; posOrderId: string }
  | { type: 'order.preparing'; posOrderId: string }
  | { type: 'order.ready'; posOrderId: string }
  | { type: 'order.completed'; posOrderId: string }
  | { type: 'order.cancelled'; posOrderId: string; reason?: string };

type PosStockEvent = {
  items: Array<{
    posItemId: string;
    isAvailable: boolean;
    stockCount?: number;
  }>;
};
```

### Generic Webhook Adapter

For POS systems without a dedicated adapter, the restaurant configures:

1. **Outbound webhook URL** — OpenOrder sends order data here when an order is placed
2. **Inbound webhook secret** — A shared secret for authenticating callbacks from the POS
3. **Mapping table** (optional) — Maps OpenOrder item IDs to POS item IDs

The generic adapter publishes a documented webhook contract:

```
POST {restaurant's outbound URL}
Headers:
  Content-Type: application/json
  X-OpenOrder-Signature: sha256={HMAC of body with shared secret}
  X-OpenOrder-Event: order.created
  X-OpenOrder-Delivery-Id: {unique delivery ID for idempotency}

Body: NormalizedOrder (see interface above)
```

The restaurant's POS (or middleware) sends status updates back:

```
POST https://{openorder-instance}/api/webhooks/pos/{restaurantId}
Headers:
  X-Webhook-Secret: {restaurant's inbound secret}

Body: PosWebhookEvent (see interface above)
```

This is intentionally simple. A competent developer can integrate any POS in a few hours.

---

## 10. Payment Architecture

### Adapter Interface

```typescript
// packages/payment-adapters/src/types.ts

interface IPaymentAdapter {
  readonly type: PaymentType;

  // Create a payment intent / session
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;

  // For webhook-based status updates from payment providers
  parseWebhook(headers: Record<string, string>, body: unknown): Promise<PaymentWebhookEvent | null>;

  // Refund
  refund(paymentId: string, amountCents?: number): Promise<RefundResult>;

  // Optional: Setup / onboarding
  createOnboardingLink?(restaurantId: string, returnUrl: string): Promise<string>;
  handleOnboardingCallback?(params: Record<string, string>): Promise<{ stripeAccountId: string }>;
}

interface CreatePaymentParams {
  amountCents: number;
  currency: string;
  restaurantId: string;
  orderId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

interface PaymentResult {
  paymentId: string;           // Provider's payment ID
  clientSecret?: string;       // For Stripe Elements frontend confirmation
  status: 'requires_action' | 'pending' | 'succeeded' | 'failed';
  checkoutUrl?: string;        // For redirect-based payment flows
}
```

### Stripe Connect Flow (Default — Direct Charges)

```
1. Restaurant Setup:
   Dashboard → Settings → Payments → "Connect with Stripe"
     → Redirects to Stripe Express onboarding
     → Stripe creates connected account
     → Redirect back, save stripe_account_id

2. Customer Checkout:
   Storefront → Customer clicks "Place Order"
     → API: POST /api/orders (creates order, status=PENDING)
     → API: POST /api/payments/create-intent
       → Stripe: Create PaymentIntent ON the connected account (direct charge)
       → Returns client_secret to storefront
     → Storefront: stripe.confirmCardPayment(clientSecret) via Stripe Elements
       → Card collected in Stripe Elements iframe (PCI compliant, we never see card data)
     → Stripe webhook (payment_intent.succeeded) → API marks order as PAID
     → BullMQ job: push order to POS, notify restaurant dashboard via WebSocket

3. Money Flow:
   Customer pays $25.00
     → Stripe processes on restaurant's connected account
     → Stripe takes 2.9% + $0.30 = $1.03
     → Restaurant receives $23.97 in their Stripe balance
     → Platform fee: $0.00 by default (configurable)
     → Restaurant sets their own payout schedule in Stripe
```

### BYO Stripe Keys (Option B1)

```
1. Restaurant Setup:
   Dashboard → Settings → Payments → "Use my own Stripe account"
     → Restaurant pastes their Stripe Publishable Key + Secret Key
     → Keys encrypted at rest and stored in paymentConfig

2. Customer Checkout:
   Same flow, but PaymentIntents are created using the restaurant's own keys
   instead of on a connected account.

3. Money Flow:
   Goes directly to restaurant's Stripe account. Platform is not involved.
```

### Webhook Payment (Option B2)

```
1. Restaurant Setup:
   Dashboard → Settings → Payments → "Use external payment"
     → Restaurant configures their payment webhook URL
     → Selects "Payment collected externally" mode

2. Customer Checkout:
   Storefront → Customer places order
     → Order created with paymentStatus=PENDING
     → Webhook fired to restaurant's payment URL with order total
     → Restaurant's system processes payment however they want
     → Restaurant's system calls:
         POST /api/webhooks/payment/{restaurantId}
         { "orderId": "...", "status": "paid", "externalPaymentId": "..." }
     → Order marked as PAID

Note: This mode is best for in-person/phone orders where the
restaurant collects payment through their POS terminal. For online
ordering, this creates a clunky UX (customer doesn't know when
payment is confirmed). We should warn about this in the UI.
```

---

## 11. Self-Hosting & Deployment

### The Self-Hoster's Experience

```bash
# 1. Clone the repo
git clone https://github.com/openorder/openorder.git
cd openorder

# 2. Run the setup wizard (generates .env from prompts)
npx openorder init
# Prompts:
#   - Restaurant name? (can be changed later)
#   - Domain name? (e.g., orders.joespizza.com)
#   - Stripe secret key? (or skip for later setup in dashboard)
#   - Admin email + password?

# 3. Start everything
docker compose up -d

# That's it. Visit http://localhost:3000/dashboard to configure.
```

### What `docker compose up` Does

```yaml
# docker/docker-compose.yml (simplified)
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: openorder
      POSTGRES_USER: ${DB_USER:-openorder}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-openorder}"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  api:
    image: ghcr.io/openorder/api:latest  # Or build from source
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_started }
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/openorder
      REDIS_URL: redis://redis:6379
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      # ... other env vars
    # CRITICAL: Migrations run automatically on startup
    command: >
      sh -c "npx prisma migrate deploy && node dist/server.js"

  storefront:
    image: ghcr.io/openorder/storefront:latest
    depends_on: [api]
    environment:
      API_URL: http://api:4000
      NEXT_PUBLIC_API_URL: ${PUBLIC_URL}/api

  dashboard:
    image: ghcr.io/openorder/dashboard:latest
    depends_on: [api]

  # Reverse proxy — routes /api to api, /order to storefront, /dashboard to dashboard
  nginx:
    image: nginx:alpine
    ports:
      - "${PORT:-80}:80"
      - "${SSL_PORT:-443}:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro  # Optional SSL
    depends_on: [api, storefront, dashboard]

  # File storage (optional, for self-hosters who want S3-compatible storage)
  # minio:
  #   image: minio/minio
  #   command: server /data --console-address ":9001"
  #   volumes:
  #     - miniodata:/data

volumes:
  pgdata:
  redisdata:
```

### How Database Setup Works (Answering the Self-Hosting Question)

This is a key concern you raised. Here's the complete picture:

**The self-hoster NEVER touches the database directly.** They don't create tables, run SQL, or manage schemas. Here's why:

1. **Prisma manages the schema.** The `prisma/schema.prisma` file defines every table, column, index, and relation. Prisma generates SQL migration files from this schema.

2. **Migrations run on container startup.** The API container's entrypoint is:
   ```
   npx prisma migrate deploy && node dist/server.js
   ```
   `prisma migrate deploy` checks the `_prisma_migrations` table in Postgres to see which migrations have already been applied, then runs any new ones. It's idempotent — running it twice is safe.

3. **Upgrades are automatic.** When the self-hoster pulls a new version (`docker compose pull && docker compose up -d`), the new API image contains new migrations. On startup, they're automatically applied. The self-hoster doesn't even know it happened.

4. **The database is just a Docker volume.** Postgres data lives in a Docker volume (`pgdata`). It persists across container restarts and upgrades. The self-hoster can back it up with `docker exec postgres pg_dump`.

**What if they want to use an external database?** (e.g., AWS RDS, Supabase, Neon)
They set `DATABASE_URL` in their `.env` to point to their external Postgres. The Docker Compose file's `postgres` service is simply not used. Migrations still run automatically on API startup.

**What if they want to use a managed platform instead of Docker?**
We'll provide deployment guides for:
- Railway (one-click deploy)
- Render
- Fly.io
- DigitalOcean App Platform
- AWS ECS/Fargate (for enterprise)

Each guide covers how to set up the managed Postgres, Redis, and environment variables for that platform.

### The `npx openorder init` CLI

This is a small Node.js script (published to npm as `@openorder/cli`) that:

1. Checks for Docker and Docker Compose
2. Prompts for configuration (domain, Stripe keys, admin credentials)
3. Generates a `.env` file from the template
4. Generates an `APP_SECRET` (for JWT signing, encryption)
5. Optionally generates self-signed SSL certs for local dev
6. Prints "Run `docker compose up -d` to start"

It's intentionally minimal. No daemon, no background process, no magic. It generates a `.env` file and that's it.

---

## 12. API Design

### REST API (not GraphQL, not tRPC)

**Why REST?**
- The generic webhook system and POS adapters need a stable, documented HTTP contract. REST is universally understood.
- The embeddable widget fetches data over HTTP from potentially a different domain (CORS). REST is the simplest here.
- GraphQL adds a query planning layer that's unnecessary for our well-defined, bounded data needs. It also makes the webhook adapter contract harder to document.
- tRPC requires both client and server to be TypeScript. Our webhook consumers might be Python, Go, PHP, etc.
- REST with OpenAPI spec generation (from Fastify's JSON Schema validation) gives us auto-generated docs.

### Key Endpoints

```
# Public (no auth) — used by storefront and widget
GET    /api/restaurants/:slug              # Restaurant info + branding
GET    /api/restaurants/:slug/menu         # Full menu with categories, items, modifiers
GET    /api/restaurants/:slug/hours        # Operating hours + current open/closed status
POST   /api/restaurants/:slug/orders       # Place an order
GET    /api/orders/:orderId/status         # Order status (also available via SSE)
GET    /api/orders/:orderId/status/stream  # SSE stream for live order status

# Payment
POST   /api/payments/create-intent         # Create Stripe PaymentIntent
POST   /api/webhooks/stripe                # Stripe webhook receiver
POST   /api/webhooks/payment/:restaurantId # Generic payment webhook (B2)

# POS webhooks (inbound from POS providers)
POST   /api/webhooks/pos/square            # Square webhook receiver
POST   /api/webhooks/pos/toast             # Toast webhook receiver
POST   /api/webhooks/pos/clover            # Clover webhook receiver
POST   /api/webhooks/pos/:restaurantId     # Generic POS webhook receiver

# Dashboard (requires auth)
GET    /api/dashboard/orders               # List orders (paginated, filterable)
PATCH  /api/dashboard/orders/:id/status    # Update order status
GET    /api/dashboard/orders/:id           # Order detail

GET    /api/dashboard/menu                 # Full menu for editing
POST   /api/dashboard/menu/categories      # Create category
PATCH  /api/dashboard/menu/categories/:id  # Update category
DELETE /api/dashboard/menu/categories/:id  # Delete category
POST   /api/dashboard/menu/items           # Create menu item
PATCH  /api/dashboard/menu/items/:id       # Update menu item
DELETE /api/dashboard/menu/items/:id       # Delete menu item
POST   /api/dashboard/menu/items/:id/image # Upload item image
PATCH  /api/dashboard/menu/reorder         # Bulk reorder items/categories

GET    /api/dashboard/settings             # Restaurant settings
PATCH  /api/dashboard/settings             # Update settings
POST   /api/dashboard/settings/pos/test    # Test POS connection
POST   /api/dashboard/settings/pos/sync    # Trigger menu sync from POS

GET    /api/dashboard/analytics            # Sales data (date range)

# Auth
POST   /api/auth/login                     # Email + password → JWT
POST   /api/auth/refresh                   # Refresh JWT
POST   /api/auth/logout                    # Invalidate refresh token
```

### Real-Time (WebSocket + SSE)

| Use Case | Transport | Why |
|----------|-----------|-----|
| **Dashboard order updates** | WebSocket (Socket.IO) | Bi-directional needed (dashboard also sends acknowledgments). Persistent connection is fine for authenticated staff on dashboard. |
| **KDS order updates** | WebSocket (Socket.IO) | Same as dashboard — persistent connection, bi-directional. |
| **Customer order status** | Server-Sent Events (SSE) | Unidirectional (server → customer). SSE is simpler than WebSocket, works through more proxies, auto-reconnects, and doesn't require a persistent connection library on the client. Customer just needs to know when their order status changes. |

---

## 13. Security Model

### Authentication
- **Restaurant staff:** Email + password → JWT (access token: 15min, refresh token: 7d stored in httpOnly cookie). Passwords hashed with Argon2id.
- **Customers:** No account required. Order tracking uses a signed, non-guessable order URL (`/order/slug/status/{orderId}?token={HMAC}`).
- **API keys (POS/webhooks):** HMAC-SHA256 signed. Secrets encrypted at rest with AES-256-GCM using an `APP_SECRET` derived key.

### Authorization
- RBAC with 4 roles (Owner > Manager > Staff > Kitchen). Enforced at API route level via Fastify decorators.
- POS adapter configs are only accessible to Owner and Manager roles.
- Settings mutations require Manager+ role.

### Sensitive Data
- POS API keys, OAuth tokens, and Stripe keys are encrypted at rest in the `posConfig` and `paymentConfig` JSONB columns using AES-256-GCM with a key derived from `APP_SECRET`.
- `APP_SECRET` is generated during `npx openorder init` and stored in `.env` (never committed to git).
- Credit card data is never handled by OpenOrder — Stripe Elements collects it directly in Stripe's iframe.

### Webhook Verification
- **Stripe webhooks:** Verified using `stripe.webhooks.constructEvent()` with the webhook signing secret.
- **Square webhooks:** Verified using HMAC-SHA256 signature in the `x-square-hmacsha256-signature` header.
- **Clover webhooks:** Verified using HMAC-SHA256 signature.
- **Generic inbound webhooks:** Verified using a shared secret in the `X-Webhook-Secret` header.
- **Generic outbound webhooks:** Signed with HMAC-SHA256. Recipient can verify.

### Rate Limiting
- Public API: 60 requests/minute per IP (configurable).
- Order placement: 5 orders/minute per IP (prevent spam orders).
- Dashboard API: 300 requests/minute per authenticated user.
- Implemented via `@fastify/rate-limit` backed by Redis.

---

## 14. Testing Strategy

| Layer | Tool | What's Tested |
|-------|------|---------------|
| **Unit** | Vitest | Pure functions: price calculations, tax computation, adapter parsing, Zod schema validation, order total calculation. No I/O. |
| **Integration** | Vitest + Testcontainers | API routes against a real Postgres (via Testcontainers). POS adapters against mock HTTP servers. Payment flow against Stripe test mode. |
| **E2E** | Playwright | Full ordering flow: browse menu → add to cart → checkout → order appears in dashboard → advance to completed. Runs against Docker Compose stack. |
| **Visual Regression** | Playwright screenshots + Percy (or Argos) | Storefront menu rendering, dashboard order cards, KDS layout. Catches unintended UI changes. |
| **Load** | k6 | Order placement throughput under load. Target: 100 concurrent orders per restaurant without degradation. |

### CI Pipeline (GitHub Actions)
```
PR opened/updated:
  → Lint (ESLint + Prettier)
  → Type check (tsc --noEmit across all packages)
  → Unit tests (Vitest)
  → Integration tests (Vitest + Testcontainers)
  → Build all apps
  → E2E tests (Playwright against Docker Compose)

Merge to main:
  → All above +
  → Build and push Docker images to GHCR
  → Deploy docs to GitHub Pages
```

---

## 15. Phased Build Plan

### Phase 0: Foundation (Weeks 1–2)
**Goal:** Monorepo scaffolding, database, and basic auth.

- [ ] Initialize Turborepo with all apps and packages
- [ ] Prisma schema + initial migration
- [ ] Fastify API server with health check, CORS, rate limiting
- [ ] Auth module (login, JWT, refresh, RBAC middleware)
- [ ] Docker Compose for local dev (Postgres + Redis + hot reload)
- [ ] CI pipeline (lint, type check, unit tests)
- [ ] `packages/shared-types` with core TypeScript interfaces
- [ ] `packages/ui` with Tailwind config, design tokens, base components (Button, Input, Card, Dialog)

**Exit criteria:** `docker compose up` starts API + Postgres + Redis. Can create a restaurant and log in via API.

### Phase 1: Menu & Storefront (Weeks 3–5)
**Goal:** A restaurant can build a menu and customers can browse it.

- [ ] Menu CRUD API (categories, items, modifiers, image upload)
- [ ] Dashboard: Menu editor (drag-to-reorder, inline edit, image upload, modifier builder)
- [ ] Dashboard: Restaurant settings (name, address, hours, branding)
- [ ] Storefront: SSR ordering page at `/order/:slug`
- [ ] Storefront: Full menu UI (categories, items with images, descriptions, ingredients, tags, allergens, favorites)
- [ ] Storefront: Item detail modal with modifier selection
- [ ] Storefront: Cart (add/remove items, quantity stepper, notes)
- [ ] Storefront: Operating hours display + "closed" state
- [ ] SEO: Dynamic meta tags, OG images, schema.org markup
- [ ] Media module: Image upload, resize, serve via API

**Exit criteria:** A restaurant can create a menu with images and a customer can browse it at a shareable URL. Cart works but checkout doesn't yet.

### Phase 2: Ordering & Payments (Weeks 6–8)
**Goal:** End-to-end ordering with Stripe Connect.

- [ ] Order placement API (validate menu items, calculate totals, tax, create order)
- [ ] Stripe Connect onboarding flow in dashboard settings
- [ ] Stripe Connect direct charge payment adapter
- [ ] Storefront: Checkout flow (customer info, fulfillment type, tip selection, Stripe Elements)
- [ ] Storefront: Order confirmation page
- [ ] Storefront: Order status page with SSE live updates
- [ ] Dashboard: Real-time order queue (WebSocket) with sound notifications
- [ ] Dashboard: Order status management (accept, preparing, ready, complete, cancel)
- [ ] BullMQ worker: Order notification jobs
- [ ] Scheduled orders (date/time picker, validation against hours)
- [ ] Email notifications: Order confirmation, status updates (via configurable SMTP or service like Resend/Postmark)
- [ ] Order number sequence (per-restaurant auto-increment)

**Exit criteria:** Complete ordering flow from menu browse → checkout → payment → restaurant sees order → marks complete → customer sees status update. Money lands in restaurant's Stripe account.

### Phase 3: Kitchen Display & Polish (Weeks 9–10)
**Goal:** KDS for tablets, UI polish, production readiness.

- [ ] Dashboard: Kitchen Display System (KDS) — full-screen mode, large text, tap-to-advance, elapsed time indicators
- [ ] Dashboard: Onboarding wizard for new restaurants
- [ ] Storefront: Mobile UI polish pass (touch targets, gestures, performance)
- [ ] Storefront: Allergen filtering
- [ ] Widget: Web Component embed (`<open-order>`)
- [ ] Widget: iframe embed mode
- [ ] Widget: Rollup build pipeline → single JS file
- [ ] Dashboard: Shareable link + embed code copy (with live preview)
- [ ] `npx @openorder/cli init` setup wizard
- [ ] Docker production build (multi-stage, optimized images)
- [ ] Documentation: Self-hosting guide, embedding guide
- [ ] E2E test suite (Playwright)
- [ ] Security audit: OWASP top 10 review, penetration testing

**Exit criteria:** A non-technical restaurant owner can set up OpenOrder in <10 minutes using Docker. KDS works on an iPad. Widget embeds on any site. Ready for public beta.

### Phase 4: POS Integration (Weeks 11–14)
**Goal:** BYO POS support.

- [ ] POS adapter interface + adapter registry
- [ ] Square adapter (OAuth, menu pull, order push, webhooks)
- [ ] Toast adapter (API key auth, menu sync, order push, webhooks)
- [ ] Clover adapter (OAuth, menu sync, order push, webhooks)
- [ ] Generic webhook adapter (outbound + inbound)
- [ ] Dashboard: POS settings UI (select type, enter credentials, test connection)
- [ ] Dashboard: Menu sync UI ("Sync from POS" button, conflict resolution)
- [ ] Two-way inventory sync (86'd items in POS → marked unavailable in OpenOrder)
- [ ] BullMQ workers: POS sync jobs with retry + dead letter queue
- [ ] Documentation: POS integration guide per provider
- [ ] Integration tests against POS sandbox environments

**Exit criteria:** A restaurant using Square can connect their POS, sync their menu, and have online orders automatically appear in Square.

### Phase 5: BYO Payments & Advanced Features (Weeks 15–18)
**Goal:** Payment flexibility and operational features.

- [ ] BYO Stripe keys payment adapter (B1)
- [ ] Generic webhook payment adapter (B2) with dashboard UI
- [ ] Payment adapter selection UI in settings
- [ ] Multi-location support (one owner account, multiple restaurants)
- [ ] Order throttling (max orders per time window, auto-pause)
- [ ] Analytics dashboard (revenue, orders, popular items, peak hours)
- [ ] Refund support (full + partial, through payment adapter)
- [ ] Receipt printing via ESC/POS over network (or browser print)
- [ ] SMS notifications (via Twilio or configurable provider)
- [ ] Dashboard: Staff management (invite, roles, deactivate)

**Exit criteria:** Full payment flexibility. Restaurants can bring their own Stripe account or use external payment. Analytics provide actionable insights.

---

## 16. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Toast API access requires partner approval** | High | Medium | Apply early (weeks 1-2). Build Square adapter first — it has open developer access. Toast adapter is Phase 4; approval should come through by then. |
| **POS menu schemas are wildly different** | High | High | The `PosMenu` normalized interface is the abstraction boundary. Each adapter handles translation. Accept that some POS features won't map 1:1 — document limitations per adapter. |
| **Self-hosters misconfigure and blame the project** | High | Medium | Invest heavily in the `npx openorder init` wizard, error messages, and docs. Health check endpoint that validates config. Dashboard shows warnings for misconfigurations. |
| **Stripe Connect onboarding abandonment** | Medium | High | Stripe Express onboarding is streamlined (~5 min). Provide clear instructions in the wizard. Allow restaurants to skip payments during setup and add later. |
| **Web Component CSS conflicts** | Low | Medium | Shadow DOM provides isolation. Test embed on the top 10 website builders (WordPress, Squarespace, Wix, Shopify, etc.). Provide iframe fallback. |
| **Scope creep into consumer marketplace** | Medium | High | Explicitly not building a consumer discovery app. Every feature must serve the restaurant operator or their direct customers. Say no to "browse all restaurants" features. |
| **AGPL scares away contributors** | Low | Medium | AGPL is well-understood in 2026. GitLab, Discourse, Mastodon all use it. Provide a clear CLA for contributions. Enterprise users who don't want AGPL can negotiate a commercial license (future monetization option). |

---

## Summary of Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| License | AGPL-3.0 | Protects community, allows commercial self-hosting |
| Payment default | Stripe Connect (direct charges) | Restaurant is merchant of record, zero platform fee |
| Payment flexibility | Adapter interface for BYO Stripe + webhook payments | No vendor lock-in |
| POS integration | Adapter pattern + generic webhook escape hatch | Covers Big 3 + everything else |
| Embed strategy | Web Component (Shadow DOM) + iframe fallback | Works on any site, style-isolated |
| Storefront | Next.js SSR | SEO for Google Maps, social sharing |
| Dashboard | React + Vite SPA | Fast, no SSR needed for authenticated UI |
| Database | PostgreSQL + Prisma | Type-safe, auto-migrating, self-hoster friendly |
| Real-time | Socket.IO (dashboard) + SSE (customer status) | Right tool for each job |
| Queue | BullMQ (Redis) | Reliable webhook delivery, retry logic |
| Self-hosting | Docker Compose + CLI setup wizard | One command to run everything |
| SDK | No npm SDK — Web Component IS the SDK | Simplest path for restaurant owners |
| Design system | Radix + Tailwind + shadcn/ui base | 2026 standard, accessible, composable |
| Monorepo | Turborepo | Shared types, single CI, coordinated releases |
