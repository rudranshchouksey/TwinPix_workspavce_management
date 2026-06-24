"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Upload, Wand2, Sparkles, Download, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CreateInfluencerDialog } from "@/components/influencers/create-influencer-dialog";
import { GenerateOutreachPickerModal } from "./generate-outreach-picker-modal";
import { AdvancedFiltersSheet } from "./advanced-filters-sheet";
import { exportInfluencersAction, PipelineFilters } from "@/actions/pipeline";
import { toast } from "sonner";

export function PipelineHero({ filters, categories }: { filters: PipelineFilters; categories: string[] }) {
  const [outreachPickerOpen, setOutreachPickerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isExporting, startExport] = useTransition();

  const handleExport = () => {
    startExport(async () => {
      try {
        const csv = await exportInfluencersAction(filters);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `creator-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export ready");
      } catch (err: any) {
        toast.error(err.message || "Export failed");
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-violet-50 via-indigo-50 to-sky-50 p-8 shadow-sm"
    >
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            Creator Pipeline
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)] font-medium max-w-2xl">
            Manage creator relationships, outreach, negotiations, and campaign readiness from a single workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <CreateInfluencerDialog />

          <Link
            href="/influencers/import"
            className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full bg-white/70 backdrop-blur-sm border-[var(--color-border)] font-bold" })}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Leads
          </Link>

          <Button
            onClick={() => setOutreachPickerOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-full bg-white/70 backdrop-blur-sm border-[var(--color-border)] font-bold"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Outreach
          </Button>

          <a
            href="#ai-pipeline-insights"
            className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full bg-white/70 backdrop-blur-sm border-[var(--color-border)] font-bold" })}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Recommendations
          </a>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            size="sm"
            className="rounded-full bg-white/70 backdrop-blur-sm border-[var(--color-border)] font-bold"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export
          </Button>

          <Button
            onClick={() => setFiltersOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-full bg-white/70 backdrop-blur-sm border-[var(--color-border)] font-bold"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      <GenerateOutreachPickerModal open={outreachPickerOpen} onClose={() => setOutreachPickerOpen(false)} />
      <AdvancedFiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} categories={categories} />
    </motion.div>
  );
}
