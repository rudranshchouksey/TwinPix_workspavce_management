# Architecture Decision Records (ADR)

This document records the architectural decisions made during the development of TwinPix Workspace.

---

## ADR 1: Next.js App Router & Server Actions
**Status**: Accepted
**Context**: We needed a framework capable of high SEO performance, fast page loads, and seamless full-stack integration without managing a separate backend repository.
**Decision**: We chose Next.js 16 using the App Router architecture.
**Consequences**: 
- We gain Server Components (RSC) leading to massive client-side bundle size reductions.
- We utilize Server Actions, entirely removing the need to write traditional REST API routes (`/api/...`), ensuring end-to-end type safety.
- Requires developers to strictly understand the boundary between Server and Client (`"use client"`).

---

## ADR 2: Prisma ORM
**Status**: Accepted
**Context**: We need a type-safe way to interact with a complex PostgreSQL schema containing dozens of relational models.
**Decision**: Adopt Prisma as the primary ORM.
**Consequences**:
- Developers get best-in-class autocomplete and type inference in TypeScript.
- Migrations are handled cleanly via `prisma migrate`.
- Trade-off: Slightly higher memory footprint in serverless functions compared to raw SQL drivers (like `pg`), but acceptable given the developer experience (DX) boost.

---

## ADR 3: Neon (Serverless PostgreSQL)
**Status**: Accepted
**Context**: Hosting a traditional PostgreSQL database requires managing scaling, connection limits, and hardware provisioning.
**Decision**: Use Neon.tech for database hosting.
**Consequences**:
- Database computes scale to zero when inactive, saving costs during staging.
- Built-in PgBouncer pooling prevents Vercel serverless functions from exhausting database connections during traffic spikes.
- Enables immediate database branching, allowing developers to test migrations on a clone of production data safely.

---

## ADR 4: Cloudinary for Asset Storage
**Status**: Accepted
**Context**: The platform requires storing user avatars, campaign briefs, and influencer media files securely and serving them globally fast.
**Decision**: Use Cloudinary instead of raw AWS S3 buckets.
**Consequences**:
- Cloudinary provides an automatic CDN edge-caching layer.
- Built-in on-the-fly image transformations (resizing, cropping, format optimization) drastically reduce bandwidth costs without needing server-side image processing libraries (like `sharp`).

---

## ADR 5: Apify for Instagram Syncing
**Status**: Accepted
**Context**: We need to pull public metrics (followers, posts, reels) from Instagram without relying on the restrictive and frequently changing official Meta Graph API.
**Decision**: Integrate Apify as a scraping layer.
**Consequences**:
- Bypasses Instagram's aggressive anti-scraping walls using Apify's residential proxies and headless browsers.
- Trade-off: Scraping is slow (10-30s). We must handle timeouts carefully in Vercel Serverless environments.

---

## ADR 6: OpenAI for Copilot & AI Insights
**Status**: Accepted
**Context**: The workspace requires features like "Brand Safety Analysis", "Influencer SWOT", and automated outreach generation.
**Decision**: Integrate OpenAI's `gpt-4o-mini` API.
**Consequences**:
- Rapid implementation of complex NLP tasks without needing to train custom ML models.
- `gpt-4o-mini` provides the best balance of speed, cost, and contextual reasoning for textual analysis.
