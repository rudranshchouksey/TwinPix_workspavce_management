# Code Style & Conventions

To maintain a clean, readable, and highly maintainable codebase, TwinPix Workspace enforces the following development standards.

---

## 📁 Folder Conventions

All source code resides in `/src`.
- `/app`: Next.js App Router. Contains strictly routing logic (`page.tsx`, `layout.tsx`). Keep UI components out of this folder.
- `/components`: Reusable UI. 
  - `/components/ui`: Shadcn/UI primitives (`button`, `dialog`, `premium-card`).
  - `/components/[feature]`: Domain-specific components (e.g., `/components/influencers/profile-view.tsx`).
- `/actions`: Next.js Server Actions. All database mutations live here.
- `/services`: External API integrations (e.g., `openai.service.ts`, `apify.service.ts`).
- `/lib`: Internal utilities, Prisma client instantiation, and Auth configuration.

---

## 🔤 Naming Conventions

- **Files & Folders**: `kebab-case.ts` (e.g., `campaign-card.tsx`).
- **React Components**: `PascalCase` (e.g., `export function CampaignCard()`).
- **Hooks**: `camelCase` prefixed with `use` (e.g., `useCampaign()`).
- **Server Actions**: `camelCase` suffixed with `Action` (e.g., `createCampaignAction`).
- **Types/Interfaces**: `PascalCase` (e.g., `interface CampaignInput {}`).
- **Database Models**: `PascalCase` singular in Prisma (e.g., `model Influencer {}`).

---

## ⚛️ Component Structure

We prioritize **Server Components** for data fetching and performance.

### 1. Server Components by Default
Do not use `"use client"` unless absolutely necessary.
```tsx
// src/app/clients/page.tsx
import { getClientsAction } from "@/actions/clients";
import { ClientTable } from "@/components/clients/client-table";

export default async function ClientsPage() {
  const clients = await getClientsAction();
  return <ClientTable data={clients} />;
}
```

### 2. Client Components (When needed)
Use `"use client"` ONLY when the component requires:
- `useState`, `useEffect`, `useRef`
- Event listeners (`onClick`, `onChange`)
- Browser APIs (`window`, `localStorage`)
- Client-only libraries (`framer-motion`)

```tsx
"use client";
import { useState } from "react";
import { PremiumCard } from "@/components/ui/premium-card"; // Has framer-motion inside

export function ClientTable({ data }: { data: any }) {
  const [search, setSearch] = useState("");
  // ...
}
```

---

## 🏗 TypeScript Standards

- **Strict Typing**: Avoid `any`. If a type is complex, define an interface in `/src/types/`.
- **Prisma Types**: Leverage generated Prisma types whenever passing database objects.
  ```typescript
  import type { Influencer } from "@prisma/client";
  export function ProfileHeader({ data }: { data: Influencer }) { ... }
  ```

---

## 🧠 State Management Rules

We use **Zustand** for global client-side state. However, keep global state to an absolute minimum.

1. **Server State**: Use Server Actions and React `useTransition` for server mutations.
2. **URL State**: Use URL Search Params (`?tab=analytics`) for filter states, pagination, and tabs so pages remain shareable.
3. **Local State**: Use `useState` for transient UI state (e.g., modal open/close).
4. **Global State (Zustand)**: Use ONLY for data that must persist heavily across completely decoupled components (e.g., user theme preference, complex multi-step wizard data).

---

## 💅 Styling

TwinPix Workspace uses **Tailwind CSS v4** combined with custom CSS Variables.

1. **No Inline Styles**: Never use `style={{ color: 'red' }}`.
2. **Tailwind Utilities**: Use Tailwind for all layout and spacing.
3. **Design Tokens**: Use our custom CSS variables for colors to maintain the premium theme.
   - Good: `bg-[var(--color-surface-950)] text-[var(--color-text-primary)]`
   - Bad: `bg-gray-900 text-white`
4. **`cn()` Utility**: Use the `cn()` utility (clsx + tailwind-merge) for conditionally joining class names safely.
