/**
 * lib/rbac.ts
 *
 * Role-Based Access Control (RBAC) system.
 * Defines the role hierarchy, permissions, and utility functions
 * for checking access throughout the application.
 *
 * Role Hierarchy (highest → lowest):
 *   SUPER_ADMIN → ADMIN → TEAM_MEMBER → CLIENT
 *
 * Higher roles inherit all permissions of lower roles.
 */

// ─── Role Hierarchy ──────────────────────────────────────────

/**
 * Ordered role hierarchy — index 0 is highest privilege.
 * Used for comparisons: "does user X have at least role Y?"
 */
export const ROLE_HIERARCHY = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEAM_MEMBER",
  "CLIENT",
] as const;

export type Role = (typeof ROLE_HIERARCHY)[number];

/**
 * Numeric power level for each role (higher = more access).
 */
const ROLE_LEVEL: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 75,
  TEAM_MEMBER: 50,
  CLIENT: 25,
};

// ─── Permissions ─────────────────────────────────────────────

/**
 * Fine-grained permissions. Roles are mapped to sets of permissions.
 * This enables future expansion without changing role names.
 */
export const PERMISSIONS = {
  // User management
  "users:create": "Create new user accounts",
  "users:read": "View user profiles",
  "users:update": "Update user details",
  "users:delete": "Delete user accounts",
  "users:manage-roles": "Change user roles",

  // Project management
  "projects:create": "Create new projects",
  "projects:read": "View projects",
  "projects:update": "Update project details",
  "projects:delete": "Delete projects",

  // Admin panel
  "admin:access": "Access admin panel",
  "admin:settings": "Manage system settings",
  "admin:audit-log": "View audit logs",

  // Team management
  "team:manage": "Manage team members",
  "team:invite": "Invite new team members",

  // Content management
  "content:create": "Create content/documents",
  "content:read": "View content/documents",
  "content:update": "Edit content/documents",
  "content:delete": "Delete content/documents",

  // Analytics
  "analytics:view": "View analytics dashboard",
  "analytics:export": "Export analytics data",

  // Notifications
  "notifications:read": "Read notifications",
  "notifications:manage": "Manage notification settings",
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Role → Permission mapping.
 * Each role has its own permissions + inherits from lower roles.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    // Everything ADMIN has, plus:
    "users:manage-roles",
    "users:delete",
    "admin:settings",
    "admin:audit-log",
    "projects:delete",
    "content:delete",
    "analytics:export",
    "notifications:manage",
  ],
  ADMIN: [
    // Everything TEAM_MEMBER has, plus:
    "users:create",
    "users:update",
    "admin:access",
    "team:manage",
    "team:invite",
    "projects:create",
    "projects:update",
  ],
  TEAM_MEMBER: [
    // Everything CLIENT has, plus:
    "content:create",
    "content:update",
    "analytics:view",
    "notifications:read",
  ],
  CLIENT: [
    // Base permissions — read-only
    "users:read",
    "projects:read",
    "content:read",
  ],
};

// ─── Utility Functions ───────────────────────────────────────

/**
 * Get the numeric power level of a role.
 */
export function getRoleLevel(role: Role): number {
  return ROLE_LEVEL[role] ?? 0;
}

/**
 * Check if roleA has equal or higher privilege than roleB.
 * e.g. hasMinimumRole("ADMIN", "TEAM_MEMBER") → true
 */
export function hasMinimumRole(userRole: string, requiredRole: Role): boolean {
  const userLevel = ROLE_LEVEL[userRole as Role];
  const requiredLevel = ROLE_LEVEL[requiredRole];
  if (userLevel === undefined || requiredLevel === undefined) return false;
  return userLevel >= requiredLevel;
}

/**
 * Get all permissions for a role (including inherited from lower roles).
 */
export function getPermissionsForRole(role: Role): Set<Permission> {
  const permissions = new Set<Permission>();
  const roleIndex = ROLE_HIERARCHY.indexOf(role);

  // Collect permissions from this role and all roles below it
  for (let i = roleIndex; i < ROLE_HIERARCHY.length; i++) {
    const currentRole = ROLE_HIERARCHY[i];
    for (const perm of ROLE_PERMISSIONS[currentRole]) {
      permissions.add(perm);
    }
  }

  return permissions;
}

/**
 * Check if a role has a specific permission.
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
  const perms = getPermissionsForRole(role as Role);
  return perms.has(permission);
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function roleHasAllPermissions(
  role: string,
  permissions: Permission[]
): boolean {
  const perms = getPermissionsForRole(role as Role);
  return permissions.every((p) => perms.has(p));
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function roleHasAnyPermission(
  role: string,
  permissions: Permission[]
): boolean {
  const perms = getPermissionsForRole(role as Role);
  return permissions.some((p) => perms.has(p));
}

/**
 * Get a human-readable label for a role.
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    TEAM_MEMBER: "Team Member",
    CLIENT: "Client",
  };
  return labels[role] ?? role;
}

/**
 * Get the badge color class for a role (for UI display).
 */
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    ADMIN: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    TEAM_MEMBER: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    CLIENT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  };
  return colors[role] ?? "bg-gray-500/15 text-gray-400 border-gray-500/25";
}

/**
 * Route → minimum required role mapping.
 * Used by middleware and server components for route-level guards.
 */
export const ROUTE_ROLE_MAP: Record<string, Role> = {
  // Admin-only
  "/admin": "ADMIN",
  "/team": "ADMIN",
  "/influencers": "ADMIN",
  "/clients": "ADMIN",
  "/tasks": "ADMIN",
  "/calendar": "ADMIN",
  "/analytics": "ADMIN",
  "/settings": "ADMIN",
  // Team member
  "/my-tasks": "TEAM_MEMBER",
  "/projects": "TEAM_MEMBER",
  "/messages": "TEAM_MEMBER",
  "/notifications": "TEAM_MEMBER",
  // Client (accessible to all authenticated)
  "/campaigns": "CLIENT",
  "/files": "CLIENT",
  "/feedback": "CLIENT",
  "/documents": "CLIENT",
};
