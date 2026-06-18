"use client";

/**
 * components/providers/session-provider.tsx
 *
 * Wraps the app in Auth.js SessionProvider.
 * Required for `useSession` in Client Components.
 */

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
