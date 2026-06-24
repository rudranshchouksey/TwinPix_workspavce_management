import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main() {
  const { db } = await import("@/lib/db");
  const manager = await db.user.findFirst({ where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } } });
  await db.influencer.update({
    where: { instagramHandle: "test_maya_creator_qa" },
    data: { assignedManagerId: manager?.id },
  });
  console.log("manager set:", manager?.name);
  await db.$disconnect();
}
main();
