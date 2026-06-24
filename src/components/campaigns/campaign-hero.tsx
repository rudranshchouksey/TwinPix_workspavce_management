"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Sparkles, Upload, SlidersHorizontal, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignDialog } from "./campaign-dialog";
import { CampaignBriefModal } from "./campaign-brief-modal";
import { CampaignImportModal } from "./campaign-import-modal";
import type { CampaignInput } from "@/lib/validations/campaign";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function CampaignHero({ clients }: { clients: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<CampaignInput> | undefined>(undefined);

  const currentStatus = searchParams.get("status") || "ALL";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "ALL") params.set(key, value);
        else params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get("q") || "")) {
        updateParams({ q: search || null });
      }
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="relative overflow-hidden rounded-3xl glass-card bg-gradient-to-br from-white via-white to-[var(--color-brand-50)]/40 p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-brand-200)]/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[var(--color-brand-100)]/40 blur-3xl" />

      <div className="relative flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Campaign Operations
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl">
            Manage influencer campaigns, monitor performance, and track deliverables across all clients.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-[var(--color-brand-500)]/20">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPrefill(undefined);
                setIsBriefOpen(true);
              }}
              className="border-[var(--color-brand-200)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]"
            >
              <Sparkles className="h-4 w-4" />
              AI Campaign Brief
            </Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import Campaign
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.03)] transition-colors">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem key={opt.value} onClick={() => updateParams({ status: opt.value })}>
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <CampaignDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} clients={clients} prefill={prefill} />

      <CampaignBriefModal
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        clients={clients}
        onCreateFromBrief={(data) => {
          setPrefill({ ...data, status: "PLANNING" });
          setIsCreateOpen(true);
        }}
      />

      <CampaignImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
}
