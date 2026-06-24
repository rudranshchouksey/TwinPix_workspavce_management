# Deployment Guide

TwinPix Workspace is a modern Next.js application designed to be deployed seamlessly on **Vercel**, utilizing **Neon** for serverless PostgreSQL.

## 🌍 Production Environment Setup

### 1. Database (Neon)
1. Create a project on [Neon.tech](https://neon.tech).
2. Copy the PostgreSQL connection string. Ensure you use the pooled connection string (usually containing `-pooler`) for serverless environments.
3. Set this as `DATABASE_URL` in your environment.

### 2. External Services
- **Cloudinary**: Create an account, go to Dashboard, and copy your API Environment variable (`CLOUDINARY_URL`).
- **Apify**: Generate a Personal API Token for the Instagram Scraper actor. Set as `APIFY_API_TOKEN`.
- **OpenAI**: Generate an API key with access to `gpt-4o-mini`. Set as `OPENAI_API_KEY`.
- **Auth.js Secret**: Generate a secure random string (e.g., `openssl rand -base64 32`) and set as `NEXTAUTH_SECRET`.

### 3. Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. In the Vercel project settings, configure all the Environment Variables.
3. Ensure the Build Command is `next build`.
4. Ensure the Install Command is `npm install`.
5. Ensure the Post-install script runs `prisma generate` (this is already in `package.json`).
6. Click Deploy.

---

## 💻 Local & Staging Environments

To run a staging environment, it is highly recommended to create a separate database branch in Neon. Update your local `.env` or Vercel Staging Environment variables to point to this new branch connection string.

---

## 🔧 Troubleshooting Deployment

### 1. Server Component Errors (Framer Motion)
**Error**: `An error occurred in the Server Components render. A digest property is included...`
**Fix**: This occurs when Client-only libraries (like `framer-motion`) are used in a component that isn't marked with `"use client";`. Ensure your UI components (e.g., `PageHeader`, `PremiumCard`) have `"use client";` at the top.

### 2. Prisma: Module not found
**Error**: `Cannot find module '@prisma/client'` on Vercel build.
**Fix**: Vercel caches `node_modules`. Ensure your `package.json` contains `"postinstall": "prisma generate"`. If the error persists, trigger a redeploy in Vercel with the "Clear Build Cache" option checked.

### 3. Prisma Client Initialization Error
**Error**: `Datasource "db" must be set to a valid URL string.`
**Fix**: Ensure `DATABASE_URL` is correctly set in the Vercel Environment Variables section and that it does not contain trailing spaces or invisible characters.

### 4. Image Upload Failures (Cloudinary)
**Error**: Images failing to upload or returning 500 errors.
**Fix**: Double-check the `CLOUDINARY_URL` format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`. Ensure your Cloudinary account hasn't hit its bandwidth or storage limits.

### 5. Apify Timeout Errors
**Error**: Influencer sync action times out after 10-15 seconds.
**Fix**: Vercel Serverless functions on the Hobby tier have a hard 10-second timeout. If the Apify actor takes longer, you may need to upgrade to Vercel Pro (300s timeout) or implement a webhook/background job architecture to handle the incoming data asynchronously.
