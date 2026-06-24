# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.0] - 2026-06-24

### Added
- **Core CRM**: Influencer, Client, and Campaign management modules.
- **Workspace**: Full Kanban board implementation for Tasks (`/tasks` and `/my-tasks`).
- **Messaging**: Real-time internal team messaging interface.
- **AI Copilot**: Integrated OpenAI for automated brand match analysis and creator insights.
- **Instagram Sync**: Automated ingestion of post/reel metrics via Apify.
- **Premium UI**: Enterprise-grade redesign featuring `PageHeader` and `PremiumCard` components with Framer Motion animations.
- **Authentication**: Secure JWT-based authentication via NextAuth/Auth.js.

### Changed
- Standardized layout components across all routes to utilize modern Next.js App Router conventions.
- Refactored basic data tables into sleek, borderless grids housed within `PremiumCard` containers.

### Fixed
- Resolved Server Component render errors caused by `framer-motion` imports without `"use client"` directives.
- Fixed `asChild` type errors in Shadcn UI `DialogTrigger` and `DropdownMenuTrigger` components by replacing them with the native `@base-ui` `render` prop.
