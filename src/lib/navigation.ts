/**
 * lib/navigation.ts
 *
 * Centralized navigation configuration for the sidebar.
 * Each nav item specifies a minimum required role — items are
 * filtered client-side based on the user's session role.
 *
 * Role hierarchy: SUPER_ADMIN > ADMIN > TEAM_MEMBER > CLIENT
 * Higher roles see everything lower roles see, plus their own items.
 */

import {
  LayoutDashboard,
  Users,
  Megaphone,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Settings,
  UserCircle,
  MessageSquare,
  FileText,
  MessageCircle,
  ListTodo,
  Shield,
} from "lucide-react";
import type { Role } from "@/types";

// ─── Types ───────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
  /** Minimum role required to see this item. Defaults to CLIENT (everyone). */
  minRole: Role;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

// ─── Role Hierarchy (duplicated for import independence) ─────

const ROLE_LEVEL: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 75,
  TEAM_MEMBER: 50,
  CLIENT: 25,
};

export function hasMinRole(userRole: string, minRole: Role): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0);
}

// ─── Navigation Configuration ────────────────────────────────

/**
 * Master navigation config.
 * Sections and items are ordered exactly as they should appear.
 */
export const NAV_CONFIG: NavSection[] = [
  {
    section: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        minRole: "CLIENT",
      },
    ],
  },
  {
    section: "Influencers",
    items: [
      {
        label: "All Influencers",
        href: "/influencers",
        icon: UserCircle,
        minRole: "ADMIN",
      },
      {
        label: "Pipeline",
        href: "/influencers/pipeline",
        icon: FolderKanban,
        minRole: "ADMIN",
      },
      {
        label: "Import Leads",
        href: "/influencers/import",
        icon: Users,
        minRole: "ADMIN",
      },
      {
        label: "Analytics",
        href: "/influencers/analytics",
        icon: BarChart3,
        minRole: "ADMIN",
      },
    ],
  },
  {
    section: "Management",
    items: [
      {
        label: "Clients",
        href: "/clients",
        icon: Users,
        minRole: "ADMIN",
      },
      {
        label: "Campaigns",
        href: "/campaigns",
        icon: Megaphone,
        minRole: "CLIENT",
      },
      {
        label: "Team",
        href: "/team",
        icon: Shield,
        minRole: "ADMIN",
      },
    ],
  },
  {
    section: "Workspace",
    items: [
      {
        label: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        minRole: "ADMIN",
      },
      {
        label: "My Tasks",
        href: "/my-tasks",
        icon: ListTodo,
        minRole: "TEAM_MEMBER",
      },
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        minRole: "TEAM_MEMBER",
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        minRole: "TEAM_MEMBER",
      },
      {
        label: "Messages",
        href: "/messages",
        icon: MessageSquare,
        minRole: "TEAM_MEMBER",
      },
      {
        label: "Files",
        href: "/files",
        icon: FileText,
        minRole: "CLIENT",
      },
      {
        label: "Feedback",
        href: "/feedback",
        icon: MessageCircle,
        minRole: "CLIENT",
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        minRole: "ADMIN",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        minRole: "ADMIN",
      },
    ],
  },
];

/**
 * Filter navigation items for a given role.
 * Returns only sections that have at least one visible item.
 */
export function getNavForRole(userRole: string): NavSection[] {
  return NAV_CONFIG.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasMinRole(userRole, item.minRole)),
  })).filter((section) => section.items.length > 0);
}
