"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Copy,
  Activity,
  ExternalLink,
  Camera,
  Check,
  Phone,
  Briefcase,
  PlusCircle,
  History
} from "lucide-react";
import { AddToCampaignModal } from "./campaigns/add-to-campaign-modal";
import { EditInfluencerModal } from "./edit/EditInfluencerModal";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { updateInfluencerStatusAction, deleteInfluencerAction } from "@/actions/influencers";

export type InfluencerSummary = {
  id: string;
  instagramHandle: string;
  influencerName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  profileLink?: string | null;
  status: "NEW_LEAD" | "CONTACTED" | "REPLIED" | "NEGOTIATING" | "ACTIVE" | "ONBOARDED" | "BLACKLISTED" | string;
};

interface InfluencerActionsDropdownProps {
  influencer: InfluencerSummary;
  isAdmin: boolean;
  align?: "center" | "end" | "start";
}

const STATUS_OPTIONS = [
  { value: "NEW_LEAD", label: "New Lead", color: "text-sky-600" },
  { value: "CONTACTED", label: "Contacted", color: "text-amber-600" },
  { value: "REPLIED", label: "Replied", color: "text-violet-600" },
  { value: "NEGOTIATING", label: "Negotiating", color: "text-orange-600" },
  { value: "ACTIVE", label: "Active", color: "text-emerald-600" },
  { value: "ONBOARDED", label: "Onboarded", color: "text-emerald-600" },
  { value: "BLACKLISTED", label: "Blacklisted", color: "text-red-600" },
] as const;

export function InfluencerActionsDropdown({ influencer, isAdmin, align = "end" }: InfluencerActionsDropdownProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAddToCampaignOpen, setIsAddToCampaignOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInfluencerAction(influencer.id);
      toast.success("Influencer deleted successfully.");
      setIsDeleteDialogOpen(false);
      // Wait a tiny bit before router refresh so user sees success toast
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete influencer.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === influencer.status || isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateInfluencerStatusAction(influencer.id, newStatus as any);
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="h-8 w-8 focus-visible:ring-1" />}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-56">
          <DropdownMenuItem onClick={() => router.push(`/influencers/${influencer.id}`)}>
            <Activity className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>

          {/* Edit Influencer — opens modal */}
          <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Influencer</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Campaigns</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => router.push(`/campaigns?create=true&influencerId=${influencer.id}`)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Create Campaign</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAddToCampaignOpen(true)}>
                <Briefcase className="mr-2 h-4 w-4" />
                <span>Add to Existing...</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/influencers/${influencer.id}#campaign-history`)}>
                <History className="mr-2 h-4 w-4" />
                <span>View History</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Activity className="mr-2 h-4 w-4" />
              <span>Change Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className="flex items-center justify-between"
                  disabled={isUpdatingStatus}
                >
                  <span className={status.color}>{status.label}</span>
                  {influencer.status === status.value && <Check className="h-4 w-4 opacity-50" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => handleCopy(influencer.instagramHandle, "Instagram Handle")}>
            {copiedField === "Instagram Handle" ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
            <span>Copy Instagram Handle</span>
          </DropdownMenuItem>

          {influencer.email && (
            <DropdownMenuItem onClick={() => handleCopy(influencer.email!, "Email")}>
              {copiedField === "Email" ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Mail className="mr-2 h-4 w-4" />}
              <span>Copy Email</span>
            </DropdownMenuItem>
          )}

          {influencer.phoneNumber && (
            <DropdownMenuItem onClick={() => handleCopy(influencer.phoneNumber!, "Phone Number")}>
              {copiedField === "Phone Number" ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Phone className="mr-2 h-4 w-4" />}
              <span>Copy Phone</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => window.open(`https://instagram.com/${influencer.instagramHandle.replace("@", "")}`, "_blank")}
          >
            <Camera className="mr-2 h-4 w-4" />
            <span>Open Instagram Profile</span>
          </DropdownMenuItem>

          {influencer.profileLink && (
            <DropdownMenuItem onClick={() => window.open(influencer.profileLink!, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Open External Link</span>
            </DropdownMenuItem>
          )}

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Influencer</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent showCloseButton={!isDeleting}>
          <DialogHeader>
            <DialogTitle>Delete Influencer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>@{influencer.instagramHandle}</strong>?
              This action cannot be undone. All related posts, reels, metrics, and campaign relations will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddToCampaignModal 
        influencerId={influencer.id}
        isOpen={isAddToCampaignOpen}
        onClose={() => setIsAddToCampaignOpen(false)}
        existingCampaignIds={[]}
      />

      <EditInfluencerModal
        influencerId={influencer.id}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
