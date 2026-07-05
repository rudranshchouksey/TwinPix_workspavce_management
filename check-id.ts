import { db } from "./src/lib/db";
const prisma = db as any;

async function check() {
  const id = "cmqpefaog008f04lapakvjty6";
  console.log("Checking ID:", id);
  const influencer = await prisma.influencer.findUnique({
    where: { id }
  });
  console.log("Result:", influencer ? "FOUND: " + influencer.influencerName : "NOT FOUND");
}
check().catch(console.error).finally(() => process.exit(0));
