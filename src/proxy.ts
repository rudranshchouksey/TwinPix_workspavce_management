/**
 * middleware.ts
 *
 * Protects all routes except public ones.
 * Unauthenticated users are redirected to /login.
 * Enforces role-based access on protected routes using ROUTE_ROLE_MAP.
 *
 * Auth.js v5 exports `auth` as middleware directly.
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/unauthorized"];

// Routes that should redirect authenticated users away (e.g., login page)
const AUTH_ROUTES = ["/login"];

/**
 * Role hierarchy levels — higher number = more access.
 * Duplicated from rbac.ts because middleware runs at the edge
 * and we need to keep the bundle minimal.
 */
const ROLE_LEVEL: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 75,
  TEAM_MEMBER: 50,
  CLIENT: 25,
};

/**
 * Route → minimum required role mapping.
 * Routes not listed here require authentication only (any role).
 */
const ROUTE_ROLE_MAP: Record<string, string> = {
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

function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_LEVEL[userRole];
  const requiredLevel = ROLE_LEVEL[requiredRole];
  if (userLevel === undefined || requiredLevel === undefined) return false;
  return userLevel >= requiredLevel;
}

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & {
    auth: { user?: { id: string; role?: string } } | null;
  };

  const isLoggedIn = !!session?.user;
  const pathname = nextUrl.pathname;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Authenticated users visiting /login → redirect to dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Unauthenticated users visiting protected routes → redirect to login
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── RBAC route enforcement ──────────────────────────────────
  if (isLoggedIn && !isPublicRoute) {
    const userRole = session?.user?.role ?? "";

    // Check if the current route matches any role-protected route
    for (const [routePrefix, requiredRole] of Object.entries(ROUTE_ROLE_MAP)) {
      if (pathname === routePrefix || pathname.startsWith(routePrefix + "/")) {
        if (!hasMinimumRole(userRole, requiredRole)) {
          return NextResponse.redirect(new URL("/unauthorized", nextUrl));
        }
        break; // Only match the first (most specific) route
      }
    }
  }

  return NextResponse.next();
});

// Matcher: run on all routes except static files and Next.js internals
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public|uploads).*)",
  ],
};
