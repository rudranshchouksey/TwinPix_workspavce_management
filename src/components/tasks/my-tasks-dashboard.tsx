"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target,
  CheckCircle2,
  Flame,
  CalendarClock,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { TaskWithDetails } from "./task-kanban";

interface MyTasksDashboardProps {
  tasks: TaskWithDetails[];
  currentUserId: string;
}

export function MyTasksDashboard({ tasks, currentUserId }: MyTasksDashboardProps) {
  const stats = useMemo(() => {
    const myTasks = tasks.filter((t) => t.assigneeId === currentUserId);
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todaysFocus = myTasks.filter(
      (t) =>
        t.status !== "DONE" &&
        t.dueDate &&
        new Date(t.dueDate) >= startOfDay &&
        new Date(t.dueDate) <= endOfDay
    ).length;

    const completedToday = myTasks.filter(
      (t) =>
        t.status === "DONE" &&
        new Date(t.updatedAt).toDateString() === now.toDateString()
    ).length;

    const priorityTasks = myTasks.filter(
      (t) =>
        (t.priority === "HIGH" || t.priority === "URGENT") &&
        t.status !== "DONE"
    ).length;

    const upcomingDeadlines = myTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) > endOfDay &&
        new Date(t.dueDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) &&
        t.status !== "DONE"
    ).length;

    const inProgress = myTasks.filter((t) => t.status === "IN_PROGRESS").length;

    const completedThisWeek = myTasks.filter((t) => {
      if (t.status !== "DONE") return false;
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return new Date(t.updatedAt) >= weekAgo;
    }).length;

    return {
      todaysFocus,
      completedToday,
      priorityTasks,
      upcomingDeadlines,
      inProgress,
      completedThisWeek,
    };
  }, [tasks, currentUserId]);

  const cards = [
    {
      label: "Today's Focus",
      value: stats.todaysFocus,
      icon: <Target className="h-4 w-4 text-white" />,
      accent: "linear-gradient(135deg, #7c3aed, #5b21b6)",
    },
    {
      label: "Completed Today",
      value: stats.completedToday,
      icon: <CheckCircle2 className="h-4 w-4 text-white" />,
      accent: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
      label: "Priority Tasks",
      value: stats.priorityTasks,
      icon: <Flame className="h-4 w-4 text-white" />,
      accent: "linear-gradient(135deg, #f97316, #ea580c)",
    },
    {
      label: "Upcoming Deadlines",
      value: stats.upcomingDeadlines,
      icon: <CalendarClock className="h-4 w-4 text-white" />,
      accent: "linear-gradient(135deg, #ec4899, #db2777)",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: <Clock className="h-4 w-4 text-white" />,
      accent: "linear-gradient(135deg, #3b82f6, #2563eb)",
    },
    {
      label: "Completed This Week",
      value: stats.completedThisWeek,
      icon: <TrendingUp className="h-4 w-4 text-white" />,
      accent: "linear-gradient(135deg, #14b8a6, #0d9488)",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          whileHover={{ y: -2 }}
          className="glass-card group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:border-[var(--color-brand-200)] hover:shadow-executive-md bg-white"
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0 shadow-sm mb-2"
              style={{ background: card.accent }}
            >
              {card.icon}
            </div>
            <p className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {card.value}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--color-text-muted)] tracking-wide uppercase">
              {card.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
