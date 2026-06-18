/**
 * lib/auth-utils.ts
 *
 * Server-side helpers for session management and RBAC enforcement.
 * Use these in Server Components, Server Actions, and Route Handlers.
 *
 * Pattern: requireX() functions redirect on failure (for page-level guards).
 *          checkX() functions return booleans (for conditional logic).
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  hasMinimumRole,
  roleHasPermission,
  roleHasAllPermissions,
  roleHasAnyPermission,
  type Role,
  type Permission,
} from "@/lib/rbac";

// ─── Session Getters ─────────────────────────────────────────

/**
 * Get the current session (nullable).
 * Use in layouts or pages that handle both auth/unauth states.
 */
export async function getSession() {
  return await auth();
}

/**
 * Get the current user, redirect to /login if not authenticated.
 * Use this in protected Server Components and Server Actions.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

// ─── Role-Based Guards (redirect on failure) ─────────────────

/**
 * Require the current user to have at least the specified role.
 * Redirects to /unauthorized if the role check fails.
 *
 * @example
 * ```ts
 * // In a Server Component:
 * const user = await requireRole("ADMIN");
 * ```
 */
export async function requireRole(minimumRole: Role) {
  const user = await requireAuth();
  if (!hasMinimumRole(user.role, minimumRole)) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Require SUPER_ADMIN role. Shorthand for requireRole("SUPER_ADMIN").
 */
export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}

/**
 * Require ADMIN or higher role. Shorthand for requireRole("ADMIN").
 */
export async function requireAdmin() {
  return requireRole("ADMIN");
}

/**
 * Require TEAM_MEMBER or higher role. Shorthand for requireRole("TEAM_MEMBER").
 */
export async function requireTeamMember() {
  return requireRole("TEAM_MEMBER");
}

// ─── Permission-Based Guards (redirect on failure) ───────────

/**
 * Require the current user to have a specific permission.
 * Redirects to /unauthorized if the permission check fails.
 *
 * @example
 * ```ts
 * const user = await requirePermission("users:create");
 * ```
 */
export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  if (!roleHasPermission(user.role, permission)) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Require the current user to have ALL specified permissions.
 */
export async function requireAllPermissions(permissions: Permission[]) {
  const user = await requireAuth();
  if (!roleHasAllPermissions(user.role, permissions)) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Require the current user to have ANY of the specified permissions.
 */
export async function requireAnyPermission(permissions: Permission[]) {
  const user = await requireAuth();
  if (!roleHasAnyPermission(user.role, permissions)) {
    redirect("/unauthorized");
  }
  return user;
}

// ─── Non-Redirecting Checks (for conditional logic) ──────────

/**
 * Check if the current user has at least the specified role.
 * Returns false if not authenticated.
 */
export async function checkRole(minimumRole: Role): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.role) return false;
  return hasMinimumRole(session.user.role, minimumRole);
}

/**
 * Check if the current user has a specific permission.
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.role) return false;
  return roleHasPermission(session.user.role, permission);
}

/**
 * Check if the current user is authenticated (non-redirecting).
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}

/**
 * Check if the current user is a super admin (non-redirecting).
 */
export async function isSuperAdmin(): Promise<boolean> {
  return checkRole("SUPER_ADMIN");
}

/**
 * Check if the current user is at least an admin (non-redirecting).
 */
export async function isAdmin(): Promise<boolean> {
  return checkRole("ADMIN");
}
