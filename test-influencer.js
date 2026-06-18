require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ['query', 'error'] });

  try {
    const influencer = await prisma.influencer.findUnique({
      where: { id: "cmq9xqh8g0000fwoj0p2sdm84" },
    });
    console.log("Found influencer:", influencer ? "YES, Name: " + influencer.influencerName : "NO");
    
    // Also check if recentPosts inclusion works without throwing Schema error
    try {
      const full = await prisma.influencer.findUnique({
        where: { id: "cmq9xqh8g0000fwoj0p2sdm84" },
        include: { recentPosts: true }
      });
      console.log("Include recentPosts success");
    } catch (e) {
      console.log("Include recentPosts failed:", e.message);
    }
  } catch (error) {
    console.error("Prisma Error:", error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
