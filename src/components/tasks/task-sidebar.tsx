"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  PanelRightClose,
  PanelRightOpen,
  CalendarClock,
  Activity,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TaskWithDetails } from "./task-kanban";
import type { TaskInsight } from "@/actions/task-insights";

interface TaskSidebarProps {
  tasks: TaskWithDetails[];
  insights: TaskInsight[];
}

export function TaskSidebar({ tasks, insights }: TaskSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  const todaysTasks = useMemo(() => {
    const today = new Date();
    return tasks.filter((t) => {
      if (t.status === "DONE") return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate).toDateString() === today.toDateString();
    });
  }, [tasks]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= now && t.status !== "DONE")
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [tasks]);

  const recentlyUpdated = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [tasks]);

  const completedToday = useMemo(() => {
    const today = new Date();
    return tasks.filter(
      (t) =>
        t.status === "DONE" &&
        new Date(t.updatedAt).toDateString() === today.toDateString()
    ).length;
  }, [tasks]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 rounded-l-xl border border-[rgba(0,0,0,0.08)] bg-white px-2 py-3 shadow-md hover:bg-[var(--color-brand-50)] transition-colors"
        title="Open task sidebar"
      >
        <PanelRightOpen className="h-4 w-4 text-[var(--color-text-muted)]" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        className="w-full lg:w-72 shrink-0 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Overview
          </h3>
          <button
            onClick={() => setCollapsed(true)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        {/* Completed Today counter */}
        <SidebarSection icon={CheckCircle2} title="Completed Today">
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-2xl font-bold text-[var(--color-brand-600)]">
              {completedToday}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">tasks completed</span>
          </div>
        </SidebarSection>

        {/* Today's Tasks */}
        <SidebarSection icon={Clock} title="Today's Tasks">
          {todaysTasks.length === 0 ? (
            <EmptyHint text="No tasks due today." />
          ) : (
            todaysTasks.slice(0, 4).map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="block rounded-lg p-2 hover:bg-[rgba(0,0,0,0.03)] transition-colors"
              >
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {t.title}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {t.priority} · {t.campaign?.name || "No campaign"}
                </p>
              </Link>
            ))
          )}
        </SidebarSection>

        {/* Upcoming Deadlines */}
        <SidebarSection icon={CalendarClock} title="Upcoming Deadlines">
          {upcomingDeadlines.length === 0 ? (
            <EmptyHint text="No upcoming deadlines." />
          ) : (
            upcomingDeadlines.map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="block rounded-lg p-2 hover:bg-[rgba(0,0,0,0.03)] transition-colors"
              >
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {t.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {new Date(t.dueDate!).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </Link>
            ))
          )}
        </SidebarSection>

        {/* AI Suggestions */}
        <SidebarSection icon={Sparkles} title="AI Suggestions">
          {insights.slice(0, 3).map((insight) => (
            <div key={insight.id} className="rounded-lg p-2 bg-[var(--color-brand-50)]/50">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                {insight.title}
              </p>
            </div>
          ))}
          {insights.length === 0 && <EmptyHint text="No suggestions right now." />}
        </SidebarSection>

        {/* Recently Updated */}
        <SidebarSection icon={Activity} title="Recently Updated">
          {recentlyUpdated.map((t) => (
            <Link
              key={t.id}
              href={`/tasks/${t.id}`}
              className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-[rgba(0,0,0,0.03)] transition-colors"
            >
              <span className="text-sm text-[var(--color-text-primary)] truncate">
                {t.title}
              </span>
              <span className="text-[10px] text-[var(--color-text-disabled)] shrink-0">
                {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
              </span>
            </Link>
          ))}
        </SidebarSection>
      </motion.aside>
    </AnimatePresence>
  );
}

function SidebarSection({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl glass-card bg-white p-3">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Icon className="h-3.5 w-3.5 text-[var(--color-brand-500)]" />
        <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
          {title}
        </h4>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="text-xs text-[var(--color-text-disabled)] px-2 py-1">{text}</p>
  );
}
