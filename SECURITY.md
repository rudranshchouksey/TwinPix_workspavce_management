# Security Documentation

TwinPix Workspace is built to handle sensitive CRM and Campaign data for enterprise clients. Security is deeply integrated into the application layer, database access, and deployment pipeline.

---

## 🔐 Authentication

We utilize **Auth.js (NextAuth)** for secure session management.
- **Credential Storage**: Passwords are mathematically hashed using `bcrypt` with a salt round of 10. Plain-text passwords are never stored in the database.
- **Session Management**: JWTs (JSON Web Tokens) are used to manage user sessions. These tokens are encrypted (JWE) using the `NEXTAUTH_SECRET` and stored in **HttpOnly, Secure** cookies, preventing cross-site scripting (XSS) attacks from accessing session data.

---

## 🛡 Authorization & Role-Based Access Control (RBAC)

Every route and Server Action implements strict authorization checks.

### Roles
- **`SUPER_ADMIN`**: Founders. Full access to the system, including deleting workspaces and managing other admins.
- **`ADMIN`**: Managers. Can manage team members, invite clients, and edit financial data on campaigns.
- **`TEAM_MEMBER`**: Standard workspace access. Cannot see sensitive financial data or manage billing.
- **`CLIENT`**: External stakeholders. Strictly View-Only access, restricted explicitly to Campaigns and Projects assigned to their `clientId`.

### Server-Side Validation
Authorization is **never** solely handled on the client. Every Next.js Server Action (`src/actions/*`) first verifies the user's session and role before attempting any database operations.

```typescript
// Example from a Server Action
const session = await auth();
if (!session?.user) throw new Error("Unauthorized");
if (session.user.role === "CLIENT") throw new Error("Forbidden");
```

---

## 🗃 Secrets Management

- All secrets (API Keys, Database URLs, NextAuth Secret) are securely injected into the environment via **Vercel Environment Variables**.
- Secrets are NEVER hardcoded or checked into the git repository.
- `DATABASE_URL` uses pooled connections for serverless infrastructure but maintains secure TLS encryption to the Neon Database.

---

## 🧼 Data Validation & Input Sanitization

To prevent SQL Injection and Cross-Site Scripting (XSS):
1. **Prisma ORM**: By default, Prisma uses prepared statements, inherently protecting the PostgreSQL database from SQL injection attacks.
2. **Zod Validation**: We use `zod` schemas to strictly validate all incoming payloads in Server Actions. If the payload doesn't match the schema type or length requirements, the action throws a validation error before hitting the database.
3. **React Escaping**: React automatically escapes variables injected into JSX, mitigating XSS attacks from user-generated content (like feedback or task descriptions).

---

## 🚨 Security Best Practices

1. **Rotate Keys**: Regularly rotate the `NEXTAUTH_SECRET` and `OPENAI_API_KEY` every 90 days.
2. **Review Audit Logs**: The `AuditLog` table records all destructive actions (`DELETE`, `UPDATE` on critical entities) including the `adminId` performing the action. Regularly review these logs.
3. **Dependency Scanning**: Run `npm audit` frequently and keep `@prisma/client`, `next`, and `next-auth` strictly up to date to patch known CVEs.
