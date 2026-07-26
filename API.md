# API Reference

The primary mutation and data-fetching layer in TwinPix Workspace utilizes **Next.js Server Actions**. However, standard RESTful API routes are maintained for webhooks, external integrations, and specific background tasks.

All API routes are located in `src/app/api/`.

## Authentication

### `[...nextauth]`
- **Method**: `GET`, `POST`
- **Endpoint**: `/api/auth/[...nextauth]`
- **Purpose**: Handles all authentication flows (login, session validation, callbacks) powered by NextAuth.js.
- **Request**: Managed by NextAuth.
- **Response**: Session object or authentication redirect.

## Influencer Syncing

### `Instagram Sync Webhook`
- **Method**: `POST`
- **Endpoint**: `/api/instagram/sync`
- **Purpose**: Webhook endpoint for Apify. Receives bulk Instagram profile and post data to update Influencer metrics in the database.
- **Authentication**: Requires a secret token in headers.
- **Request**: JSON payload containing scraped Instagram metrics.
- **Response**: `200 OK` on successful DB upsert. `400 Bad Request` if payload is malformed.

## AI & Copilot

### `Copilot Chat`
- **Method**: `POST`
- **Endpoint**: `/api/copilot/chat`
- **Purpose**: Streams responses from OpenAI based on user queries regarding workspace data.
- **Authentication**: Requires active user session.
- **Request**: `{ messages: [{ role: "user", content: "..." }] }`
- **Response**: Text stream (Server-Sent Events).

## Background Tasks

### `Cron Trigger`
- **Method**: `GET` or `POST`
- **Endpoint**: `/api/cron/daily`
- **Purpose**: Triggered securely by Vercel Cron. Processes overdue tasks, sends daily email digests, and triggers the Instagram Apify scraper.
- **Authentication**: Validates Vercel Cron secret.

## Notifications & Communications

### `Email Dispatch`
- **Method**: `POST`
- **Endpoint**: `/api/emails/send`
- **Purpose**: Internal endpoint/service to dispatch customized emails via Resend (e.g., campaign invites, reports).
- **Authentication**: Internal service to service authentication.

### `WhatsApp Webhook`
- **Method**: `POST`
- **Endpoint**: `/api/notifications/whatsapp-webhook`
- **Purpose**: Receives delivery receipts and inbound messages from the WhatsApp Business API.

## Testing & Utilities

### `Database Test`
- **Method**: `GET`
- **Endpoint**: `/api/test-db`
- **Purpose**: Health check endpoint to verify Prisma connection to PostgreSQL.

### `Session Test`
- **Method**: `GET`
- **Endpoint**: `/api/test-session`
- **Purpose**: Utility to dump the current NextAuth session data for debugging permissions.

## Errors
All API routes follow standard HTTP status codes:
- `401 Unauthorized`: Missing or invalid session/token.
- `403 Forbidden`: Authenticated, but insufficient RBAC permissions.
- `404 Not Found`: Entity does not exist.
- `500 Internal Server Error`: Unhandled exception or database failure.
