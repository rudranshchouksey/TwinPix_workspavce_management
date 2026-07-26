# TwinPix Workspace

**Enterprise Influencer CRM & Agency Management Platform**

TwinPix Workspace is a comprehensive, enterprise-grade platform designed for influencer agencies. It provides a unified workspace to manage clients, campaigns, influencer relationships, and team collaboration with advanced AI integration.

---

## Features

- **Client Management**: Track clients, leads, and associated notes and activities.
- **Influencer CRM**: Manage influencer relationships, track performance metrics, brand safety, and outreach messages.
- **Campaign Management**: End-to-end campaign tracking from planning to completion, including budgets and deliverables.
- **Project Management**: Organize campaigns and tasks under distinct projects.
- **Task Management**: Advanced task tracking with priorities, assignees, subtasks, and time tracking.
- **My Tasks**: A personalized view for team members to manage their assigned work.
- **AI Assistant**: Deep integration with AI for influencer matching, content analytics, and copilot conversations.
- **Analytics Dashboard**: Comprehensive data visualization of campaign performance and influencer metrics.
- **Calendar & Scheduling**: Track deadlines, campaign launches, meetings, and content posts.
- **Influencer Content Calendar**: Dedicated view for scheduled influencer content and deliverables.
- **File Management**: Centralized storage for contracts, invoices, and brand assets.
- **Team Workspace**: Collaboration tools for team members.
- **Internal Messaging**: Real-time communication within tasks and projects.
- **Notifications**: Robust notification engine covering in-app, email, and WhatsApp channels.
- **Activity Timeline**: Granular activity logs across tasks, files, clients, and campaigns.
- **Audit Logs**: Enterprise-grade tracking of critical system actions by admins.
- **Search**: Global search capabilities across the entire workspace.
- **Import Leads**: Bulk import functionality for influencers and clients.
- **Reports & Exports**: Generate detailed performance and CRM reports.
- **Auto Instagram Sync**: Automated syncing of influencer posts and reels.
- **ChatGPT AI Integration**: Advanced AI insights for creator intelligence and brand matching.
- **Email Notifications**: Automated email delivery via Resend.
- **WhatsApp Notifications**: Integrated WhatsApp messaging for critical alerts.
- **Project Health**: Automated health scoring based on task completion and deadlines.
- **Change History**: Track revisions and updates to core entities.
- **Premium Light UI**: A modern, sleek, and responsive user interface built with Tailwind CSS and shadcn/ui.

---

## Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 19, Next.js 16 (App Router) |
| **Backend** | Next.js Server Actions & API Routes, Node.js |
| **Database** | PostgreSQL |
| **ORM** | Prisma 7 |
| **Authentication** | NextAuth.js v5 (Auth.js) |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS v4, Framer Motion |
| **UI Library** | shadcn/ui, Radix UI, Base UI |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **AI Services** | OpenAI SDK |
| **Email** | Resend, React Email |
| **File Storage** | Cloudinary |
| **Data Processing** | Apify, PapaParse, PDFMake, Docx |

---

## Folder Structure

```
TwinPix Studio/
├── prisma/               # Database schema, seed data, and migration scripts
│   ├── schema.prisma     # Core database schema defining all models
│   └── seed.ts           # Initial database seeding script
├── public/               # Static assets (images, fonts)
├── src/                  # Main application source code
│   ├── actions/          # Next.js Server Actions for database operations
│   ├── app/              # Next.js App Router (Pages & API Routes)
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (dashboard)/  # Main authenticated application views
│   │   └── api/          # RESTful API endpoints (cron, integrations)
│   ├── components/       # Reusable React components (UI, layout, features)
│   ├── contexts/         # React Context providers
│   ├── emails/           # React Email templates
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions, Prisma client, AI services
│   ├── providers/        # Application-wide providers (Theme, Auth)
│   ├── services/         # External service integrations (Instagram, etc.)
│   ├── store/            # Zustand global state stores
│   └── types/            # TypeScript type definitions
└── ...config files       # package.json, tailwind.config, eslint, etc.
```
