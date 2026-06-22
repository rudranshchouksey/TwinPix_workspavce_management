"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
const prisma = db as any;
import { requireAuth, requireAdmin } from "@/lib/auth-utils";
import { influencerSchema, InfluencerInput } from "@/lib/validations/influencer";

// Get influencers with pagination and filters
export async function getInfluencersAction(
  search?: string,
  category?: string,
  status?: string,
  page: number = 1,
  limit: number = 50,
  sortBy: string = "createdAt",
  sortOrder: string = "desc"
) {
  await requireAuth();

  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { instagramHandle: { contains: search, mode: "insensitive" } },
      { influencerName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category && category !== "ALL") {
    where.category = category;
  }

  if (status && status !== "ALL") {
    where.status = status as any;
  }

  // Validate sortBy against allowed fields to prevent injection
  const allowedSortFields = [
    "createdAt", "influencerName", "instagramHandle", "followers",
    "following", "posts", "engagementRate", "category", "status",
    "location", "lastSyncDate",
  ];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const [influencers, total] = await Promise.all([
    prisma.influencer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [safeSortBy]: safeSortOrder },
    }),
    prisma.influencer.count({ where }),
  ]);

  return {
    influencers,
    totalPages: Math.ceil(total / limit),
    total,
  };
}

// Lightweight name-only lookup for page titles/breadcrumbs (avoids the heavy includes below)
export async function getInfluencerNameAction(id: string) {
  await requireAuth();
  return prisma.influencer.findUnique({
    where: { id },
    select: { influencerName: true, instagramHandle: true },
  });
}

// Get single influencer by ID
export async function getInfluencerByIdAction(id: string) {
  await requireAuth();

  const influencer = await prisma.influencer.findUnique({
    where: { id },
    include: {
      campaigns: {
        include: {
          campaign: true,
        },
      },
      recentPosts: {
        orderBy: { publishedDate: 'desc' },
        take: 12,
      },
      recentReels: {
        orderBy: { publishedDate: 'desc' },
        take: 12,
      },
      analytics: true,
    },
  });

  if (!influencer) {
    throw new Error("Influencer not found");
  }

  return influencer;
}

// Create new influencer
export async function createInfluencerAction(input: InfluencerInput) {
  const user = await requireAuth();

  const parsed = influencerSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  // Check if instagramHandle already exists
  const existing = await prisma.influencer.findUnique({
    where: { instagramHandle: parsed.data.instagramHandle },
  });

  if (existing) {
    throw new Error("Influencer with this handle already exists");
  }

  const influencer = await prisma.$transaction(async (tx: any) => {
    const newInfluencer = await tx.influencer.create({
      data: parsed.data,
    });

    await tx.auditLog.create({
      data: {
        action: "INFLUENCER_CREATED",
        entityType: "INFLUENCER",
        entityId: newInfluencer.id,
        adminId: user.id,
        details: `Created influencer @${newInfluencer.instagramHandle}`,
      },
    });

    return newInfluencer;
  }, {
    maxWait: 5000,
    timeout: 10000,
  });

  revalidatePath("/influencers");
  return influencer;
}

// Update existing influencer
export async function updateInfluencerAction(id: string, input: Partial<InfluencerInput>) {
  const user = await requireAuth();

  // Partial validation
  const partialSchema = influencerSchema.partial();
  const parsed = partialSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  if (parsed.data.instagramHandle) {
    const existing = await prisma.influencer.findFirst({
      where: {
        instagramHandle: parsed.data.instagramHandle,
        id: { not: id },
      },
    });

    if (existing) {
      throw new Error("Handle already taken by another influencer");
    }
  }

  const influencer = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.influencer.update({
      where: { id },
      data: parsed.data,
    });

    await tx.auditLog.create({
      data: {
        action: "INFLUENCER_UPDATED",
        entityType: "INFLUENCER",
        entityId: updated.id,
        adminId: user.id,
        details: `Updated influencer @${updated.instagramHandle}`,
      },
    });

    return updated;
  }, {
    maxWait: 5000,
    timeout: 10000,
  });

  revalidatePath("/influencers");
  revalidatePath(`/influencers/${id}`);
  return influencer;
}

// Delete influencer
export async function deleteInfluencerAction(id: string) {
  const user = await requireAdmin();

  await prisma.$transaction(async (tx: any) => {
    const influencer = await tx.influencer.findUnique({ where: { id } });
    if (!influencer) throw new Error("Influencer not found");

    // Explicitly cascade delete relations
    await tx.influencerPost.deleteMany({ where: { influencerId: id } });
    await tx.influencerReel.deleteMany({ where: { influencerId: id } });
    await tx.influencerContentAnalytics.deleteMany({ where: { influencerId: id } });
    await tx.campaignInfluencer.deleteMany({ where: { influencerId: id } });
    await tx.event.deleteMany({ where: { influencerId: id } });
    await tx.file.deleteMany({ where: { influencerId: id } });

    // Finally delete the influencer
    await tx.influencer.delete({
      where: { id },
    });

    await tx.auditLog.create({
      data: {
        action: "INFLUENCER_DELETED",
        entityType: "INFLUENCER",
        entityId: id,
        adminId: user.id,
        details: `Deleted influencer @${influencer.instagramHandle}`,
      },
    });
  }, {
    maxWait: 5000,
    timeout: 10000,
  });

  revalidatePath("/influencers");
}

// Get influencer stats for dashboard/analytics
export async function getInfluencerStatsAction() {
  await requireAuth();

  const total = await prisma.influencer.count();

  const activeCount = await prisma.influencer.count({
    where: { status: "ACTIVE" }
  });

  const categoryGroups = await prisma.influencer.groupBy({
    by: ['category'],
    _count: {
      category: true,
    },
  });

  const avgEngagement = await prisma.influencer.aggregate({
    _avg: {
      engagementRate: true,
      followers: true
    }
  });

  return {
    total,
    activeCount,
    categoryDistribution: categoryGroups,
    averageEngagementRate: avgEngagement._avg.engagementRate || 0,
    averageFollowers: Math.round(avgEngagement._avg.followers || 0),
  };
}

// Update influencer status inline (from detail page)
export async function updateInfluencerStatusAction(
  influencerId: string,
  status: "NEW_LEAD" | "CONTACTED" | "REPLIED" | "NEGOTIATING" | "ACTIVE" | "ONBOARDED" | "BLACKLISTED"
) {
  const user = await requireAuth();

  const validStatuses = ["NEW_LEAD", "CONTACTED", "REPLIED", "NEGOTIATING", "ACTIVE", "ONBOARDED", "BLACKLISTED"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const influencer = await prisma.$transaction(async (tx: any) => {
    const existing = await tx.influencer.findUnique({ where: { id: influencerId } });
    if (!existing) throw new Error("Influencer not found");

    const updated = await tx.influencer.update({
      where: { id: influencerId },
      data: { status },
    });

    await tx.auditLog.create({
      data: {
        action: "INFLUENCER_STATUS_CHANGED",
        entityType: "INFLUENCER",
        entityId: influencerId,
        adminId: user.id,
        details: `Changed status from ${existing.status} to ${status} for @${existing.instagramHandle}`,
      },
    });

    return updated;
  }, {
    maxWait: 5000, // default is 2000ms
    timeout: 10000, // default is 5000ms
  });

  revalidatePath("/influencers");
  revalidatePath(`/influencers/${influencerId}`);
  return influencer;
}

// Update influencer notes inline (from detail page)
export async function updateInfluencerNotesAction(
  influencerId: string,
  notes: string
) {
  await requireAuth();

  const updated = await prisma.influencer.update({
    where: { id: influencerId },
    data: { notes },
  });

  revalidatePath(`/influencers/${influencerId}`);
  return updated;
}

// Import influencer from scraped Instagram data
export async function importInstagramInfluencer(data: {
  username: string;
  fullName: string;
  bio: string | null;
  followers: number;
  following: number;
  posts: number;
  profileImageUrl: string | null;
  externalUrl: string | null;
  email: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  instagramUrl: string;
}) {
  const user = await requireAuth();

  const existing = await prisma.influencer.findFirst({
    where: {
      instagramHandle: {
        equals: data.username,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new Error(
      `Influencer @${data.username} already exists in the database.`
    );
  }

  let localImagePath: string | null = null;
  if (data.profileImageUrl) {
    try {
      const { downloadProfileImage } = await import("@/lib/instagram/image-downloader");
      localImagePath = await downloadProfileImage(
        data.profileImageUrl,
        data.username
      );
    } catch (error) {
      console.warn(
        `[Import] Failed to download profile image for @${data.username}:`,
        error
      );
      localImagePath = data.profileImageUrl; 
    }
  }

  const influencer = await prisma.$transaction(async (tx: any) => {
    const newInfluencer = await tx.influencer.create({
      data: {
        instagramHandle: data.username,
        influencerName: data.fullName,
        profileDescription: data.bio,
        profileImage: localImagePath,
        followers: data.followers,
        following: data.following,
        posts: data.posts,
        email: data.email,
        profileLink: data.externalUrl,
        platform: "Instagram",
        status: "NEW_LEAD",
      },
    });

    await tx.auditLog.create({
      data: {
        action: "INFLUENCER_IMPORTED",
        entityType: "INFLUENCER",
        entityId: newInfluencer.id,
        adminId: user.id,
        details: `Imported influencer @${data.username} from Instagram`,
      },
    });

    return newInfluencer;
  }, {
    maxWait: 5000,
    timeout: 10000,
  });

  revalidatePath("/influencers");
  return influencer;
}

// Bulk Import from CSV Data
export async function importInfluencersAction(data: any[]) {
  const user = await requireAuth();

  let imported = 0;
  let failed = 0;

  // Process in chunks of 50 to avoid connection limits
  const chunkSize = 50;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const handle = row["Instagram Handle"]?.trim().replace("@", "");
          if (!handle) {
            failed++;
            return;
          }

          let mappedStatus = "NEW_LEAD";
          const rowStatus = row["Status"]?.toUpperCase() || "";
          if (rowStatus.includes("CONTACTED")) mappedStatus = "CONTACTED";
          else if (rowStatus.includes("REPLIED")) mappedStatus = "REPLIED";
          else if (rowStatus.includes("NEGOTIATING")) mappedStatus = "NEGOTIATING";
          else if (rowStatus.includes("ACTIVE")) mappedStatus = "ACTIVE";
          else if (rowStatus.includes("ONBOARDED")) mappedStatus = "ONBOARDED";
          else if (rowStatus.includes("BLACKLISTED")) mappedStatus = "BLACKLISTED";

          // Parse numbers
          const parseNum = (str: string) => {
            if (!str) return null;
            const clean = str.replace(/,/g, '');
            const parsed = parseFloat(clean);
            return isNaN(parsed) ? null : parsed;
          };

          const followers = parseNum(row["Followers"]);
          const following = parseNum(row["Following"]);
          const posts = parseNum(row["Posts"]);
          let engagementRate = parseNum(row["Engagement Rate"]);
          if (engagementRate && row["Engagement Rate"]?.includes("%")) {
            // Already parsed as number
          }

          await prisma.influencer.upsert({
            where: { instagramHandle: handle },
            update: {}, // Don't override existing data on simple import
            create: {
              influencerName: row["Influencer Name"] || handle,
              instagramHandle: handle,
              platform: row["Platform"] || "Instagram",
              posts: posts,
              followers: followers,
              following: following,
              category: row["Category/Niche"],
              location: row["City/Country"],
              email: row["Email"],
              phoneNumber: row["Phone Number"],
              profileLink: row["Facebook/Profile Link"],
              profileDescription: row["Profile Description"],
              engagementRate: engagementRate,
              status: mappedStatus,
              notes: row["Notes"],
            },
          });
          imported++;
        } catch (e) {
          console.error("Failed to import row", row, e);
          failed++;
        }
      })
    );
  }

  await prisma.auditLog.create({
    data: {
      action: "INFLUENCER_IMPORTED",
      entityType: "INFLUENCER",
      entityId: "bulk",
      adminId: user.id,
      details: `Bulk imported ${imported} influencers from CSV`,
    },
  });

  revalidatePath("/influencers");
  return { imported, failed };
}