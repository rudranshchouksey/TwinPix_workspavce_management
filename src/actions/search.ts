"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import Fuse from "fuse.js";

export type SearchResultType = "INFLUENCER" | "CLIENT" | "CAMPAIGN" | "TASK" | "USER" | "PROJECT" | "FILE" | "MESSAGE" | "SETTING";

export type SearchResultItem = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  metadata?: Record<string, any>;
};

export async function globalSearchAction(query: string): Promise<SearchResultItem[]> {
  await requireAuth();

  if (!query || query.trim().length === 0) {
    return [];
  }

  // Fetch basic metadata for all searchable entities
  const [influencers, clients, campaigns, tasks, users, projects, files, messages] = await Promise.all([
    db.influencer.findMany({ 
      select: { 
        id: true, influencerName: true, instagramHandle: true, email: true, phoneNumber: true, category: true, status: true, profileImage: true, followers: true, following: true, engagementRate: true, lastContactDate: true, negotiationTerms: true
      } 
    }),
    db.client.findMany({ select: { id: true, companyName: true, contactPerson: true } }),
    db.campaign.findMany({ select: { id: true, name: true, status: true, budget: true, client: { select: { companyName: true } } } }),
    db.task.findMany({ select: { id: true, title: true, status: true, dueDate: true, campaign: { select: { name: true } } } }),
    db.user.findMany({ select: { id: true, name: true, email: true, role: true, image: true } }),
    db.project.findMany({ select: { id: true, name: true, status: true, client: { select: { companyName: true } } } }),
    db.file.findMany({ select: { id: true, originalName: true, createdAt: true, mimeType: true } }),
    db.message.findMany({ select: { id: true, content: true, sender: { select: { name: true } }, createdAt: true } }),
  ]);

  const searchData: SearchResultItem[] = [
    ...influencers.map(i => {
      let tags: string[] = [];
      try {
        if (i.negotiationTerms) {
          const parsed = JSON.parse(i.negotiationTerms);
          if (parsed.tags) tags = parsed.tags;
        }
      } catch (e) {}

      return {
        id: `inf_${i.id}`,
        type: "INFLUENCER" as const,
        title: i.influencerName || i.instagramHandle,
        subtitle: `Instagram • ${i.instagramHandle}`,
        href: `/influencers/${i.id}`,
        metadata: {
          ...i,
          tags
        }
      };
    }),
    ...campaigns.map(c => ({
      id: `cam_${c.id}`,
      type: "CAMPAIGN" as const,
      title: c.name,
      subtitle: `Brand: ${c.client?.companyName || 'Unknown'}`,
      href: `/campaigns/${c.id}`,
      metadata: c,
    })),
    ...clients.map(c => ({
      id: `cli_${c.id}`,
      type: "CLIENT" as const,
      title: c.companyName,
      subtitle: c.contactPerson || "No contact",
      href: `/clients/${c.id}`,
      metadata: c,
    })),
    ...projects.map(p => ({
      id: `proj_${p.id}`,
      type: "PROJECT" as const,
      title: p.name,
      subtitle: p.client?.companyName || "Internal",
      href: `/projects`,
      metadata: p,
    })),
    ...tasks.map(t => ({
      id: `tsk_${t.id}`,
      type: "TASK" as const,
      title: t.title,
      subtitle: t.campaign ? `Campaign: ${t.campaign.name}` : undefined,
      href: `/tasks/${t.id}`,
      metadata: t,
    })),
    ...files.map(f => ({
      id: `file_${f.id}`,
      type: "FILE" as const,
      title: f.originalName,
      subtitle: `Uploaded on ${f.createdAt.toLocaleDateString()}`,
      href: `/files`,
      metadata: f,
    })),
    ...messages.map(m => ({
      id: `msg_${m.id}`,
      type: "MESSAGE" as const,
      title: `Message from ${m.sender.name || 'Unknown'}`,
      subtitle: m.content.substring(0, 50) + "...",
      href: `/messages`,
      metadata: m,
    })),
    ...users.map(u => ({
      id: `usr_${u.id}`,
      type: "USER" as const,
      title: u.name || u.email,
      subtitle: u.email,
      href: `/team`, 
      metadata: u,
    })),
    {
      id: "set_1",
      type: "SETTING",
      title: "Workspace Settings",
      subtitle: "Manage billing, team members, and preferences",
      href: "/settings"
    },
    {
      id: "set_2",
      type: "SETTING",
      title: "Profile Settings",
      subtitle: "Manage your personal information",
      href: "/settings/profile"
    }
  ];

  const fuse = new Fuse(searchData, {
    keys: [
      { name: "title", weight: 2.0 },
      { name: "subtitle", weight: 1.0 },
      { name: "metadata.instagramHandle", weight: 2.0 },
      { name: "metadata.email", weight: 1.5 },
      { name: "metadata.phoneNumber", weight: 1.0 },
      { name: "metadata.category", weight: 1.0 },
      { name: "metadata.tags", weight: 1.2 },
      { name: "metadata.status", weight: 0.5 },
      { name: "metadata.content", weight: 1.0 },
    ],
    threshold: 0.3,
    includeScore: true,
  });

  const rawResults = fuse.search(query).map(r => r.item);

  // Apply requested sorting order: 
  // 1 Influencers, 2 Campaigns, 3 Clients, 4 Projects, 5 Tasks, 6 Files, 7 Messages, 8 Team, 9 Settings.
  const typeOrder: Record<SearchResultType, number> = {
    "INFLUENCER": 1,
    "CAMPAIGN": 2,
    "CLIENT": 3,
    "PROJECT": 4,
    "TASK": 5,
    "FILE": 6,
    "MESSAGE": 7,
    "USER": 8,
    "SETTING": 9
  };

  rawResults.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return rawResults.slice(0, 25);
}
