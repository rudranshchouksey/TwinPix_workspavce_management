"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  ExternalLink,
  Edit,
  Copy,
  UserPlus,
  Sparkles,
  Archive,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "./confirm-dialog";
import { duplicateCampaignAction, archiveCampaignAction, deleteCampaignAction } from "@/actions/campaigns";

interface CampaignQuickActionsProps {
  campaign: any;
  onEdit: (campaign: any) => void;
  onAddInfluencers: (campaign: any) => void;
  onGenerateBrief: (campaign: any) => void;
  triggerClassName?: string;
}

export function CampaignQuickActions({
  campaign,
  onEdit,
  onAddInfluencers,
  onGenerateBrief,
  triggerClassName,
}: CampaignQuickActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDuplicate = async () => {
    try {
      await duplicateCampaignAction(campaign.id);
      toast.success(`Duplicated "${campaign.name}"`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate campaign");
    }
  };

  const handleArchive = async () => {
    try {
      await archiveCampaignAction(campaign.id);
      toast.success(`Archived "${campaign.name}"`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to archive campaign");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCampaignAction(campaign.id);
      toast.success(`Deleted "${campaign.name}"`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete campaign");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={
            triggerClassName ||
            "inline-flex items-center justify-center rounded-md h-7 w-7 text-[var(--color-text-muted)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[var(--color-text-primary)] transition-colors"
          }
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem className="cursor-pointer p-0">
            <Link href={`/campaigns/${campaign.id}`} className="flex w-full items-center gap-1.5 px-1.5 py-1">
              <ExternalLink className="h-4 w-4 text-[var(--color-text-muted)]" />
              View Campaign
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(campaign)}>
            <Edit className="h-4 w-4 text-[var(--color-text-muted)]" />
            Edit Campaign
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="h-4 w-4 text-[var(--color-text-muted)]" />
            Duplicate Campaign
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddInfluencers(campaign)}>
            <UserPlus className="h-4 w-4 text-[var(--color-text-muted)]" />
            Add Influencers
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onGenerateBrief(campaign)}>
            <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
            Generate AI Brief
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="h-4 w-4 text-[var(--color-text-muted)]" />
            Archive Campaign
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete Campaign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this campaign?"
        description={`"${campaign.name}" and all its influencer assignments, tasks links, and activity history will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Campaign"
        onConfirm={handleDelete}
      />
    </>
  );
}
