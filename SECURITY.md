# Security Overview

TwinPix Workspace handles sensitive agency, client, and influencer data. The application is built with security as a primary concern.

## Authentication
- Handled securely via **NextAuth.js (v5)**.
- Passwords are never stored in plain text. They are hashed using `bcryptjs` before insertion into the PostgreSQL database.
- Sessions are strictly managed and validated on every protected route transition.

## Authorization & RBAC
TwinPix implements a strict Role-Based Access Control (RBAC) system utilizing Prisma Enum `Role`:
- **SUPER_ADMIN**: Full system access, capable of managing other admins.
- **ADMIN**: Managers capable of managing team members and viewing all client data.
- **TEAM_MEMBER**: Standard internal access, restricted to assigned projects and tasks.
- **CLIENT**: External view-only access (In Development), explicitly blocked from internal notes and sensitive data.

Server Actions and API Routes explicitly check `session.user.role` before executing database mutations.

## Input Validation
- All inbound data to Server Actions and API Routes is parsed and validated using **Zod**.
- This ensures type safety and prevents malicious payload injections before they hit Prisma.

## File Upload Security
- Files are uploaded directly to **Cloudinary**.
- Upload routes validate MIME types (e.g., rejecting `.exe` or `.sh` files) and enforce strict file size limits.
- The `File` model in Prisma tracks the `uploadedById` to ensure an audit trail for all assets.

## Secrets and Environment Variables
- Critical keys (Database URL, NextAuth Secret, OpenAI Key, Resend Key, Apify Token) are exclusively stored in server-side `.env` variables.
- They are **never** exposed to the client bundle (avoiding the `NEXT_PUBLIC_` prefix for sensitive data).

## Rate Limiting
- External facing API endpoints (e.g., Webhooks) implement request throttling to prevent DDoS and brute-force attacks.

## Audit Logging
- Every critical mutation (creating users, deleting campaigns, changing permissions) triggers an insert into the `AuditLog` table.
- This provides an immutable history of *who* performed *what* action and *when*, satisfying enterprise compliance requirements.
