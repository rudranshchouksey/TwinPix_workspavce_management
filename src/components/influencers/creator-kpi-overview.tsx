"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Users, UserPlus, Activity, PlayCircle, Image as ImageIcon, Briefcase, MessageSquareReply, Sparkles } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import { computeCreatorKpis } from "./creator-metric-utils";

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function scoreRingColor(score: number) {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#6366f1";
  if (score >= 25) return "#f59e0b";
  return "#ef4444";
}

function MiniScoreRing({ score }: { score: number }) {
  const radius = 18;
  const strokeWidth = 4;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <svg height={radius * 2} width={radius * 2} className="-rotate-90 shrink-0">
      <circle stroke="#f1f1f1" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  sparkColor,
  series,
  growth,
  index,
  ring,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  sparkColor: string;
  series?: number[];
  growth?: number | null;
  index: number;
  ring?: number | null;
}) {
  const trend = growth == null ? "neutral" : growth > 0 ? "up" : growth < 0 ? "down" : "neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 shadow-sm" style={{ background: accent }}>
          {icon}
        </div>
        {ring != null ? (
          <MiniScoreRing score={ring} />
        ) : growth != null ? (
          <span
            className={`flex items-center gap-0.5 text-xs font-bold ${
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-[var(--color-text-muted)]"
            }`}
          >
            {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(growth)}%
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-2xl font-black text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-0.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>

      {series && (
        <div className="mt-2 -mx-1">
          <Sparkline data={series.length > 0 ? series : [0, 0]} color={sparkColor} />
        </div>
      )}
    </motion.div>
  );
}

export function CreatorKpiOverview({ influencer }: { influencer: any }) {
  const kpis = computeCreatorKpis(influencer);

  const cards = [
    {
      label: "Followers",
      value: compact(kpis.followers),
      icon: <Users className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #6366f1, #4f46e5)",
      sparkColor: "#6366f1",
      series: kpis.series.followers,
      growth: kpis.growth.followers,
    },
    {
      label: "Following",
      value: compact(kpis.following),
      icon: <UserPlus className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      sparkColor: "#8b5cf6",
      series: kpis.series.following,
      growth: kpis.growth.following,
    },
    {
      label: "Engagement Rate",
      value: `${kpis.engagementRate.toFixed(2)}%`,
      icon: <Activity className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #10b981, #059669)",
      sparkColor: "#10b981",
      series: kpis.series.engagementRate,
      growth: kpis.growth.engagementRate,
    },
    {
      label: "Avg Reel Views",
      value: compact(kpis.avgReelViews),
      icon: <PlayCircle className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #0ea5e9, #0284c7)",
      sparkColor: "#0ea5e9",
      series: kpis.series.avgReelViews,
      growth: kpis.growth.avgReelViews,
    },
    {
      label: "Total Posts",
      value: compact(kpis.totalPosts),
      icon: <ImageIcon className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #f59e0b, #d97706)",
      sparkColor: "#f59e0b",
      series: kpis.series.totalPosts,
      growth: kpis.growth.totalPosts,
    },
    {
      label: "Campaign Count",
      value: kpis.campaignCount.toString(),
      icon: <Briefcase className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #ec4899, #db2777)",
      sparkColor: "#ec4899",
      series: kpis.series.campaignCount,
      growth: kpis.growth.campaignCount,
    },
    {
      label: "Response Rate",
      value: `${kpis.responseRate}%`,
      icon: <MessageSquareReply className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #14b8a6, #0d9488)",
      sparkColor: "#14b8a6",
      series: kpis.series.responseRate,
      growth: kpis.growth.responseRate,
    },
    {
      label: "Creator Score",
      value: kpis.creatorScore != null ? `${kpis.creatorScore}` : "—",
      icon: <Sparkles className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #f43f5e, #e11d48)",
      sparkColor: "#f43f5e",
      ring: kpis.creatorScore,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">KPI Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <KpiCard key={card.label} {...card} index={i} />
        ))}
      </div>
    </div>
  );
}
