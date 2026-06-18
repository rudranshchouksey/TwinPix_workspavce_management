"use client";

/**
 * components/dashboard/activity-feed.tsx
 *
 * Recent activity feed section. Displays a list of activity items
 * with avatars, timestamps, and action descriptions.
 * Shows an empty state when there's no activity.
 */

import { motion, Variants } from "framer-motion";
import { Clock, ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "./empty-state";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  color: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No activity yet"
        description="Activity will appear here as your team uses the platform."
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="glass-card divide-y divide-[var(--color-border)] rounded-xl"
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-[var(--color-surface-900)]"
        >
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-[var(--color-border)]">
            <AvatarFallback
              className={`text-xs font-semibold ${item.color}`}
            >
              {getInitials(item.user)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)]">
                {item.user}
              </span>{" "}
              {item.action}{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">
                {item.target}
              </span>
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--color-text-muted)]">
              {item.time}
            </p>
          </div>

          <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-text-disabled)] opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-[var(--color-brand-600)]" />
        </motion.div>
      ))}
    </motion.div>
  );
}
