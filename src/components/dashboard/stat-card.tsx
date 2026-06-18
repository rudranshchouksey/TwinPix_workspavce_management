"use client";

/**
 * components/dashboard/stat-card.tsx
 *
 * Animated stat card with gradient icon background.
 * Uses Framer Motion for staggered entrance animation.
 */

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  accent: string;
  index?: number;
}

export function StatCard({
  label,
  value,
  change,
  trend = "neutral",
  icon,
  accent,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-[var(--color-brand-200)] hover:shadow-executive-md hover:-translate-y-0.5 bg-white"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)] tracking-wide uppercase">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {value}
          </p>
          {change && (
            <p
              className={`mt-1.5 flex items-center gap-1 text-sm font-medium ${
                trend === "up"
                  ? "text-[var(--color-success)]"
                  : trend === "down"
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {trend === "up" && <ArrowUpRight className="h-4 w-4" />}
              {trend === "down" && <ArrowDownRight className="h-4 w-4" />}
              {change}
            </p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent} shadow-sm`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton variant ─────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 bg-white">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-8 w-16 rounded" />
          <div className="shimmer h-4 w-20 rounded" />
        </div>
        <div className="shimmer h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}
