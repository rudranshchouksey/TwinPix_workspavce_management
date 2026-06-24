# Architecture Documentation

TwinPix Workspace is built using a modern, server-first architecture powered by the Next.js App Router. This document provides a high-level overview of the system, data flows, and external integrations.

---

## High-Level Architecture Diagram

```mermaid
graph TD
    Client[Web Browser / Client]
    
    subgraph Vercel[Next.js Application on Vercel]
        UI[React Server & Client Components]
        SA[Server Actions]
        Auth[Auth.js / NextAuth]
    end
    
    subgraph Infrastructure
        DB[(Neon PostgreSQL Database)]
        Prisma[Prisma ORM]
    end
    
    subgraph ExternalServices[External Services]
        Apify[Apify Instagram Scraper]
        Cloudinary[Cloudinary CDN]
        OpenAI[OpenAI Copilot]
    end
    
    Client <-->|HTTP / React Server payload| UI
    UI -->|Invoke| SA
    SA -->|Query / Mutate| Prisma
    Prisma <-->|TCP/IP| DB
    UI <-->|Session check| Auth
    Auth <-->|Verify| DB
    
    SA -->|Fetch data| Apify
    SA -->|Upload assets| Cloudinary
    SA -->|Generate insights| OpenAI
```

---

## Core Technologies Explained

### Next.js App Router
We utilize the Next.js App Router (`/src/app`) to heavily leverage React Server Components (RSC). By default, components render on the server, resulting in smaller client bundles and faster Initial Page Loads. Client Components (`"use client"`) are used strictly at the leaves of the component tree for interactivity, state management (Zustand), and animations (Framer Motion).

### Server Actions
Instead of traditional REST APIs (`/api/route`), all data mutations (Creates, Updates, Deletes) are handled via **Server Actions** located in `/src/actions`. These provide end-to-end type safety and direct integration with React's `useTransition` and `<form action={...}>`.

### Prisma & PostgreSQL
Our database is hosted on **Neon**, providing serverless PostgreSQL. **Prisma** acts as our Type-Safe ORM. The schema (`prisma/schema.prisma`) acts as the single source of truth for our data models, generating precise TypeScript definitions used throughout the application.

### Authentication Flow (Auth.js)
We use `NextAuth.js` (Auth.js) with the Prisma Adapter. Authentication is currently handled via credentials (bcrypt hashed passwords). Sessions are managed securely via encrypted JWTs stored in HTTP-only cookies.

---

## Sequence Diagrams

### 1. User Login Flow

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant NextAuth
    participant DB
    
    User->>Client: Enters Credentials
    Client->>NextAuth: POST /api/auth/callback/credentials
    NextAuth->>DB: Query User by Email
    DB-->>NextAuth: Return User Record (Hashed Password)
    NextAuth->>NextAuth: Compare bcrypt hashes
    alt Success
        NextAuth-->>Client: Set HttpOnly Session Cookie & Redirect
        Client-->>User: Show Dashboard
    else Failure
        NextAuth-->>Client: Return Error
        Client-->>User: Show "Invalid Credentials"
    end
```

### 2. Influencer Sync Flow (Apify Integration)

```mermaid
sequenceDiagram
    actor Admin
    participant UI as Influencer Profile UI
    participant SA as Sync Server Action
    participant Apify
    participant DB as Prisma / Neon
    
    Admin->>UI: Clicks "Sync Instagram Data"
    UI->>SA: invoke syncInfluencer(influencerId)
    SA->>DB: Fetch Influencer (Handle)
    SA->>Apify: POST Run Actor (Instagram Scraper) with Handle
    Apify-->>SA: Return JSON (Followers, Posts, Reels)
    SA->>DB: Update Influencer Record
    SA->>DB: Create InfluencerMetricSnapshot
    SA->>DB: Upsert InfluencerPost & InfluencerReel records
    DB-->>SA: Success
    SA-->>UI: revalidatePath() & Return Success
    UI-->>Admin: Show updated metrics
```

### 3. Campaign Creation Flow

```mermaid
sequenceDiagram
    actor Manager
    participant UI as Campaign Form
    participant SA as createCampaign Action
    participant DB
    
    Manager->>UI: Submits new campaign details
    UI->>SA: invoke createCampaign(data)
    SA->>DB: Prisma.campaign.create()
    SA->>DB: Log Activity (Campaign Created)
    DB-->>SA: Return Campaign Record
    SA-->>UI: revalidatePath('/campaigns')
    UI-->>Manager: Redirect to Campaign Dashboard
```

---

## Caching Strategy
Next.js aggressively caches fetch requests and pages. We invalidate caches on mutation by calling `revalidatePath('/path')` within our Server Actions. This ensures the user immediately sees updated data (e.g., after updating task status) without requiring a full page refresh.
