import "dotenv/config";
import { db } from "./src/lib/db";

const prisma = db as any;

async function main() {
  const admin = await prisma.user.findFirst({ where: { email: "rudranshchouksey@gmail.com" } });
  const divyani = await prisma.user.findFirst({ where: { email: "divyanijaiswal0810@gmail.com" } });
  if (!admin) throw new Error("admin not found");

  const influencers = await prisma.influencer.findMany({ take: 8, orderBy: { followers: "desc" } });
  if (influencers.length < 4) throw new Error("not enough influencers");

  const client1 = await prisma.client.create({
    data: { companyName: "Nykaa Beauty [TEST]", brandName: "Nykaa", industry: "Beauty", status: "ACTIVE", email: "test-nykaa@example.com", contactPerson: "Test Contact" },
  });
  const client2 = await prisma.client.create({
    data: { companyName: "Wanderlust Travels [TEST]", brandName: "Wanderlust", industry: "Travel", status: "ACTIVE", email: "test-wanderlust@example.com", contactPerson: "Test Contact" },
  });

  const now = new Date();
  const days = (n: number) => new Date(now.getTime() + n * 86400000);

  const campaignsData = [
    { name: "Summer Glow Launch [TEST]", clientId: client1.id, budget: 85000, status: "ACTIVE", startDate: days(-10), endDate: days(2), deliverables: "3 Reels, 2 Stories per creator" },
    { name: "Monsoon Skincare Push [TEST]", clientId: client1.id, budget: 42000, status: "ACTIVE", startDate: days(-5), endDate: days(20), deliverables: "1 Reel per creator" },
    { name: "Festive Glam Collab [TEST]", clientId: client1.id, budget: 120000, status: "PLANNING", startDate: days(5), endDate: days(45), deliverables: "TBD" },
    { name: "Himalayan Escape [TEST]", clientId: client2.id, budget: 65000, status: "REVIEW", startDate: days(-30), endDate: days(-2), deliverables: "2 Reels, 1 Vlog" },
    { name: "Backpacker Diaries [TEST]", clientId: client2.id, budget: 30000, status: "COMPLETED", startDate: days(-60), endDate: days(-20), deliverables: "1 Vlog per creator" },
    { name: "Coastal Roadtrip [TEST]", clientId: client2.id, budget: 18000, status: "ACTIVE", startDate: days(-3), endDate: days(6), deliverables: "1 Reel" },
  ];

  const created = [];
  for (const c of campaignsData) {
    const campaign = await prisma.campaign.create({ data: c as any });
    created.push(campaign);
  }

  // Assign influencers with varied statuses
  await prisma.campaignInfluencer.create({ data: { campaignId: created[0].id, influencerId: influencers[0].id, fee: 15000, status: "DELIVERED" } });
  await prisma.campaignInfluencer.create({ data: { campaignId: created[0].id, influencerId: influencers[1].id, fee: 12000, status: "IN_PROGRESS" } });
  await prisma.campaignInfluencer.create({ data: { campaignId: created[0].id, influencerId: influencers[2].id, fee: 10000, status: "PENDING" } });

  await prisma.campaignInfluencer.create({ data: { campaignId: created[1].id, influencerId: influencers[3].id, fee: 8000, status: "ACCEPTED" } });

  await prisma.campaignInfluencer.create({ data: { campaignId: created[3].id, influencerId: influencers[4].id, fee: 20000, status: "DELIVERED" } });
  await prisma.campaignInfluencer.create({ data: { campaignId: created[3].id, influencerId: influencers[5].id, fee: 18000, status: "DELIVERED" } });

  await prisma.campaignInfluencer.create({ data: { campaignId: created[4].id, influencerId: influencers[6].id, fee: 9000, status: "DELIVERED" } });

  // campaign 2 (index 2, PLANNING) gets zero influencers on purpose -> triggers "needs attention" only if ACTIVE; let's also make campaign[5] ACTIVE with zero influencers for attention insight
  // created[5] Coastal Roadtrip is ACTIVE with 0 influencers already (intentional)

  // Team member manager assignment
  if (divyani) {
    await prisma.campaignTeamMember.create({ data: { campaignId: created[0].id, userId: divyani.id, role: "MANAGER" } });
    await prisma.campaignTeamMember.create({ data: { campaignId: created[3].id, userId: divyani.id, role: "MANAGER" } });
  }

  // Tasks (deliverables count) - some overdue
  await prisma.task.create({ data: { title: "Brief creators on hashtag [TEST]", priority: "HIGH", status: "TODO", campaignId: created[0].id, authorId: admin.id, dueDate: days(-1) } });
  await prisma.task.create({ data: { title: "Collect content drafts [TEST]", priority: "MEDIUM", status: "IN_PROGRESS", campaignId: created[0].id, authorId: admin.id, dueDate: days(3) } });
  await prisma.task.create({ data: { title: "Final review [TEST]", priority: "MEDIUM", status: "TODO", campaignId: created[3].id, authorId: admin.id, dueDate: days(-5) } });
  await prisma.task.create({ data: { title: "Send payment [TEST]", priority: "LOW", status: "DONE", campaignId: created[4].id, authorId: admin.id, dueDate: days(-15) } });

  // Activity logs
  await prisma.campaignActivity.create({ data: { campaignId: created[0].id, userId: admin.id, type: "CAMPAIGN_CREATED", details: "Campaign created by Rudransh" } });
  await prisma.campaignActivity.create({ data: { campaignId: created[3].id, userId: admin.id, type: "STATUS_CHANGED", details: "Status changed from ACTIVE to REVIEW" } });

  console.log("Seeded:", created.map((c) => c.id));
  console.log("Client IDs:", client1.id, client2.id);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
