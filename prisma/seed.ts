/**
 * prisma/seed.ts
 *
 * Seeds the two founding admin accounts.
 * Also imports Influencer Leads from CSV.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Admin accounts are defined via env vars (see .env.example) so real names,
// emails, and passwords are never hardcoded in source control.
function parseAdminsFromEnv() {
  const raw = process.env.SEED_ADMINS;
  if (!raw) {
    console.warn("⚠️  SEED_ADMINS not set — skipping admin seeding. See .env.example.");
    return [];
  }
  // Format: "Name 1:email1@example.com:password1,Name 2:email2@example.com:password2"
  return raw.split(",").map((entry) => {
    const [name, email, password] = entry.split(":");
    return { name: name?.trim(), email: email?.trim(), password: password?.trim() };
  }).filter((a) => a.name && a.email && a.password);
}

const ADMINS = parseAdminsFromEnv();

// ─── HELPER FUNCTIONS ────────────────────────────────────────

function cleanText(val?: string) {
  if (!val) return null;
  const clean = val.trim();
  if (
    clean === "(Not shown)" ||
    clean === "(Not listed)" ||
    clean === "(Add if avail.)" ||
    clean === "(Add if available)" ||
    clean === "(Add if known)" ||
    clean === "#ERROR!"
  ) {
    return null;
  }
  return clean === "" ? null : clean;
}

function parseNumber(val?: string) {
  const clean = cleanText(val);
  if (!clean) return null;
  let numStr = clean.replace(/,/g, "");
  let multiplier = 1;
  if (numStr.toUpperCase().endsWith("K")) {
    multiplier = 1000;
    numStr = numStr.slice(0, -1);
  } else if (numStr.toUpperCase().endsWith("M")) {
    multiplier = 1000000;
    numStr = numStr.slice(0, -1);
  }
  const num = parseFloat(numStr);
  return isNaN(num) ? null : Math.round(num * multiplier);
}

function parseFloatOrNull(val?: string) {
  const clean = cleanText(val);
  if (!clean) return null;
  let numStr = clean.replace(/,/g, "").replace(/%/g, "");
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

function parseDate(val?: string) {
  const clean = cleanText(val);
  if (!clean) return null;
  // Assuming DD/MM/YYYY
  const parts = clean.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  // Try default parse
  const defaultDate = new Date(clean);
  if (!isNaN(defaultDate.getTime())) return defaultDate;
  return null;
}

// ─── ZOD SCHEMA ──────────────────────────────────────────────

const InfluencerCSVRowSchema = z.object({
  "Influencer Name": z.string().optional(),
  "Instagram Handle": z.string().min(1, "Instagram Handle is required"),
  Platform: z.string().optional(),
  Posts: z.string().optional(),
  Followers: z.string().optional(),
  Following: z.string().optional(),
  "Category/Niche": z.string().optional(),
  "City/Country": z.string().optional(),
  Email: z.string().optional(),
  "Phone Number": z.string().optional(),
  "Facebook/Profile Link": z.string().optional(),
  "Sample Video Views": z.string().optional(),
  "Profile Description": z.string().optional(),
  "Engagement Rate": z.string().optional(),
  Status: z.string().optional(),
  "Date Added": z.string().optional(),
  Notes: z.string().optional(),
});

// ─── SEED FUNCTION ───────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding TwinPix Studio database...\n");

  // 1. Seed Admins
  for (const admin of ADMINS) {
    const existing = await prisma.user.findUnique({
      where: { email: admin.email },
    });

    if (existing) {
      console.log(`⚠️  Admin already exists: ${admin.email} — skipping`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(admin.password, 12);
    const user = await prisma.user.create({
      data: {
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        jobTitle: "Founder",
      },
    });

    console.log(`✅ Created admin: ${user.name} (${user.email})`);
  }

  // 2. Import Influencer Leads from CSV
  console.log("\n📦 Importing Influencer Leads...");
  const csvPath = path.join(__dirname, "data", "influencers.csv");

  if (!fs.existsSync(csvPath)) {
    console.log(`⚠️  CSV not found at ${csvPath}. Skipping influencer import.`);
  } else {
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Fetch existing handles to count skips accurately
    const existingLeads = await prisma.influencerLead.findMany({
      select: { instagramHandle: true },
    });
    const existingHandles = new Set(existingLeads.map((l) => l.instagramHandle.toLowerCase()));

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const validLeadsToCreate: any[] = [];

    for (const record of records) {
      // Validate
      const parsed = InfluencerCSVRowSchema.safeParse(record);
      if (!parsed.success) {
        failedCount++;
        continue;
      }

      const row = parsed.data;
      const handle = cleanText(row["Instagram Handle"]);

      if (!handle) {
        failedCount++;
        continue;
      }

      if (existingHandles.has(handle.toLowerCase())) {
        skippedCount++;
        continue;
      }

      // Add to batch
      validLeadsToCreate.push({
        influencerName: cleanText(row["Influencer Name"]),
        instagramHandle: handle,
        platform: cleanText(row["Platform"]),
        posts: parseNumber(row["Posts"]),
        followers: parseNumber(row["Followers"]),
        following: parseNumber(row["Following"]),
        categoryNiche: cleanText(row["Category/Niche"]),
        cityCountry: cleanText(row["City/Country"]),
        email: cleanText(row["Email"]),
        phoneNumber: cleanText(row["Phone Number"]),
        facebookProfileLink: cleanText(row["Facebook/Profile Link"]),
        sampleVideoViews: cleanText(row["Sample Video Views"]),
        profileDescription: cleanText(row["Profile Description"]),
        engagementRate: parseFloatOrNull(row["Engagement Rate"]),
        status: cleanText(row["Status"]) || "Not Contacted",
        dateAdded: parseDate(row["Date Added"]),
        notes: cleanText(row["Notes"]),
      });
      
      // Mark as existing so duplicates within the CSV itself are skipped
      existingHandles.add(handle.toLowerCase());
    }

    if (validLeadsToCreate.length > 0) {
      const result = await prisma.influencerLead.createMany({
        data: validLeadsToCreate,
        skipDuplicates: true,
      });
      importedCount = result.count;
    }

    console.log(`📊 Import Summary:`);
    console.log(`   - Imported: ${importedCount}`);
    console.log(`   - Skipped (Duplicates): ${skippedCount}`);
    console.log(`   - Failed (Validation): ${failedCount}`);
  }

  console.log("\n🎉 Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
