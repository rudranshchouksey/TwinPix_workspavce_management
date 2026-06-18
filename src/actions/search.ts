"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import Fuse from "fuse.js";

export type SearchResultType = "INFLUENCER" | "CLIENT" | "CAMPAIGN" | "TASK" | "USER";

export type SearchResultItem = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
};

export async function globalSearchAction(query: string): Promise<SearchResultItem[]> {
  await requireAuth();

  if (!query || query.trim().length === 0) {
    return [];
  }

  // Fetch basic metadata for all searchable entities
  const [influencers, clients, campaigns, tasks, users] = await Promise.all([
    db.influencer.findMany({ select: { id: true, influencerName: true, instagramHandle: true } }),
    db.client.findMany({ select: { id: true, companyName: true, contactPerson: true } }),
    db.campaign.findMany({ select: { id: true, name: true, client: { select: { companyName: true } } } }),
    db.task.findMany({ select: { id: true, title: true, campaign: { select: { name: true } } } }),
    db.user.findMany({ select: { id: true, name: true, email: true } }),
  ]);

  const searchData: SearchResultItem[] = [
    ...influencers.map(i => ({
      id: `inf_${i.id}`,
      type: "INFLUENCER" as const,
      title: i.influencerName || "Unnamed",
      subtitle: `Instagram • ${i.instagramHandle}`,
      href: `/influencers/${i.id}`,
    })),
    ...clients.map(c => ({
      id: `cli_${c.id}`,
      type: "CLIENT" as const,
      title: c.companyName,
      subtitle: c.contactPerson,
      href: `/clients/${c.id}`,
    })),
    ...campaigns.map(c => ({
      id: `cam_${c.id}`,
      type: "CAMPAIGN" as const,
      title: c.name,
      subtitle: `Brand: ${c.client?.companyName || 'Unknown'}`,
      href: `/campaigns/${c.id}`,
    })),
    ...tasks.map(t => ({
      id: `tsk_${t.id}`,
      type: "TASK" as const,
      title: t.title,
      subtitle: t.campaign ? `Campaign: ${t.campaign.name}` : undefined,
      href: `/tasks/${t.id}`,
    })),
    ...users.map(u => ({
      id: `usr_${u.id}`,
      type: "USER" as const,
      title: u.name || u.email,
      subtitle: u.email,
      href: `/team`, 
    })),
  ];

  const fuse = new Fuse(searchData, {
    keys: ["title", "subtitle"],
    threshold: 0.3,
    includeScore: true,
  });

  const results = fuse.search(query);
  return results.map(r => r.item).slice(0, 15); // Return top 15 matches
}
