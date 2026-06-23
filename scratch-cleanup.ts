import "dotenv/config";
import { db } from "./src/lib/db";

async function main() {
  const prisma = db as any;
  const testClients = await prisma.client.findMany({
    where: { companyName: { contains: "TEST - delete me" } },
    select: { id: true, companyName: true },
  });
  console.log("Found test clients:", testClients);
  for (const c of testClients) {
    await prisma.client.delete({ where: { id: c.id } });
    console.log("Deleted:", c.companyName);
  }
}

main().catch((e) => console.error(e)).finally(() => process.exit(0));
