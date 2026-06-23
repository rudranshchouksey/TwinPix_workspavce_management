"use client";

import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, ListChecks, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandMatchPanelProps {
  match: {
    matchScore: number;
    explanation: string[];
    risks: string[];
    recommendedDeliverables: string[];
    generatedAt?: string | Date;
  };
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function matchScoreColor(score: number) {
  if (score >= 75) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", ring: "#10b981" };
  if (score >= 50) return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", ring: "#6366f1" };
  if (score >= 25) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", ring: "#f59e0b" };
  return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", ring: "#ef4444" };
}

export function BrandMatchScoreBadge({ score }: { score: number }) {
  const colors = matchScoreColor(score);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <Sparkles className="w-3 h-3" />
      {score}% Match
    </span>
  );
}

export function BrandMatchPanel({ match, onRegenerate, isRegenerating }: BrandMatchPanelProps) {
  const colors = matchScoreColor(match.matchScore);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className={`mt-2 rounded-2xl border ${colors.border} ${colors.bg} p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${colors.text}`}>{match.matchScore}%</span>
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              AI Match Score
            </span>
          </div>
          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="h-7 px-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating ? "animate-spin" : ""}`} />
              Recompute
            </Button>
          )}
        </div>

        {match.explanation?.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Why this fits
            </h4>
            <ul className="space-y-1">
              {match.explanation.map((e, i) => (
                <li key={i} className="text-sm font-medium text-[var(--color-text-secondary)] flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">●</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {match.risks?.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Risks
            </h4>
            <ul className="space-y-1">
              {match.risks.map((r, i) => (
                <li key={i} className="text-sm font-medium text-[var(--color-text-secondary)] flex items-start gap-2">
                  <span className="text-red-500 mt-1">●</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {match.recommendedDeliverables?.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" />
              Recommended Deliverables
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {match.recommendedDeliverables.map((d, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-white text-[var(--color-text-primary)] text-xs font-bold border border-[var(--color-border)]"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
