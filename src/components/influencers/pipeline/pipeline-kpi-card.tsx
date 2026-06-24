"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";

interface PipelineKpiCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  sparkColor: string;
  series: number[];
  growth: number | null;
  index?: number;
}

export function PipelineKpiCard({ label, value, description, icon, accent, sparkColor, series, growth, index = 0 }: PipelineKpiCardProps) {
  const trend = growth == null ? "neutral" : growth > 0 ? "up" : growth < 0 ? "down" : "neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[var(--color-brand-200)]"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)]/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 shadow-sm" style={{ background: accent }}>
          {icon}
        </div>
        {growth != null && (
          <span
            className={`flex items-center gap-0.5 text-xs font-bold ${
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-[var(--color-text-muted)]"
            }`}
          >
            {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>

      <p className="relative mt-3 text-2xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</p>
      <p className="relative mt-0.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
      <p className="relative mt-1.5 text-[11px] text-[var(--color-text-disabled)] leading-snug">{description}</p>

      <div className="relative mt-2 -mx-1">
        <Sparkline data={series.length > 0 ? series : [0, 0]} color={sparkColor} />
      </div>
    </motion.div>
  );
}
