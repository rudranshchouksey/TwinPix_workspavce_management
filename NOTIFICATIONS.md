# Notification System

TwinPix Workspace employs a multi-channel notification strategy to ensure that critical agency events are never missed, while allowing users granular control over their alert preferences.

## Preference Management
Users define their notification preferences in their profile (stored in the `User` model as `emailPreferences`, `whatsappPreferences`, and `inAppPreferences`). The system checks these JSON configurations before dispatching any alert.

## In-App Notifications
- **Trigger**: Tasks assigned, campaign status changes, file uploads, etc.
- **Storage**: Logged in the `Notification` Prisma table with a boolean `isRead` flag.
- **UI**: Displayed via a real-time bell icon in the navigation bar. Clicking a notification marks it as read and redirects the user to the relevant entity.

## Email Notifications
- **Provider**: Handled via **Resend** and built using **React Email** components for consistent, responsive styling.
- **Tracking**: Dispatch attempts and statuses are recorded in the `EmailDelivery` table.
- **Use Cases**: Daily task digests, urgent campaign alerts, and external client communications.

## WhatsApp Notifications
- **Integration**: Direct integration with the WhatsApp Business API.
- **Tracking**: Handled by the `WhatsAppDelivery` model (conceptually, or via Webhooks).
- **Use Cases**: High-priority, time-sensitive alerts (e.g., "Influencer contract signed", "Deliverable overdue").

## Realtime Events
While currently reliant on aggressive client-side revalidation and Zustand state updates, the architecture is designed to support WebSockets or Server-Sent Events (SSE) for immediate UI updates without polling.

## Future Push Notifications
- **Planned**: Integration of browser-based Push Notifications (via Service Workers) and mobile push notifications for dedicated iOS/Android apps, governed by the `pushPreferences` field on the User model.
