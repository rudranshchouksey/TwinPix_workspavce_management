"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  accent: string;
  index?: number;
  data?: number[]; // Added for sparkline
}

export function StatCard({
  label,
  value,
  change,
  trend = "neutral",
  icon,
  accent,
  index = 0,
  data,
}: StatCardProps) {
  const isUp = trend === "up";
  const trendColor = isUp ? "var(--color-success)" : trend === "down" ? "var(--color-danger)" : "var(--color-brand-500)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:border-[var(--color-brand-200)] hover:shadow-executive-md hover:-translate-y-0.5 bg-white"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] tracking-wide uppercase">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent} shadow-sm`}>
          {icon}
        </div>
      </div>
      
      <div className="relative mt-4 flex items-end justify-between gap-4">
        <div className="flex-1">
          {change && (
            <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isUp ? "bg-emerald-50 text-[var(--color-success)]" 
                : trend === "down" ? "bg-rose-50 text-[var(--color-danger)]" 
                : "bg-stone-50 text-[var(--color-text-muted)]"
            }`}>
              {isUp && <ArrowUpRight className="h-3 w-3" />}
              {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
              {change}
            </div>
          )}
        </div>
        
        {data && data.length > 0 && (
          <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
            <Sparkline data={data} color={trendColor} height={32} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 bg-white">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="shimmer h-3 w-20 rounded" />
          <div className="shimmer h-7 w-24 rounded" />
        </div>
        <div className="shimmer h-10 w-10 rounded-xl" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="shimmer h-5 w-16 rounded-full" />
        <div className="shimmer h-8 w-16 rounded" />
      </div>
    </div>
  );
}
