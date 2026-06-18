# TwinPix Studio Workspace

A modern, full-stack CRM and workspace management application tailored for influencer marketing agencies. Built with Next.js 15, React 19, Prisma, PostgreSQL, and Tailwind CSS.

## Features

- **Influencer CRM**: Track influencers, their stats, and engagement metrics.
- **Client Management**: Manage brands, clients, and internal notes.
- **Campaign Tracking**: End-to-end campaign lifecycle management, including deliverables and budgeting.
- **Task Management**: Kanban-style or list-style task tracking with assignees and due dates.
- **Role-Based Access Control**: Secure roles (Super Admin, Admin, Team Member, Client) using Auth.js.
- **Dark Mode UI**: Beautiful, premium interface designed with shadcn/ui and custom glassmorphic aesthetics.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth v5)
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table v8

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL server running locally or via a cloud provider (e.g., Supabase, Vercel Postgres).

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "TwinPix Studio"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your variables:
   ```bash
   cp .env.example .env
   ```
   Update `DATABASE_URL` with your Postgres connection string. Generate an `AUTH_SECRET` using `npx auth secret`.

4. **Database Setup**
   Push the schema to your database and generate the Prisma Client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
   *(Optional)* Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment (Vercel)

This project is optimized for deployment on Vercel.

1. Push your code to GitHub.
2. Import the repository in Vercel.
3. Add the required Environment Variables (`DATABASE_URL`, `AUTH_SECRET`).
4. Set the Build Command to `npm run build`.
5. Deploy!

## Architecture

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (shadcn) and domain-specific feature components.
- `src/actions`: Next.js Server Actions for database mutations.
- `src/lib`: Utilities, Prisma client, validation schemas, and Auth.js config.
- `prisma`: Database schema and migrations.

## License

Private repository. All rights reserved.
