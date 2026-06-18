import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting data migration from InfluencerLead to Influencer...");

  const leads = await prisma.influencerLead.findMany();
  console.log(`Found ${leads.length} leads to migrate.`);

  let successCount = 0;
  let errorCount = 0;

  // Process in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < leads.length; i += chunkSize) {
    const chunk = leads.slice(i, i + chunkSize);
    
    await Promise.all(
      chunk.map(async (lead) => {
        try {
          let mappedStatus = "NEW_LEAD";
          if (lead.status) {
            const s = lead.status.toUpperCase();
            if (s.includes("CONTACTED")) mappedStatus = "CONTACTED";
            else if (s.includes("REPLIED")) mappedStatus = "REPLIED";
            else if (s.includes("NEGOTIATING")) mappedStatus = "NEGOTIATING";
            else if (s.includes("ACTIVE")) mappedStatus = "ACTIVE";
            else if (s.includes("ONBOARDED")) mappedStatus = "ONBOARDED";
            else if (s.includes("BLACKLISTED")) mappedStatus = "BLACKLISTED";
          }

          await prisma.influencer.upsert({
            where: { instagramHandle: lead.instagramHandle },
            update: {},
            create: {
              influencerName: lead.influencerName,
              instagramHandle: lead.instagramHandle,
              platform: lead.platform,
              posts: lead.posts,
              followers: lead.followers,
              following: lead.following,
              category: lead.categoryNiche,
              location: lead.cityCountry,
              email: lead.email,
              phoneNumber: lead.phoneNumber,
              profileLink: lead.facebookProfileLink,
              sampleVideoViews: lead.sampleVideoViews,
              profileDescription: lead.profileDescription,
              engagementRate: lead.engagementRate,
              status: mappedStatus as any,
              notes: lead.notes,
              createdAt: lead.dateAdded || lead.createdAt,
            },
          });
          successCount++;
        } catch (e) {
          console.error(`❌ Failed to migrate ${lead.instagramHandle}:`, e);
          errorCount++;
        }
      })
    );
    console.log(`Processed ${Math.min(i + chunkSize, leads.length)} / ${leads.length}`);
  }

  console.log(`\n✅ Migration Complete! Success: ${successCount}, Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
