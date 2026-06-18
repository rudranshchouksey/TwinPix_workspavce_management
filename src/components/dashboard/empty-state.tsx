"use client";

/**
 * components/dashboard/empty-state.tsx
 *
 * Reusable empty state placeholder with icon, title, description,
 * and optional action button. Used when sections have no data yet.
 */

import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="glass-card rounded-xl px-8 py-10 text-center"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,0,0,0.04)] ring-1 ring-[rgba(0,0,0,0.06)]">
        <Icon className="h-6 w-6 text-[var(--color-text-disabled)]" />
      </div>
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
        {title}
      </p>
      <p className="mt-1.5 text-xs text-[var(--color-text-muted)] leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
      {action && (
        <a
          href={action.href}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--color-brand-600)] hover:shadow-lg hover:shadow-[var(--color-brand-500)]/25 active:scale-[0.98]"
        >
          {action.label}
        </a>
      )}
    </motion.div>
  );
}
