<div align="center">
  <h1>TwinPix Workspace</h1>
  <p><strong>Enterprise-grade Influencer CRM and Workspace platform built for creator agencies and marketing teams.</strong></p>
  <br />
</div>

TwinPix Workspace is a unified operating system for influencer marketing. It combines intelligent creator discovery, relationship management (CRM), comprehensive campaign tracking, and seamless workspace collaboration into a single, high-performance platform.

## ✨ Features

### 🌟 Influencer Management
- **Import Influencers**: Bulk import via CSV or direct Instagram API integration.
- **Profile Pages**: Deep-dive profiles containing metrics, past campaigns, files, and notes.
- **Instagram Sync**: Automated ingestion of posts, reels, and engagement metrics via Apify.
- **Pipeline Management**: Kanban-style CRM boards to track leads from initial outreach to onboarded.
- **Analytics**: Historical snapshot tracking for follower growth, engagement rates, and content performance.

### 🎯 Campaign Management
- **Create Campaigns**: Define budgets, deliverables, and timelines.
- **Assign Creators**: Map influencers to campaigns with customized fees and requirements.
- **Timeline Tracking**: Visual tracking of campaign statuses (Planning, Active, Review, Completed).

### 🏢 Workspace Collaboration
- **Tasks**: Assignable tasks with priorities, due dates, and campaign linking.
- **Calendar**: Unified view of deadlines, campaign durations, and meetings.
- **Messages**: Internal team messaging and collaboration hub.
- **Files**: Centralized asset management linked to campaigns and influencers.

### 🤖 AI Features (Copilot)
- **AI Insights**: Automated SWOT analysis and content categorization for creators.
- **Brand Safety**: AI-driven analysis to determine brand safety levels based on historical content.
- **Performance Recommendations**: Predictive analytics for collaboration suitability and expected ROI.

---

## 🛠 Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Next.js Server Actions |
| **Database** | PostgreSQL, Prisma ORM |
| **Infrastructure** | Vercel, Neon (Serverless Postgres) |
| **External Services** | Apify (Data Scraping), Cloudinary (Asset Storage), Auth.js / NextAuth (Authentication), OpenAI (Copilot Intelligence) |

---

## 🏗 Architecture Overview

TwinPix leverages the latest features of **Next.js 16 (App Router)**.
- **Client Components** handle complex UI interactions, animations, and state management (Zustand).
- **Server Components** securely fetch data directly from the Neon PostgreSQL database via **Prisma**.
- **Server Actions** process all mutations (creates, updates, deletes) securely on the server without needing API routes.
- **Auth.js** manages sessions and Role-Based Access Control (RBAC).

*For a deep dive into the architecture, please see [ARCHITECTURE.md](./ARCHITECTURE.md).*

---

## 📁 Folder Structure

```text
twinpix-studio/
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── src/
    ├── actions/          # Next.js Server Actions (Mutations & Data Fetching)
    ├── app/              # Next.js App Router (Pages & Layouts)
    ├── components/       # Reusable React components (UI, Forms, Views)
    ├── contexts/         # React Context providers
    ├── hooks/            # Custom React hooks
    ├── lib/              # Core utilities (Prisma client, Auth config, Cloudinary)
    ├── services/         # External integrations (Apify, OpenAI)
    ├── store/            # Zustand state management
    └── types/            # TypeScript type definitions
```

---

## 🚀 Installation

### Prerequisites
- Node.js >= 18.x
- PostgreSQL database (Local or Neon)
- Cloudinary Account
- Apify Account
- OpenAI API Key

### Step-by-Step Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/twinpix-workspace.git
   cd twinpix-workspace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` to `.env` and fill in your details.
   ```bash
   cp .env.example .env
   ```
   *(See [Environment Variables](#-environment-variables) below for details.)*

4. **Initialize Database:**
   Generate the Prisma client and push the schema to your database.
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start Local Development Server:**
   ```bash
   npm run dev
   ```

---

## ⚙️ Environment Variables

A complete list of required environment variables. Refer to `.env.example` for scaffolding.

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Connection string for your PostgreSQL database (e.g., Neon). |
| `NEXTAUTH_SECRET` | Secret key used by Auth.js to encrypt sessions and tokens. |
| `APIFY_API_TOKEN` | API token for Apify to run Instagram scraper actors. |
| `OPENAI_API_KEY` | API key for OpenAI to power the Copilot and AI Insights features. |
| `OPENAI_MODEL` | (Optional) The specific OpenAI model to use (default: `gpt-4o-mini`). |
| `CLOUDINARY_URL` | Connection string for Cloudinary asset storage. |

---

## 💻 Local Development

Use the following commands during development:

- `npm run dev`: Starts the Next.js development server.
- `npm run db:studio`: Opens Prisma Studio to view and edit database records.
- `npm run lint`: Runs ESLint for code quality checks.

---

## ☁️ Production Deployment

TwinPix is optimized for deployment on **Vercel**.

1. Push your code to a GitHub repository.
2. Import the repository into Vercel.
3. Configure all **Environment Variables** in the Vercel dashboard.
4. Add a `postinstall` script to your `package.json` to generate the Prisma Client: `"postinstall": "prisma generate"`. (This is already included).
5. Click **Deploy**. Vercel will automatically build and deploy the application.

*For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md).*

---

## 🤝 Contributing Guidelines

We welcome contributions! Please refer to our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, branch naming, commit conventions (Conventional Commits), and the process for submitting Pull Requests.

---

## 🛣 Future Roadmap

We are constantly evolving TwinPix. Upcoming features include:

- **Phase 1**: Advanced AI creator scoring and automated outreach generation.
- **Phase 2**: Audience fraud detection and deep demographic analytics.
- **Phase 3**: Predictive analytics for campaign ROI and smart influencer recommendations.

*See the full [ROADMAP.md](./ROADMAP.md) for more details.*

---

## 📄 License

This project is licensed under the MIT License.
