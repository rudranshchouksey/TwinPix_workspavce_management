/**
 * types/next-auth.d.ts
 *
 * Module augmentation for Auth.js v5 (next-auth).
 * Extends the default User, Session, and JWT types
 * with TwinPix Studio's custom fields (role, status, etc.).
 *
 * This ensures full type safety when accessing session data
 * in Server Components, Client Components, and middleware.
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      status: string;
      jobTitle: string | null;
      department: string | null;
    };
  }

  interface User {
    role: string;
    status: string;
    jobTitle: string | null;
    department: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    status: string;
    jobTitle: string | null;
    department: string | null;
  }
}
