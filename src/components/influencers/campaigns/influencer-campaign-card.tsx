"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Calendar, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  ExternalLink,
  Target,
  BarChart,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { removeInfluencerFromCampaignAction } from "@/actions/influencer-campaigns";
import { toast } from "sonner";
import { useState } from "react";

interface InfluencerCampaignCardProps {
  assignment: any; // CampaignInfluencer relation with campaign included
  isAdmin?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
    case 'PAID':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'ACTIVE':
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'NEGOTIATING':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'INVITED':
    case 'PENDING':
      return 'bg-stone-100 text-stone-800 border-stone-200';
    case 'CONTENT_PENDING':
    case 'CONTENT_SUBMITTED':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-stone-100 text-stone-800 border-stone-200';
  }
};

export function InfluencerCampaignCard({ assignment, isAdmin }: InfluencerCampaignCardProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const { campaign } = assignment;

  let metrics = null;
  try {
    if (assignment.performanceMetrics) {
      metrics = JSON.parse(assignment.performanceMetrics);
    }
  } catch (e) {
    // Ignore parse error
  }

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove this influencer from ${campaign.name}?`)) return;
    
    setIsRemoving(true);
    try {
      await removeInfluencerFromCampaignAction(campaign.id, assignment.influencerId);
      toast.success("Influencer removed from campaign");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove from campaign");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs font-semibold text-[var(--color-brand-600)] mb-1 flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              {campaign.client?.companyName || "Unknown Client"}
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">
              {campaign.name}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="h-8 w-8" />}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push(`/campaigns/${campaign.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/campaigns/${campaign.id}?edit=true`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Campaign
                </DropdownMenuItem>
                {campaign.client && (
                  <DropdownMenuItem onClick={() => router.push(`/clients/${campaign.client.id}`)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Client
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      variant="destructive" 
                      onClick={handleRemove}
                      disabled={isRemoving}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove from Campaign
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={`${getStatusColor(assignment.status)} border`}>
            {assignment.status.replace(/_/g, ' ')}
          </Badge>
          <Badge variant="outline" className="bg-stone-50">
            <Calendar className="w-3 h-3 mr-1.5 text-stone-500" />
            {format(new Date(assignment.createdAt), "MMM d, yyyy")}
          </Badge>
        </div>

        {assignment.deliverables && (
          <div className="mb-4 text-sm text-[var(--color-text-secondary)] line-clamp-2">
            <strong>Deliverables:</strong> {assignment.deliverables}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-[var(--color-border)]">
          <div>
            <div className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3" /> Fee
            </div>
            <div className="font-bold text-[var(--color-text-primary)]">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(assignment.fee || 0)}
            </div>
          </div>

          {metrics ? (
            <div>
              <div className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1 mb-1">
                <BarChart className="w-3 h-3" /> Views / ROI
              </div>
              <div className="font-bold text-[var(--color-text-primary)] flex gap-2">
                <span>{metrics.views ? new Intl.NumberFormat('en-US', { notation: 'compact' }).format(metrics.views) : '—'}</span>
                {metrics.roi && <span className="text-emerald-600">({metrics.roi}x)</span>}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1 mb-1">
                <BarChart className="w-3 h-3" /> Performance
              </div>
              <div className="text-sm font-medium text-[var(--color-text-muted)]">
                Pending
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-stone-50 px-5 py-3 border-t border-[var(--color-border)] flex justify-between items-center">
        <div className="text-xs font-medium text-[var(--color-text-muted)]">
          {campaign.startDate && campaign.endDate 
            ? `${format(new Date(campaign.startDate), "MMM d")} - ${format(new Date(campaign.endDate), "MMM d, yyyy")}` 
            : "No dates set"}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)] -mr-2 h-7 px-2"
          onClick={() => router.push(`/campaigns/${campaign.id}`)}
        >
          View Details
        </Button>
      </div>
    </motion.div>
  );
}
