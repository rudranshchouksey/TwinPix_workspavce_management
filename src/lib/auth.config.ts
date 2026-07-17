import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Configured in auth.ts
  basePath: "/api/auth",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image; // NextAuth uses 'picture' by default
        if (session.image !== undefined) token.image = session.image;
      }
      
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.status = user.status;
        token.jobTitle = user.jobTitle;
        token.department = user.department;
        if (user.image) {
          token.picture = user.image;
          token.image = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.jobTitle = token.jobTitle as string;
        session.user.department = token.department as string;
        
        if (token.image || token.picture) {
          session.user.image = (token.image || token.picture) as string;
        }
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const { pathname } = request.nextUrl;

      if (pathname === "/login" || pathname === "/unauthorized") {
        return true;
      }

      return isLoggedIn;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;
