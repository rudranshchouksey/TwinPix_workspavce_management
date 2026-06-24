"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Sparkline } from "./sparkline";

interface CampaignKpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  sparkColor: string;
  series: number[];
  growth: number | null;
  index?: number;
}

export function CampaignKpiCard({ label, value, icon, accent, sparkColor, series, growth, index = 0 }: CampaignKpiCardProps) {
  const trend = growth == null ? "neutral" : growth > 0 ? "up" : growth < 0 ? "down" : "neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2 }}
      className="glass-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:border-[var(--color-brand-200)] hover:shadow-executive-md bg-white"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 shadow-sm" style={{ background: accent }}>
          {icon}
        </div>
        {growth != null && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend === "up" ? "text-[var(--color-success)]" : trend === "down" ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"
            }`}
          >
            {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>

      <p className="relative mt-3 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{value}</p>
      <p className="relative mt-0.5 text-xs font-medium text-[var(--color-text-muted)] tracking-wide uppercase">{label}</p>

      <div className="relative mt-2 -mx-1">
        <Sparkline data={series.length > 0 ? series : [0, 0]} color={sparkColor} />
      </div>
    </motion.div>
  );
}
