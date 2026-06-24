import { Users, UserPlus, MessageSquare, Handshake, FileCheck2, Megaphone, Reply, Activity, Flame } from "lucide-react";
import { PipelineKpiCard } from "./pipeline-kpi-card";
import { getPipelineKpisAction } from "@/actions/pipeline";

export async function PipelineKpiDashboard() {
  const { metrics, series, growth } = await getPipelineKpisAction();

  const cards = [
    {
      label: "Total Creators",
      value: metrics.totalCreators.toLocaleString(),
      description: "All creators currently in your pipeline.",
      icon: <Users className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #6366f1, #4f46e5)",
      sparkColor: "#6366f1",
      series: series.totalCreators,
      growth: growth.totalCreators,
    },
    {
      label: "New Leads",
      value: metrics.newLeads.toLocaleString(),
      description: "Creators awaiting first outreach.",
      icon: <UserPlus className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #0ea5e9, #0284c7)",
      sparkColor: "#0ea5e9",
      series: series.newLeads,
      growth: growth.newLeads,
    },
    {
      label: "Contacted",
      value: metrics.contacted.toLocaleString(),
      description: "Outreach sent, awaiting response.",
      icon: <MessageSquare className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #f59e0b, #d97706)",
      sparkColor: "#f59e0b",
      series: series.contacted,
      growth: growth.contacted,
    },
    {
      label: "Negotiating",
      value: metrics.negotiating.toLocaleString(),
      description: "Terms and rates being discussed.",
      icon: <Handshake className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #f97316, #ea580c)",
      sparkColor: "#f97316",
      series: series.negotiating,
      growth: growth.negotiating,
    },
    {
      label: "Ready To Sign",
      value: metrics.readyToSign.toLocaleString(),
      description: "Terms agreed — pending final signature.",
      icon: <FileCheck2 className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #14b8a6, #0d9488)",
      sparkColor: "#14b8a6",
      series: series.readyToSign,
      growth: growth.readyToSign,
    },
    {
      label: "Active Campaigns",
      value: metrics.activeCampaigns.toLocaleString(),
      description: "Distinct active campaigns with creators assigned.",
      icon: <Megaphone className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #ec4899, #db2777)",
      sparkColor: "#ec4899",
      series: series.activeCampaigns,
      growth: growth.activeCampaigns,
    },
    {
      label: "Response Rate",
      value: `${metrics.responseRate}%`,
      description: "Share of contacted creators who replied or moved forward.",
      icon: <Reply className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      sparkColor: "#8b5cf6",
      series: series.responseRate,
      growth: growth.responseRate,
    },
    {
      label: "Average Engagement",
      value: `${metrics.averageEngagement}%`,
      description: "Average engagement rate across the pipeline.",
      icon: <Activity className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #10b981, #059669)",
      sparkColor: "#10b981",
      series: series.averageEngagement,
      growth: growth.averageEngagement,
    },
    {
      label: "High Priority Follow Ups",
      value: metrics.highPriorityFollowUps.toLocaleString(),
      description: "Creators flagged urgent by the AI priority score.",
      icon: <Flame className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #ef4444, #dc2626)",
      sparkColor: "#ef4444",
      series: series.highPriorityFollowUps,
      growth: growth.highPriorityFollowUps,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <PipelineKpiCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
}
