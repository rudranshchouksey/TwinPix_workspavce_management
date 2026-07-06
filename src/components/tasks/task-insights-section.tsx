"use client";

import { motion } from "framer-motion";
import { AlertCircle, CalendarClock, TrendingUp, Users, Eye, Sparkles } from "lucide-react";
import type { TaskInsight } from "@/actions/task-insights";

const ICONS: Record<TaskInsight["type"], any> = {
  overdue: AlertCircle,
  deadline: CalendarClock,
  velocity: TrendingUp,
  workload: Users,
  review: Eye,
};

const SEVERITY_STYLES: Record<TaskInsight["severity"], { bg: string; text: string; border: string; iconBg: string }> = {
  high: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100", iconBg: "bg-red-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", iconBg: "bg-amber-500" },
  low: { bg: "bg-[var(--color-brand-50)]", text: "text-[var(--color-brand-700)]", border: "border-[var(--color-brand-100)]", iconBg: "bg-[var(--color-brand-500)]" },
};

export function TaskInsightsSection({ insights }: { insights: TaskInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl glass-card bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">AI Task Insights</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((insight, i) => {
          const Icon = ICONS[insight.type];
          const styles = SEVERITY_STYLES[insight.severity];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className={`rounded-xl border p-4 ${styles.bg} ${styles.border}`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${styles.iconBg}`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${styles.text}`}>{insight.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
