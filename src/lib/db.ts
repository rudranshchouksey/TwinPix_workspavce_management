/**
 * lib/db.ts
 *
 * Prisma 7 Client singleton with @prisma/adapter-pg.
 * Prisma 7 requires a driver adapter for direct DB connections.
 * Prevents multiple instances during Next.js HMR in development.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"] // Removed "query" to clean up development console
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined; // Prisma client instance
};


export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
