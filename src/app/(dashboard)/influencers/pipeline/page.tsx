import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { KanbanBoard } from "@/components/influencers/pipeline/kanban-board";
import { SectionHeader } from "@/components/dashboard/section-header";

export const metadata: Metadata = {
  title: "Influencer Pipeline",
  description: "Manage influencer outreach pipeline.",
};

export default async function PipelinePage() {
  await requireAuth();

  // Fetch all influencers to populate the board
  const influencers = await db.influencer.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Check if current user has admin rights for deletion permission
  const { checkRole } = await import("@/lib/auth-utils");
  const isAdmin = await checkRole("ADMIN");

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Influencer Pipeline"
        description="Drag and drop influencers across stages to manage your outreach pipeline."
      />
      
      <KanbanBoard initialData={influencers} isAdmin={isAdmin} />
    </div>
  );
}
