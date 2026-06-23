"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { regenerateCreatorAIInsightsAction } from "@/actions/creator-intelligence";

interface CreatorAIIntelligenceProps {
  influencerId: string;
  insights: any | null;
}

const SAFETY_CONFIG: Record<string, { label: string; icon: typeof ShieldCheck; classes: string }> = {
  LOW: { label: "Low Risk", icon: ShieldCheck, classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MEDIUM: { label: "Medium Risk", icon: ShieldAlert, classes: "bg-amber-50 text-amber-700 border-amber-200" },
  HIGH: { label: "High Risk", icon: ShieldX, classes: "bg-red-50 text-red-700 border-red-200" },
};

const COLLAB_CONFIG: Record<string, { label: string; classes: string }> = {
  STRONGLY_RECOMMEND: { label: "Strongly Recommend", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RECOMMEND: { label: "Recommend", classes: "bg-sky-50 text-sky-700 border-sky-200" },
  NEUTRAL: { label: "Neutral", classes: "bg-stone-100 text-stone-600 border-stone-200" },
  NOT_RECOMMENDED: { label: "Not Recommended", classes: "bg-red-50 text-red-700 border-red-200" },
};

function scoreColor(score: number) {
  if (score >= 75) return { stroke: "#10b981", text: "text-emerald-600" };
  if (score >= 50) return { stroke: "#6366f1", text: "text-indigo-600" };
  if (score >= 25) return { stroke: "#f59e0b", text: "text-amber-600" };
  return { stroke: "#ef4444", text: "text-red-600" };
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const { stroke, text } = scoreColor(score);

  return (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#f1f1f1"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke={stroke}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeDasharray={`${circumference} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black ${text}`}>{score}</span>
        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          / 100
        </span>
      </div>
    </div>
  );
}

export function CreatorAIIntelligence({ influencerId, insights }: CreatorAIIntelligenceProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleGenerate = () => {
    startTransition(async () => {
      toast.info("Generating AI creator intelligence... this may take a few seconds.");
      const result = await regenerateCreatorAIInsightsAction(influencerId);
      if (result.success) {
        toast.success("AI Creator Intelligence updated.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to generate AI creator intelligence");
      }
    });
  };

  const safety = insights ? SAFETY_CONFIG[insights.brandSafetyScore] : null;
  const collab = insights ? COLLAB_CONFIG[insights.collaborationRecommendation] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-12 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-600)]">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">AI Creator Intelligence</h2>
            {insights?.generatedAt && (
              <p className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Generated{" "}
                {new Date(insights.generatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · auto-refreshes on next sync
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isPending}
          variant="outline"
          size="sm"
          className="rounded-full border-[var(--color-brand-600)] text-[var(--color-brand-600)] font-bold px-4 bg-white hover:bg-[var(--color-brand-50)] shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Generating..." : insights ? "Regenerate" : "Generate Insights"}
        </Button>
      </div>

      {!insights ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-stone-50 p-10 flex flex-col items-center justify-center text-center gap-3">
          <Sparkles className="w-8 h-8 text-[var(--color-text-muted)]" />
          <p className="text-sm font-semibold text-[var(--color-text-secondary)] max-w-sm">
            No AI intelligence report yet. Generate one to get a brand-partnership readiness summary,
            strengths/weaknesses, and a Creator Intelligence Score.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-b from-stone-50 to-white shadow-sm p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 grid grid-cols-12 gap-8">
            {/* Score + badges */}
            <div className="col-span-12 lg:col-span-4 flex flex-col items-center gap-4 lg:border-r lg:border-[var(--color-border)] lg:pr-8">
              <ScoreRing score={insights.intelligenceScore} />
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-center">
                Creator Intelligence Score
              </p>

              <div className="w-full flex flex-col gap-2 mt-2">
                {safety && (
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${safety.classes}`}
                  >
                    <safety.icon className="w-4 h-4" />
                    Brand Safety: {safety.label}
                  </div>
                )}
                {collab && (
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${collab.classes}`}
                  >
                    {insights.collaborationRecommendation === "NOT_RECOMMENDED" ? (
                      <ThumbsDown className="w-4 h-4" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                    {collab.label}
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <div>
                <h3 className="font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-brand-500)]" />
                  AI Summary
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium">
                  {insights.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {insights.strengths?.map((s: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm font-medium text-[var(--color-text-secondary)]"
                      >
                        <span className="text-emerald-500 mt-1">●</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">
                    Weaknesses
                  </h4>
                  <ul className="space-y-2">
                    {insights.weaknesses?.map((w: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm font-medium text-[var(--color-text-secondary)]"
                      >
                        <span className="text-red-500 mt-1">●</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Recommended Brand Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insights.recommendedCategories?.map((c: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] text-xs font-bold border border-[var(--color-brand-100)]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {insights.brandSafetyReason && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                    Brand Safety Reasoning
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium">
                    {insights.brandSafetyReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
