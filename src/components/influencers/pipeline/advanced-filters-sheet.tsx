"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PIPELINE_STATUSES, STATUS_META } from "./pipeline-utils";
import { PipelineFilters } from "@/actions/pipeline";

export function AdvancedFiltersSheet({
  open,
  onClose,
  filters,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  filters: PipelineFilters;
  categories: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [statuses, setStatuses] = useState<string[]>(filters.statuses || []);
  const [cats, setCats] = useState<string[]>(filters.categories || []);
  const [followersMin, setFollowersMin] = useState(filters.followersMin?.toString() || "");
  const [engagementMin, setEngagementMin] = useState(filters.engagementMin?.toString() || "");

  const toggle = (arr: string[], set: (v: string[]) => void, value: string) => {
    set(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    statuses.length ? params.set("status", statuses.join(",")) : params.delete("status");
    cats.length ? params.set("category", cats.join(",")) : params.delete("category");
    followersMin ? params.set("followersMin", followersMin) : params.delete("followersMin");
    engagementMin ? params.set("engagementMin", engagementMin) : params.delete("engagementMin");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    onClose();
  };

  const reset = () => {
    setStatuses([]);
    setCats([]);
    setFollowersMin("");
    setEngagementMin("");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-6">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)] mb-2 block">
              Pipeline Status
            </Label>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(statuses, setStatuses, s)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                    statuses.includes(s) ? STATUS_META[s].color : "bg-white text-[var(--color-text-muted)] border-[var(--color-border)]"
                  }`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)] mb-2 block">
                Category
              </Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggle(cats, setCats, c)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                      cats.includes(c)
                        ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-200)]"
                        : "bg-white text-[var(--color-text-muted)] border-[var(--color-border)]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)] mb-2 block">
              Minimum Followers
            </Label>
            <Input type="number" placeholder="e.g. 50000" value={followersMin} onChange={(e) => setFollowersMin(e.target.value)} />
          </div>

          <div>
            <Label className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)] mb-2 block">
              Minimum Engagement Rate (%)
            </Label>
            <Input type="number" step="0.1" placeholder="e.g. 3" value={engagementMin} onChange={(e) => setEngagementMin(e.target.value)} />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={reset}>
            Reset
          </Button>
          <Button className="flex-1" onClick={apply}>
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
