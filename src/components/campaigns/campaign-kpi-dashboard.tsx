"use client";

import {
  Megaphone,
  Zap,
  CheckCircle2,
  Wallet,
  Radar,
  Users,
  CalendarClock,
  Award,
} from "lucide-react";
import { CampaignKpiCard } from "./campaign-kpi-card";

interface CampaignKpis {
  total: number;
  active: number;
  completed: number;
  totalBudget: number;
  expectedReach: number;
  totalInfluencers: number;
  upcomingDeadlines: number;
  successRate: number;
  series: Record<string, number[]>;
  growth: Record<string, number | null>;
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function CampaignKpiDashboard({ kpis }: { kpis: CampaignKpis }) {
  const cards = [
    {
      label: "Total Campaigns",
      value: kpis.total.toString(),
      icon: <Megaphone className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #7c3aed, #5b21b6)",
      sparkColor: "#7c3aed",
      series: kpis.series.total,
      growth: kpis.growth.total,
    },
    {
      label: "Active Campaigns",
      value: kpis.active.toString(),
      icon: <Zap className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #10b981, #059669)",
      sparkColor: "#10b981",
      series: kpis.series.active,
      growth: kpis.growth.active,
    },
    {
      label: "Completed Campaigns",
      value: kpis.completed.toString(),
      icon: <CheckCircle2 className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #3b82f6, #2563eb)",
      sparkColor: "#3b82f6",
      series: kpis.series.completed,
      growth: kpis.growth.completed,
    },
    {
      label: "Total Budget",
      value: `$${compact(kpis.totalBudget)}`,
      icon: <Wallet className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #f59e0b, #d97706)",
      sparkColor: "#f59e0b",
      series: kpis.series.budget,
      growth: kpis.growth.budget,
    },
    {
      label: "Expected Reach",
      value: compact(kpis.expectedReach),
      icon: <Radar className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #ec4899, #db2777)",
      sparkColor: "#ec4899",
      series: kpis.series.reach,
      growth: kpis.growth.reach,
    },
    {
      label: "Total Influencers",
      value: kpis.totalInfluencers.toString(),
      icon: <Users className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #6366f1, #4f46e5)",
      sparkColor: "#6366f1",
      series: kpis.series.influencers,
      growth: kpis.growth.influencers,
    },
    {
      label: "Upcoming Deadlines",
      value: kpis.upcomingDeadlines.toString(),
      icon: <CalendarClock className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #f97316, #ea580c)",
      sparkColor: "#f97316",
      series: kpis.series.deadlines,
      growth: null,
    },
    {
      label: "Campaign Success Rate",
      value: `${kpis.successRate}%`,
      icon: <Award className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #14b8a6, #0d9488)",
      sparkColor: "#14b8a6",
      series: kpis.series.successRate,
      growth: kpis.growth.successRate,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <CampaignKpiCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
}
