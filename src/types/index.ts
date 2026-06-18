/**
 * types/index.ts
 * Shared TypeScript types for the entire application.
 */

// ─────────────────────────────────────────────
// Roles & Status (mirrors Prisma enums as string literals)
// ─────────────────────────────────────────────

export type Role = "SUPER_ADMIN" | "ADMIN" | "TEAM_MEMBER" | "CLIENT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

export type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  image: string | null;
  jobTitle: string | null;
  department: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export type ActionResponse<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiredRole?: Role;
  children?: NavItem[];
};

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────

export type SidebarState = "expanded" | "collapsed";
