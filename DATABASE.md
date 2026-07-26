# Database Schema

This document details the core Prisma models used in the TwinPix Workspace application.

## Core Models

### `User`
- **Purpose**: Represents system users (admins, team members, clients).
- **Relationships**: Has many Campaigns, Tasks, Files, Notifications, Events, and Messages. Manages Influencers.
- **Indexes**: `email`, `role`, `status`.
- **Important Fields**: `role` (SUPER_ADMIN, ADMIN, TEAM_MEMBER, CLIENT), `emailPreferences`, `password` (hashed).

### `AuditLog`
- **Purpose**: Immutable record of critical system actions for security and compliance.
- **Relationships**: Loosely coupled to User via `adminId`.
- **Indexes**: `adminId`, `entityId`, `action`.
- **Important Fields**: `action`, `entityType`, `details` (JSON).

## CRM Models

### `Influencer`
- **Purpose**: Core entity for the Influencer CRM.
- **Relationships**: Managed by a User. Has many Campaigns, Posts, Reels, Analytics, AI Insights.
- **Indexes**: `status`, `category`, `followers`, `engagementRate`.
- **Important Fields**: `instagramHandle`, `status` (NEW_LEAD, ONBOARDED, etc.), `syncStatus`.

### `InfluencerPost` & `InfluencerReel`
- **Purpose**: Stores historical Instagram post and reel data for analytics.
- **Relationships**: Belongs to `Influencer`.
- **Indexes**: `influencerId`.
- **Important Fields**: `instagramPostId`, `likes`, `comments`, `views` (reels).

### `InfluencerContentAnalytics` & `CreatorAIInsights`
- **Purpose**: Stores aggregated metrics and AI-generated analysis of an influencer's performance and brand safety.
- **Relationships**: 1:1 with `Influencer`.
- **Important Fields**: `avgEngagementRate`, `brandSafetyScore`, `strengths`, `weaknesses`.

### `Client`
- **Purpose**: Represents agency clients and brands.
- **Relationships**: Has many Projects, Campaigns, Invoices, Notes, and Activities.
- **Indexes**: `status`, `industry`, `email`.
- **Important Fields**: `companyName`, `status` (ACTIVE, LEAD).

## Campaign Management

### `Campaign`
- **Purpose**: Central entity for tracking a specific marketing campaign.
- **Relationships**: Belongs to `Client` and `Project`. Has many Tasks, Files, Team Members, and Influencers.
- **Indexes**: `clientId`, `status`, `startDate`.
- **Important Fields**: `budget`, `status` (PLANNING, ACTIVE, REVIEW, COMPLETED).

### `CampaignInfluencer` & `CampaignTeamMember`
- **Purpose**: Join tables explicitly mapping Influencers and Users to Campaigns with additional metadata (e.g., specific fees or roles).
- **Indexes**: `campaignId`, `influencerId`/`userId`.

## Task Management

### `Task`
- **Purpose**: Tracks actionable work items.
- **Relationships**: Assigned to `User`, authored by `User`. Belongs to `Campaign` or `Project`. Has Comments and Activities.
- **Indexes**: `assigneeId`, `status`, `dueDate`.
- **Important Fields**: `priority`, `status` (TODO, IN_PROGRESS, REVIEW, DONE), `checklist`.

### `TaskComment` & `TaskActivity`
- **Purpose**: Provides audit trails and communication on specific tasks.
- **Relationships**: Belongs to `Task` and `User`.

## File Management

### `File`
- **Purpose**: Centralized tracking of uploaded assets (Contracts, Briefs, Deliverables).
- **Relationships**: Uploaded by `User`. Associated with Campaign, Influencer, Task, or Project.
- **Indexes**: `folder`, `uploadedById`.
- **Important Fields**: `url` (Cloudinary), `mimeType`, `size`, `folder`.

## Notifications

### `Notification`
- **Purpose**: In-app alerting system.
- **Relationships**: Belongs to `User`. Links to Task, Campaign, or Project.
- **Indexes**: `userId`, `isRead`.
- **Important Fields**: `title`, `type`, `priority`.

### `EmailDelivery`
- **Purpose**: Tracks the status of outbound emails via Resend.
- **Relationships**: Belongs to `Notification`.
- **Important Fields**: `status` (PENDING, SENT, FAILED), `templateName`.
