"use client";

import {
  ListTodo,
  Loader,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  CalendarClock,
  BarChart3,
} from "lucide-react";
import { CampaignKpiCard } from "@/components/campaigns/campaign-kpi-card";
import type { TaskKpis } from "@/actions/tasks";

export function TaskKpiDashboard({ kpis }: { kpis: TaskKpis }) {
  const cards = [
    {
      label: "Total Tasks",
      value: kpis.total.toString(),
      icon: <BarChart3 className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #7c3aed, #5b21b6)",
      sparkColor: "#7c3aed",
      series: kpis.series.total,
      growth: kpis.growth.total,
    },
    {
      label: "To Do",
      value: kpis.todo.toString(),
      icon: <ListTodo className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #6366f1, #4f46e5)",
      sparkColor: "#6366f1",
      series: kpis.series.todo,
      growth: kpis.growth.todo,
    },
    {
      label: "In Progress",
      value: kpis.inProgress.toString(),
      icon: <Loader className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #3b82f6, #2563eb)",
      sparkColor: "#3b82f6",
      series: kpis.series.inProgress,
      growth: kpis.growth.inProgress,
    },
    {
      label: "Review",
      value: kpis.review.toString(),
      icon: <Eye className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #f59e0b, #d97706)",
      sparkColor: "#f59e0b",
      series: kpis.series.review,
      growth: kpis.growth.review,
    },
    {
      label: "Completed",
      value: kpis.completed.toString(),
      icon: <CheckCircle2 className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #10b981, #059669)",
      sparkColor: "#10b981",
      series: kpis.series.completed,
      growth: kpis.growth.completed,
    },
    {
      label: "Overdue",
      value: kpis.overdue.toString(),
      icon: <AlertTriangle className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #ef4444, #dc2626)",
      sparkColor: "#ef4444",
      series: kpis.series.overdue,
      growth: kpis.growth.overdue,
    },
    {
      label: "High Priority",
      value: kpis.highPriority.toString(),
      icon: <Flame className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #f97316, #ea580c)",
      sparkColor: "#f97316",
      series: kpis.series.highPriority,
      growth: kpis.growth.highPriority,
    },
    {
      label: "Due Today",
      value: kpis.dueToday.toString(),
      icon: <CalendarClock className="h-4.5 w-4.5 text-white" />,
      accent: "linear-gradient(135deg, #ec4899, #db2777)",
      sparkColor: "#ec4899",
      series: kpis.series.dueToday,
      growth: kpis.growth.dueToday,
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
