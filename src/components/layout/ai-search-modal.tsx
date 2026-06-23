"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Search,
  Loader2,
  Users,
  Megaphone,
  Building2,
  CheckSquare,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { runSmartSearchAction } from "@/actions/smart-search";

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXAMPLE_QUERIES = [
  "Travel influencers in India with more than 10k followers",
  "Beauty creators suitable for Nykaa campaign",
  "Influencers not contacted in last 30 days",
  "Creators with engagement rate above 5%",
  "Fashion influencers from Mumbai",
];

const ENTITY_CONFIG: Record<string, { label: string; icon: typeof Users; href: (r: any) => string }> = {
  INFLUENCER: { label: "Influencers", icon: Users, href: (r) => `/influencers/${r.id}` },
  CAMPAIGN: { label: "Campaigns", icon: Megaphone, href: (r) => `/campaigns/${r.id}` },
  CLIENT: { label: "Clients", icon: Building2, href: (r) => `/clients/${r.id}` },
  TASK: { label: "Tasks", icon: CheckSquare, href: (r) => `/tasks/${r.id}` },
};

function formatNumber(num?: number | null) {
  if (num == null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
}

function ResultRow({ entity, row, onClick }: { entity: string; row: any; onClick: () => void }) {
  if (entity === "INFLUENCER") {
    return (
      <button onClick={onClick} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-stone-50 border border-[var(--color-border)] text-left">
        <div className="min-w-0">
          <div className="text-sm font-bold text-[var(--color-text-primary)] truncate">
            {row.influencerName || row.instagramHandle}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] truncate">
            @{row.instagramHandle} {row.category ? `· ${row.category}` : ""} {row.location ? `· ${row.location}` : ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">{formatNumber(row.followers)}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {row.engagementRate != null ? `${row.engagementRate.toFixed(1)}% ER` : "followers"}
          </div>
        </div>
      </button>
    );
  }

  if (entity === "CAMPAIGN") {
    return (
      <button onClick={onClick} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-stone-50 border border-[var(--color-border)] text-left">
        <div className="min-w-0">
          <div className="text-sm font-bold text-[var(--color-text-primary)] truncate">{row.name}</div>
          <div className="text-xs text-[var(--color-text-muted)] truncate">
            {row.client?.companyName || "Unknown client"} · {row.status}
          </div>
        </div>
        <div className="text-sm font-bold text-[var(--color-text-primary)] shrink-0">
          ${formatNumber(row.budget)}
        </div>
      </button>
    );
  }

  if (entity === "CLIENT") {
    return (
      <button onClick={onClick} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-stone-50 border border-[var(--color-border)] text-left">
        <div className="min-w-0">
          <div className="text-sm font-bold text-[var(--color-text-primary)] truncate">{row.companyName}</div>
          <div className="text-xs text-[var(--color-text-muted)] truncate">
            {row.industry || "Uncategorized"} · {row.contactPerson}
          </div>
        </div>
        <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase shrink-0">{row.status}</span>
      </button>
    );
  }

  // TASK
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-stone-50 border border-[var(--color-border)] text-left">
      <div className="min-w-0">
        <div className="text-sm font-bold text-[var(--color-text-primary)] truncate">{row.title}</div>
        <div className="text-xs text-[var(--color-text-muted)] truncate">
          {row.campaign?.name || "No campaign"} {row.assignee?.name ? `· ${row.assignee.name}` : ""}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase">{row.priority}</div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date"}
        </div>
      </div>
    </button>
  );
}

export function AISearchModal({ isOpen, onClose }: AISearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setQuery(q);
    try {
      const res = await runSmartSearchAction(q);
      if (res.success) {
        setResult(res);
      } else {
        toast.error(res.error || "Search failed");
        setResult(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigate = (href: string) => {
    onClose();
    setResult(null);
    setQuery("");
    router.push(href);
  };

  const handleClose = () => {
    onClose();
    setResult(null);
    setQuery("");
  };

  const config = result ? ENTITY_CONFIG[result.entity] : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-[var(--color-border)] bg-gradient-to-b from-[var(--color-brand-50)] to-transparent">
          <DialogTitle className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-brand-600)]" />
            AI Smart Search
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            Search in plain English across influencers, campaigns, clients, and tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <Input
                autoFocus
                placeholder="e.g. Travel influencers in India with more than 10k followers"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
            <Button type="submit" disabled={isSearching || !query.trim()} className="h-11 px-5 font-bold">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          {!result && !isSearching && (
            <div>
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Try an example
              </p>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_QUERIES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => runSearch(ex)}
                    className="text-left text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)] flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-600)]" />
              <p className="text-sm font-medium text-[var(--color-text-muted)]">Interpreting your query...</p>
            </div>
          )}

          <AnimatePresence>
            {result && !isSearching && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] p-3.5">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--color-brand-600)] shrink-0 mt-0.5" />
                    {result.explanation}
                  </p>
                  {result.suggestedFilters?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {result.suggestedFilters.map((chip: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full bg-white text-[var(--color-brand-700)] text-xs font-bold border border-[var(--color-brand-200)]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    {config && <config.icon className="w-3.5 h-3.5" />}
                    {result.results.length} {config?.label || "Results"}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                  {result.results.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">
                      No matches found for this query.
                    </p>
                  ) : (
                    result.results.map((row: any) => (
                      <ResultRow
                        key={row.id}
                        entity={result.entity}
                        row={row}
                        onClick={() => handleNavigate(config!.href(row))}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
