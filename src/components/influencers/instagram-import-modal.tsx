"use client";

/**
 * Instagram Import Modal
 *
 * Full-flow modal for importing influencer profiles from Instagram.
 * States: Input → Loading → Preview → Saving → Success/Error
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  UserPlus,
  Grid3X3,
  ExternalLink,
  Mail,
  RefreshCw,
  Download,
  Shield,
  ShieldCheck,
  Globe,
  X,
} from "lucide-react";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { importInstagramInfluencer } from "@/actions/influencers";
import type { ParsedInstagramProfile, InstagramImportState, InstagramErrorCode } from "@/lib/instagram/types";
import { InstagramScraperError } from "@/lib/instagram/types";
import { useRouter } from "next/navigation";

// ─── Sub-Components ──────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.06)] p-3 min-w-0">
      <Icon className="h-4 w-4 text-[var(--color-text-muted)]" />
      <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
        {label}
      </span>
    </div>
  );
}

function SkeletonPreview() {
  return (
    <div className="animate-pulse space-y-4 py-2">
      {/* Profile header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-[rgba(0,0,0,0.08)] shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded-md bg-[rgba(0,0,0,0.08)] shimmer" />
          <div className="h-3 w-24 rounded-md bg-[rgba(0,0,0,0.06)] shimmer" />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-[rgba(0,0,0,0.05)] shimmer" />
        ))}
      </div>
      {/* Bio skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-md bg-[rgba(0,0,0,0.06)] shimmer" />
        <div className="h-3 w-3/4 rounded-md bg-[rgba(0,0,0,0.05)] shimmer" />
      </div>
    </div>
  );
}

// ─── Format Helpers ──────────────────────────────────────────

function formatCount(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// ─── Main Component ──────────────────────────────────────────

interface InstagramImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstagramImportModal({ open, onOpenChange }: InstagramImportModalProps) {
  const router = useRouter();
  const [state, setState] = useState<InstagramImportState>({ step: "input" });
  const [usernameInput, setUsernameInput] = useState("");

  const resetState = useCallback(() => {
    setState({ step: "input" });
    setUsernameInput("");
  }, []);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      // Allow closing in any state except saving
      if (state.step === "saving") return;
      resetState();
    }
    onOpenChange(isOpen);
  }, [state.step, onOpenChange, resetState]);

  // ── Fetch Profile ──
  const handleFetchProfile = useCallback(async () => {
    const username = usernameInput.trim().replace(/^@/, "");
    if (!username) return;

    setState({ step: "loading", username });

    try {
      const response = await fetch("/api/instagram/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (!response.ok) {
        setState({
          step: "error",
          username,
          errorCode: result.code || "UNKNOWN",
          errorMessage: result.error || "Failed to fetch profile",
        });
        return;
      }

      setState({
        step: "preview",
        username,
        data: result.data,
      });
    } catch (error) {
      setState({
        step: "error",
        username,
        errorCode: "NETWORK_ERROR",
        errorMessage: "Could not connect to the server. Please check your connection.",
      });
    }
  }, [usernameInput]);

  // ── Import Profile ──
  const handleImport = useCallback(async () => {
    if (state.step !== "preview") return;
    const { data, username } = state;

    setState({ step: "saving", username, data });

    try {
      await importInstagramInfluencer(data);

      setState({ step: "success", username });

      toast.success("Influencer Imported", {
        description: `@${username} has been added to your database.`,
        duration: 4000,
      });

      // Close and reset after brief delay
      setTimeout(() => {
        handleClose(false);
        router.refresh();
      }, 1200);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to save the influencer. Please try again.";

      // If it's a duplicate error, show specific state
      const isDuplicate = message.includes("already exists");

      setState({
        step: "error",
        username,
        errorCode: isDuplicate ? "NOT_FOUND" : "UNKNOWN",
        errorMessage: message,
      });

      toast.error("Import Failed", {
        description: message,
        duration: 5000,
      });
    }
  }, [state, handleClose, router]);

  // ── Retry ──
  const handleRetry = useCallback(() => {
    if (state.step === "error") {
      setUsernameInput(state.username);
      setState({ step: "input" });
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:!max-w-[480px] bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)] overflow-hidden"
      >
        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] shadow-lg shadow-[#E1306C]/20">
              <InstagramIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[var(--color-text-primary)] text-base font-semibold">
                Import from Instagram
              </DialogTitle>
              <DialogDescription className="text-[var(--color-text-muted)] text-xs mt-0.5">
                Enter a public Instagram username to import their profile data.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Content by State ── */}
        <div className="min-h-[180px]">
          {/* INPUT STATE */}
          {state.step === "input" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm font-medium select-none">
                  @
                </span>
                <Input
                  id="instagram-username-input"
                  placeholder="username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFetchProfile();
                  }}
                  className="pl-8 bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus-visible:ring-[#E1306C]/50 h-11 text-sm"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                You can enter a username, @handle, or full Instagram profile URL.
                Only public profiles can be imported.
              </p>
            </div>
          )}

          {/* LOADING STATE */}
          {state.step === "loading" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.06)] px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-[#E1306C]" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Fetching profile for <span className="font-medium text-[var(--color-text-primary)]">@{state.username}</span>…
                </span>
              </div>
              <SkeletonPreview />
            </div>
          )}

          {/* PREVIEW STATE */}
          {(state.step === "preview" || state.step === "saving") && (
            <ProfilePreview
              data={state.data}
              isSaving={state.step === "saving"}
            />
          )}

          {/* ERROR STATE */}
          {state.step === "error" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-start gap-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] px-4 py-4">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium text-red-300">
                    Import Failed
                  </p>
                  <p className="text-xs text-red-300/70 leading-relaxed">
                    {state.errorMessage}
                  </p>
                </div>
              </div>
              {/* Contextual error icon */}
              <div className="flex items-center justify-center py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.15)]">
                  {state.errorCode === "NOT_FOUND" && <Search className="h-7 w-7 text-red-400/60" />}
                  {state.errorCode === "PRIVATE_ACCOUNT" && <Shield className="h-7 w-7 text-red-400/60" />}
                  {state.errorCode === "RATE_LIMITED" && <RefreshCw className="h-7 w-7 text-red-400/60" />}
                  {state.errorCode === "BLOCKED" && <X className="h-7 w-7 text-red-400/60" />}
                  {(state.errorCode === "NETWORK_ERROR" || state.errorCode === "PARSE_ERROR" || state.errorCode === "UNKNOWN") && (
                    <AlertCircle className="h-7 w-7 text-red-400/60" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {state.step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 animate-fade-in-up">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.2)]">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Successfully Imported
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  @{state.username} has been added to your influencer database.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        {state.step !== "success" && (
          <DialogFooter className="!flex-row gap-2">
            {state.step === "input" && (
              <Button
                id="fetch-instagram-profile-btn"
                onClick={handleFetchProfile}
                disabled={!usernameInput.trim()}
                className="flex-1 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-90 text-white shadow-lg shadow-[#E1306C]/20 transition-all duration-200 disabled:opacity-40 disabled:shadow-none h-10"
              >
                <Search className="mr-2 h-4 w-4" />
                Fetch Profile
              </Button>
            )}

            {(state.step === "preview" || state.step === "saving") && (
              <>
                <Button
                  id="cancel-import-btn"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={state.step === "saving"}
                  className="flex-1 bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--color-text-primary)]"
                >
                  Cancel
                </Button>
                <Button
                  id="confirm-import-btn"
                  onClick={handleImport}
                  disabled={state.step === "saving"}
                  className="flex-1 bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-500)] hover:from-[var(--color-brand-500)] hover:to-[var(--color-brand-400)] text-white shadow-lg shadow-[var(--color-brand-500)]/20 transition-all duration-200 h-10"
                >
                  {state.step === "saving" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import Influencer
                    </>
                  )}
                </Button>
              </>
            )}

            {state.step === "error" && (
              <>
                <Button
                  id="close-error-btn"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="flex-1 bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--color-text-primary)]"
                >
                  Close
                </Button>
                <Button
                  id="retry-import-btn"
                  onClick={handleRetry}
                  className="flex-1 bg-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] border border-[rgba(0,0,0,0.1)] transition-all duration-200 h-10"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </>
            )}

            {state.step === "loading" && (
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="flex-1 bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.05)]"
              >
                Cancel
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Profile Preview Card ────────────────────────────────────

function ProfilePreview({ data, isSaving }: { data: ParsedInstagramProfile; isSaving: boolean }) {
  return (
    <div className={`space-y-4 animate-fade-in-up ${isSaving ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-[rgba(0,0,0,0.06)] border-2 border-[rgba(0,0,0,0.1)] overflow-hidden shrink-0">
          {data.profileImageUrl ? (
            <img
              src={data.profileImageUrl}
              alt={data.username}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-lg font-bold text-[var(--color-text-muted)]">
              {data.username.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {data.fullName}
            </h3>
            {data.isVerified && (
              <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            @{data.username}
          </p>
          {data.isPrivate && (
            <Badge variant="outline" className="mt-1 bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
              <Shield className="mr-1 h-3 w-3" />
              Private Account
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Users} label="Followers" value={formatCount(data.followers)} />
        <StatCard icon={UserPlus} label="Following" value={formatCount(data.following)} />
        <StatCard icon={Grid3X3} label="Posts" value={formatCount(data.posts)} />
      </div>

      {/* Bio */}
      {data.bio && (
        <div className="rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.06)] px-4 py-3">
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-4 whitespace-pre-wrap">
            {data.bio}
          </p>
        </div>
      )}

      {/* Links & Email */}
      {(data.externalUrl || data.email) && (
        <div className="flex flex-wrap gap-2">
          {data.externalUrl && (
            <a
              href={data.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.06)] px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-400)] hover:border-[var(--color-brand-500)]/30 transition-colors"
            >
              <Globe className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{data.externalUrl.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          )}
          {data.email && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.06)] px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)]">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{data.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Import source tag */}
      <div className="flex items-center gap-2 pt-1">
        <Badge variant="outline" className="bg-[rgba(99,102,241,0.08)] text-[var(--color-brand-400)] border-[var(--color-brand-500)]/20 text-[10px]">
          <InstagramIcon className="mr-1 h-3 w-3" />
          Instagram Import
        </Badge>
        <span className="text-[10px] text-[var(--color-text-disabled)]">
          Will be saved as NEW_LEAD
        </span>
      </div>
    </div>
  );
}
