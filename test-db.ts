import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const id = "cmqpefaog008f04lapakvjty6";
  console.log("Checking ID:", id);
  try {
    const influencer = await prisma.influencer.findUnique({
      where: { id }
    });
    console.log("Result:", influencer ? "FOUND: " + influencer.influencerName : "NOT FOUND");
  } catch(e) {
    console.error("Prisma Error:", e);
  }
}
check().catch(console.error).finally(() => process.exit(0));
