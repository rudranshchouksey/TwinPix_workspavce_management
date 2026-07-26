# Enterprise Features

TwinPix Workspace is built specifically to handle the scale and security requirements of large influencer marketing agencies.

## Project Dashboard
A high-level command center providing a birds-eye view of all active campaigns, overall agency velocity, and financial budget utilization. Designed for executives and senior account managers.

## Activity Timeline
Every interaction within the workspace is tracked. The `Activity` models (`TaskActivity`, `CampaignActivity`, `FileActivity`) ensure that if a task status changes or a file is archived, the chronological history is preserved and visible to the team, eliminating the "who changed this?" ambiguity.

## Health Score
An automated algorithm that assesses the status of Projects and Campaigns. By analyzing the ratio of completed vs. overdue tasks and upcoming deadlines, the system automatically flags at-risk campaigns before they derail.

## Audit Logs
Separate from the user-facing Activity Timeline, the `AuditLog` table strictly records administrative and potentially destructive actions (e.g., deleting a client, exporting bulk data, changing user permissions). This is a strict compliance requirement for enterprise data security.

## Task Center
An advanced task management interface featuring Kanban boards, list views, and specialized "My Tasks" filters. It supports story points, estimated vs. actual hour tracking, and subtask checklists.

## Content Calendar
A specialized view tailored for influencer marketing. Differentiates between internal agency meetings and external content publishing deadlines (e.g., `INSTAGRAM_REEL`, `YOUTUBE_UPLOAD`), ensuring the team knows exactly what content goes live on what day.

## Relationship Graph
The system understands the complex web of influencer marketing. An influencer isn't just a standalone record; they are mapped to the campaigns they worked on, the tasks associated with them, the files they uploaded, and the AI insights generated for them.

## Permissions (RBAC)
Granular Role-Based Access Control ensures data silos. Team Members only see what they need to execute their tasks, while Admins have full cross-client visibility.

## Notifications Engine
Enterprise teams cannot rely solely on checking the app. The multi-channel notification engine (In-App, Email via Resend, and WhatsApp) ensures critical blockers are communicated immediately across the platforms the team actually uses.

## Reports & Exports
Data portability is crucial. Managers can instantly generate comprehensive CSV exports of influencer databases for financial auditing, or clean PDF summaries of campaign performance for client presentations.
