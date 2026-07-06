"use client";

import { cn } from "@/lib/utils";

export type TaskQuickFilter =
  | "all"
  | "assigned-to-me"
  | "high-priority"
  | "today"
  | "overdue"
  | "completed"
  | "campaign"
  | "unassigned";

interface TaskQuickFiltersProps {
  active: TaskQuickFilter;
  onChange: (filter: TaskQuickFilter) => void;
  currentUserId?: string;
}

const FILTERS: { id: TaskQuickFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "assigned-to-me", label: "Assigned to Me" },
  { id: "high-priority", label: "High Priority" },
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
  { id: "campaign", label: "Campaign Tasks" },
  { id: "unassigned", label: "Unassigned" },
];

export function TaskQuickFilters({ active, onChange }: TaskQuickFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
            active === f.id
              ? "bg-[var(--color-brand-500)] text-white shadow-sm shadow-[var(--color-brand-500)]/20"
              : "bg-[rgba(0,0,0,0.03)] text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[var(--color-text-primary)]"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
