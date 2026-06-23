"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AtSign,
  ExternalLink,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Copy,
  Mail,
  Globe,
  ChevronDown,
  NotebookPen,
  Briefcase,
  Check,
  Sparkles,
} from "lucide-react";
import { CreateCampaignModal } from "./campaigns/create-campaign-modal";
import { GenerateOutreachModal } from "./generate-outreach-modal";
import { syncInfluencerAction } from "@/actions/instagram-sync";
import { updateInfluencerStatusAction } from "@/actions/influencers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { InfluencerActionsDropdown } from "./influencer-actions-dropdown";

interface CreatorHeroProps {
  influencer: any;
  isAdmin?: boolean;
}

const STATUS_OPTIONS = [
  { value: "NEW_LEAD", label: "New Lead", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "CONTACTED", label: "Contacted", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "REPLIED", label: "Replied", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "NEGOTIATING", label: "Negotiating", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "ACTIVE", label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "ONBOARDED", label: "Onboarded", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "BLACKLISTED", label: "Blacklisted", color: "bg-red-50 text-red-700 border-red-200" },
] as const;

export function CreatorHero({ influencer, isAdmin = false }: CreatorHeroProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isGenerateOutreachOpen, setIsGenerateOutreachOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Format numbers — fixed to handle 0 correctly
  const formatNumber = (num?: number | null) => {
    if (num === undefined || num === null) return "—";
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Status management
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === influencer.status) || STATUS_OPTIONS[0];

  const handleStatusChange = (newStatus: string) => {
    setShowStatusDropdown(false);
    if (newStatus === influencer.status) return;

    startTransition(async () => {
      try {
        await updateInfluencerStatusAction(influencer.id, newStatus as any);
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        router.refresh();
      } catch (error: any) {
        toast.error(`Failed to update status: ${error.message}`);
      }
    });
  };

  // Sync action
  const handleSync = async () => {
    setIsSyncing(true);
    toast.info("Syncing Instagram data... This may take a moment.");

    try {
      const result = await syncInfluencerAction(influencer.id);
      if (result.success) {
        const details = result.details;
        toast.success(
          `Synced via ${details?.source || "provider"}: ${details?.contentSynced.posts || 0} posts, ${details?.contentSynced.reels || 0} reels`
        );
        router.refresh();
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Unexpected error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy actions
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative rounded-3xl overflow-hidden bg-white border border-[var(--color-border)] shadow-sm col-span-12"
    >
      {/* Premium Cover Banner */}
      <div className="h-48 w-full bg-gradient-to-r from-violet-100 via-indigo-50 to-sky-100 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,white)] opacity-60" />
      </div>

      <div className="px-8 pb-8 pt-0 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16">
          {/* Large Avatar with fallback */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg shrink-0 flex items-center justify-center relative"
          >
            {influencer.profileImage ? (
              <Image
                src={influencer.profileImage}
                alt={influencer.influencerName || "Unnamed"}
                fill
                unoptimized
                className="object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-violet-100 to-indigo-200 flex items-center justify-center"><span class="text-4xl font-bold text-violet-600">${influencer.instagramHandle.substring(0, 2).toUpperCase()}</span></div>`;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-100 to-indigo-200 flex items-center justify-center">
                <span className="text-4xl font-bold text-violet-600">
                  {influencer.instagramHandle.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Verified Badge */}
            <div className="absolute bottom-2 right-2 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-sky-500 fill-sky-500/20" />
            </div>
          </motion.div>

          {/* Primary Details */}
          <div className="flex-1 space-y-2 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                  {influencer.influencerName || "Unnamed Influencer"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <a
                    href={`https://instagram.com/${influencer.instagramHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-[var(--color-brand-600)] font-semibold hover:text-[var(--color-brand-700)] transition-colors group"
                  >
                    <AtSign className="w-4 h-4 mr-1" />
                    {influencer.instagramHandle}
                    <ExternalLink className="w-3 h-3 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>

                  {influencer.location && (
                    <div className="flex items-center text-sm font-medium text-[var(--color-text-muted)]">
                      <MapPin className="w-4 h-4 mr-1 text-[var(--color-text-secondary)]" />
                      {influencer.location}
                    </div>
                  )}

                  {influencer.category && (
                    <Badge
                      variant="secondary"
                      className="bg-stone-100 text-stone-600 font-medium hover:bg-stone-200 transition-colors"
                    >
                      {influencer.category}
                    </Badge>
                  )}

                  {/* Inline Status Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      disabled={isPending}
                      className={`${currentStatus.color} rounded-full font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 border flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50`}
                    >
                      {isPending ? "Saving..." : currentStatus.label}
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showStatusDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowStatusDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.95 }}
                          className="absolute top-full left-0 mt-2 z-50 bg-white border border-[var(--color-border)] rounded-2xl shadow-lg overflow-hidden min-w-[180px]"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(option.value)}
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-stone-50 transition-colors flex items-center justify-between gap-3"
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${option.color.split(" ")[0].replace("bg-", "bg-")}`}
                                  style={{
                                    backgroundColor:
                                      option.value === "NEW_LEAD" ? "#0ea5e9"
                                        : option.value === "CONTACTED" ? "#f59e0b"
                                        : option.value === "REPLIED" ? "#8b5cf6"
                                        : option.value === "NEGOTIATING" ? "#f97316"
                                        : option.value === "ACTIVE" || option.value === "ONBOARDED" ? "#10b981"
                                        : "#ef4444",
                                  }}
                                />
                                {option.label}
                              </span>
                              {option.value === influencer.status && (
                                <Check className="w-4 h-4 text-emerald-500" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  onClick={() => setIsCreateCampaignOpen(true)}
                  variant="outline"
                  className="rounded-full border-[var(--color-brand-600)] text-[var(--color-brand-600)] font-bold px-4 bg-white hover:bg-[var(--color-brand-50)] shadow-sm"
                  size="sm"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>

                <Button
                  onClick={() => setIsGenerateOutreachOpen(true)}
                  variant="outline"
                  className="rounded-full border-[var(--color-brand-600)] text-[var(--color-brand-600)] font-bold px-4 bg-white hover:bg-[var(--color-brand-50)] shadow-sm"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Outreach
                </Button>

                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white shadow-sm rounded-full font-bold px-4"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync"}
                </Button>

                <div className="ml-1 border border-[var(--color-border)] rounded-full shadow-sm bg-white">
                  <InfluencerActionsDropdown influencer={influencer} isAdmin={isAdmin} align="end" />
                </div>

                {influencer.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[var(--color-border)] font-bold"
                    onClick={() => copyToClipboard(influencer.email, "Email")}
                  >
                    <Mail className="w-4 h-4 mr-1.5" />
                    Copy Email
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[var(--color-border)] font-bold"
                  onClick={() =>
                    window.open(
                      `https://instagram.com/${influencer.instagramHandle}`,
                      "_blank"
                    )
                  }
                >
                  <Globe className="w-4 h-4 mr-1.5" />
                  Instagram
                </Button>
              </div>
            </div>

            {/* Bio with newline preservation */}
            <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed max-w-3xl font-medium mt-4 whitespace-pre-line">
              {influencer.profileDescription || "No bio provided."}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[var(--color-border)] my-6" />

        {/* Hero Quick Stats — with Following added and 0-safe formatting */}
        <div className="flex items-center gap-12 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Followers
            </span>
            <span className="text-2xl font-black text-[var(--color-text-primary)]">
              {formatNumber(influencer.followers)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Following
            </span>
            <span className="text-2xl font-black text-[var(--color-text-primary)]">
              {formatNumber(influencer.following)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Engagement Rate
            </span>
            <span className="text-2xl font-black text-[var(--color-brand-600)]">
              {influencer.engagementRate != null
                ? `${influencer.engagementRate.toFixed(2)}%`
                : "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Avg Views
            </span>
            <span className="text-2xl font-black text-[var(--color-text-primary)]">
              {formatNumber(influencer.analytics?.avgReelViews)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Total Posts
            </span>
            <span className="text-2xl font-black text-[var(--color-text-primary)]">
              {formatNumber(influencer.posts)}
            </span>
          </div>
          {influencer.lastSyncDate && (
            <div className="flex flex-col gap-1 ml-auto">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Last Sync
              </span>
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                {new Date(influencer.lastSyncDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <CreateCampaignModal
        influencerId={influencer.id}
        open={isCreateCampaignOpen}
        onOpenChange={setIsCreateCampaignOpen}
      />

      <GenerateOutreachModal
        influencerId={influencer.id}
        influencerName={influencer.influencerName || influencer.instagramHandle}
        isOpen={isGenerateOutreachOpen}
        onClose={() => setIsGenerateOutreachOpen(false)}
      />
    </motion.div>
  );
}
