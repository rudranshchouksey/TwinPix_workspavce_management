# API Reference (Server Actions)

TwinPix Workspace utilizes Next.js **Server Actions** instead of traditional REST API endpoints. These actions are located in the `src/actions/` directory and are directly imported by Client Components to mutate data or perform secure server-side operations.

Below is a reference of key actions grouped by domain.

---

## 🔐 Auth (`src/actions/auth.ts`)

| Action | Purpose | Input | Output | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `loginAction` | Authenticates a user using NextAuth credentials | `email` (string), `password` (string) | `{ success: boolean, url?: string, error?: string }` | Invalid credentials, User not found, Suspended account |

---

## 🌟 Influencers (`src/actions/influencers.ts`)

| Action | Purpose | Input | Output | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `getInfluencersAction` | Fetches a paginated/filtered list of influencers | `query` (string), `status` (enum) | `Influencer[]` | DB Read Error |
| `createInfluencerAction` | Creates a new influencer record | `data: InfluencerInput` | `Influencer` | Handle already exists, Validation failed |
| `updateInfluencerStatusAction` | Updates the CRM stage of an influencer | `id` (string), `status` (enum) | `Influencer` | Record not found |
| `syncInfluencerInstagramAction` | Triggers Apify scrape to update metrics | `influencerId` (string) | `{ success: boolean, updatedMetrics: object }` | Apify Timeout, Handle invalid |
| `deleteInfluencerAction` | Permanently deletes an influencer and cascade deletes related data | `id` (string) | `{ success: boolean }` | Unauthorized, Record not found |

---

## 🎯 Campaigns (`src/actions/campaigns.ts`)

| Action | Purpose | Input | Output | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `createCampaignAction` | Initializes a new campaign | `data: CampaignInput` | `Campaign` | Missing required fields |
| `addInfluencerToCampaign` | Associates an influencer with a specific campaign | `campaignId` (string), `influencerId` (string), `fee` (number) | `CampaignInfluencer` | Already assigned |
| `updateCampaignStatusAction` | Moves campaign through Planning, Active, Review phases | `id` (string), `status` (enum) | `Campaign` | Record not found |

---

## 🏢 Clients (`src/actions/clients.ts`)

| Action | Purpose | Input | Output | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `createClientAction` | Adds a new brand/client to the workspace | `data: ClientInput` | `Client` | Email already exists |
| `addClientNoteAction` | Adds a timeline note to a client profile | `clientId` (string), `content` (string) | `ClientNote` | Record not found |

---

## ✅ Tasks (`src/actions/tasks.ts`)

| Action | Purpose | Input | Output | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `createTaskAction` | Creates a task and optionally assigns it | `data: TaskInput` | `Task` | Validation failed |
| `updateTaskStatusAction` | Moves a task across the Kanban board | `taskId` (string), `status` (TaskStatus) | `Task` | Record not found |
| `addTaskCommentAction` | Adds a comment to a specific task thread | `taskId` (string), `content` (string) | `TaskComment` | - |

---

## 📁 Projects (`src/actions/projects.ts`)

| Action | Purpose | Input | Output | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `createProjectAction` | Groups multiple campaigns under a single project | `name` (string), `clientId?` (string) | `Project` | - |
| `updateProjectStatusAction` | Marks project as Active, On Hold, or Completed | `projectId` (string), `status` (string) | `Project` | Record not found |

---

## 💬 Messages (`src/actions/messages.ts`)

| Action | Purpose | Input | Output | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `sendMessageAction` | Sends an internal direct message to a team member | `receiverId` (string), `content` (string) | `Message` | Receiver not found |
| `getConversationAction` | Fetches chat history between current user and target | `otherUserId` (string) | `Message[]` | - |
| `markConversationAsReadAction` | Updates `isRead` flag for incoming messages | `senderId` (string) | `{ success: true }` | - |
