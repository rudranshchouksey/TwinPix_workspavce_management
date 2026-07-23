import React from "react";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Clock, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { TimesheetsClient } from "./timesheets-client";

export const metadata = {
  title: "Timesheets | TwinPix Studio",
};

export default async function TimesheetsPage() {
  const user = await requireAuth();
  
  // Get all time entries for the current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const recentEntries = await db.timeEntry.findMany({
    orderBy: { startTime: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
      task: { select: { id: true, title: true, campaign: { select: { id: true, title: true } } } }
    }
  });

  const weekEntries = recentEntries.filter(e => 
    new Date(e.startTime) >= weekStart && new Date(e.startTime) <= weekEnd
  );

  // Calculate Weekly Summary
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const chartData = days.map(day => {
    const entriesForDay = weekEntries.filter(e => isSameDay(new Date(e.startTime), day));
    const totalMinutes = entriesForDay.reduce((sum, e) => sum + e.durationMinutes, 0);
    return {
      name: format(day, 'EEE'),
      fullDate: format(day, 'MMM d'),
      hours: Number((totalMinutes / 60).toFixed(2))
    };
  });

  // Calculate User Productivity
  const userStats = weekEntries.reduce((acc, entry) => {
    const uId = entry.userId;
    if (!acc[uId]) {
      acc[uId] = {
        user: entry.user,
        totalMinutes: 0,
        taskCount: new Set(),
      };
    }
    acc[uId].totalMinutes += entry.durationMinutes;
    acc[uId].taskCount.add(entry.taskId);
    return acc;
  }, {} as Record<string, any>);

  const leaderboard = Object.values(userStats)
    .map(stat => ({
      ...stat,
      hours: Number((stat.totalMinutes / 60).toFixed(2)),
      tasks: stat.taskCount.size
    }))
    .sort((a, b) => b.hours - a.hours);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <Clock className="w-6 h-6 text-[var(--color-brand-500)]" />
            Time Tracking & Analytics
          </h1>
          <p className="text-[var(--color-text-secondary)]">Monitor team productivity and project time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-2">
            <Clock className="w-4 h-4" /> Total Logged (This Week)
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">
            {chartData.reduce((sum, d) => sum + d.hours, 0).toFixed(1)} <span className="text-lg font-normal text-[var(--color-text-muted)]">hours</span>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-2">
            <Users className="w-4 h-4" /> Active Team Members
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">
            {leaderboard.length} <span className="text-lg font-normal text-[var(--color-text-muted)]">users</span>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-2">
            <TrendingUp className="w-4 h-4" /> Most Productive
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] truncate">
            {leaderboard[0]?.user.name || leaderboard[0]?.user.email || "N/A"}
          </div>
        </div>
      </div>

      <TimesheetsClient chartData={chartData} leaderboard={leaderboard} recentEntries={recentEntries} currentUser={user} />
    </div>
  );
}
