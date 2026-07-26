# Deployment Guide

This document outlines the steps required to run TwinPix Workspace in development, build for production, and deploy to various environments.

## Environment Variables

Before running or deploying the application, ensure your `.env` file is properly configured. A template is provided in `.env.example`.

### Required Variables
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/twinpix"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# External APIs
OPENAI_API_KEY="sk-..."
RESEND_API_KEY="re_..."
CLOUDINARY_URL="cloudinary://..."
APIFY_API_TOKEN="apify_api_..."
```

## Development

To spin up the application locally:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Migration**
   Push the schema to your local PostgreSQL instance:
   ```bash
   npm run db:push
   # OR generate migrations
   npm run db:migrate
   ```

3. **Seed Database**
   Populate the database with initial users and test data:
   ```bash
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## Production

### Build

To create an optimized production build:
```bash
npm run build
```
Ensure all environment variables are present during the build phase.

### Deployment: Vercel (Recommended)

TwinPix Workspace is optimized for Vercel, given its Next.js architecture.

1. Connect your GitHub repository to Vercel.
2. In the Vercel dashboard, add all Environment Variables.
3. Configure the **Build Command** (default `npm run build` is fine).
4. Configure the **Install Command** (default `npm install` is fine).
5. Ensure `prisma generate` runs post-install (already configured in `package.json`).
6. Deploy.

### Deployment: Docker

A `docker-compose.yml` is provided for containerized deployment.

1. Create a `.env.local` file based on `.env.example`.
2. Build and start the containers:
   ```bash
   docker-compose up --build -d
   ```
3. The application will map to port `3000` by default, and the Postgres container will run on `5432`.

### Future AWS Deployment

Plans are in place to support robust AWS deployment using ECS (Elastic Container Service) for the application servers, RDS for PostgreSQL, and S3 for direct file storage (migrating away from Cloudinary for massive scale). This will be documented in a future release.
