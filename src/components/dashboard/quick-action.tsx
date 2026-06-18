"use client";

/**
 * components/dashboard/quick-action.tsx
 *
 * Clickable quick action card with icon, label, description,
 * and arrow indicator on hover.
 */

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface QuickActionProps {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  index?: number;
}

export function QuickAction({
  label,
  description,
  href,
  icon: Icon,
  index = 0,
}: QuickActionProps) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 + index * 0.06, ease: "easeOut" }}
      className="glass-card group flex items-center gap-4 rounded-xl p-4 transition-all duration-200 hover:border-[var(--color-brand-200)] hover:bg-[var(--color-surface-900)] hover:shadow-executive-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-100)] ring-1 ring-[var(--color-brand-200)] group-hover:bg-[var(--color-brand-200)] group-hover:ring-[var(--color-brand-300)] transition-all duration-200 shadow-sm">
        <Icon className="h-5 w-5 text-[var(--color-brand-700)]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          {label}
        </p>
        <p className="truncate text-xs font-medium text-[var(--color-text-muted)]">
          {description}
        </p>
      </div>
      <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-[var(--color-text-disabled)] transition-all duration-200 group-hover:text-[var(--color-brand-600)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </motion.a>
  );
}
