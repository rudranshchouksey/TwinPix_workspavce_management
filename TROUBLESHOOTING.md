# Troubleshooting Guide

This guide documents known issues and fixes for developers working on TwinPix Workspace.

---

## 1. Vercel Deployment Errors

### Server Components Render Error
**Symptom**: `An error occurred in the Server Components render. A digest property is included...`
**Cause**: Importing a client-side hook, context, or library (like `framer-motion`) into a React Server Component.
**Fix**: Locate the specific component using the client-side feature (e.g., `PageHeader.tsx`) and add `"use client";` to the very top of the file.

### Type Error on UI Triggers
**Symptom**: `Property 'asChild' does not exist on type 'IntrinsicAttributes & Props<unknown>'`
**Cause**: The underlying UI library `@base-ui` handles component delegation via a `render` prop, not the standard Radix `asChild` prop.
**Fix**: 
```tsx
// Incorrect
<DialogTrigger asChild><Button>Click</Button></DialogTrigger>

// Correct
<DialogTrigger render={<Button>Click</Button>} />
```

---

## 2. Prisma Errors

### Missing Prisma Client
**Symptom**: `Cannot find module '@prisma/client' or its corresponding type declarations.`
**Cause**: The Prisma client hasn't been generated for the current platform environment.
**Fix**: Run `npx prisma generate`. In Vercel, ensure your `package.json` has `"postinstall": "prisma generate"`.

### Database Connection Timeout
**Symptom**: `PrismaClientInitializationError: Can't reach database server at...`
**Cause**: Typically due to IP allowlisting on Neon, or incorrect `DATABASE_URL` formatting.
**Fix**: Verify your `DATABASE_URL` in `.env`. If using Vercel, ensure you are using the Neon Pooled connection string (`...neon.tech/dbname?pgbouncer=true`).

---

## 3. External Service Issues

### Apify Instagram Sync Timeout
**Symptom**: Clicking "Sync Data" spins for 10-15 seconds and throws a 504 Gateway Timeout.
**Cause**: Apify Instagram scrapers can take 20-30 seconds to spin up and return data. Vercel Hobby tier has a hard 10-second serverless execution limit.
**Fix**: Upgrade Vercel to Pro (300s limit) OR implement an asynchronous webhook architecture. Trigger the Apify run, return immediately to the client, and have Apify ping a Next.js `/api/webhook/apify` route when finished.

### Cloudinary Image Upload Failures
**Symptom**: File uploads return a 500 error, or images fail to render.
**Cause**: Misconfigured `CLOUDINARY_URL` or hitting bandwidth limits.
**Fix**: 
1. Check Cloudinary Dashboard for limits.
2. Verify format: `cloudinary://<api_key>:<api_secret>@<cloud_name>`.

### Authentication Failures
**Symptom**: Valid credentials return "Invalid Email or Password".
**Cause**: Bcrypt version mismatch across environments, or incorrect `NEXTAUTH_SECRET`.
**Fix**: Ensure `NEXTAUTH_SECRET` matches exactly between environments. If seeding users manually, ensure you use `bcryptjs.hashSync("password", 10)` before inserting into the DB.
