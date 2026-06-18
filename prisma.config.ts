import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env.local (Next.js convention) for Prisma CLI commands
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// For Prisma CLI (migrate, generate), we use the url in datasource.
// The adapter is only used at runtime in the PrismaClient constructor.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
