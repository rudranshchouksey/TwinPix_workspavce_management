"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { Clock, Briefcase, FileText } from "lucide-react";
import Link from "next/link";

interface TimesheetsClientProps {
  chartData: any[];
  leaderboard: any[];
  recentEntries: any[];
  currentUser: any;
}

export function TimesheetsClient({ chartData, leaderboard, recentEntries, currentUser }: TimesheetsClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-1 rounded-lg border border-[rgba(0,0,0,0.08)] inline-flex">
        <TabsList className="bg-transparent">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Leaderboard</TabsTrigger>
          <TabsTrigger value="log">Detailed Log</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0 space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>Total hours logged per day for the current week.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border shadow-lg rounded-lg p-3">
                            <p className="font-semibold text-sm mb-1">{payload[0].payload.fullDate}</p>
                            <p className="text-[var(--color-brand-600)] font-bold text-lg">
                              {payload[0].value} <span className="text-xs font-normal text-slate-500">hours</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hours > 0 ? "var(--color-brand-500)" : "var(--color-surface-200)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="team" className="mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Team Productivity</CardTitle>
            <CardDescription>Active users ranked by total hours logged this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No time logged this week.</div>
              ) : (
                leaderboard.map((stat, idx) => (
                  <div key={stat.user.id} className="flex items-center gap-4 p-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[rgba(0,0,0,0.01)] hover:bg-white hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 shadow-sm overflow-hidden text-sm">
                      {stat.user.image ? <img src={stat.user.image} alt="Avatar" className="w-full h-full object-cover" /> : stat.user.name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-text-primary)] truncate">{stat.user.name || stat.user.email}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{stat.tasks} tasks worked on</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-[var(--color-brand-600)]">{stat.hours}h</div>
                      {idx === 0 && <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Top Performer</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="log" className="mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Detailed Time Logs</CardTitle>
            <CardDescription>Recent time entries across the entire workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {recentEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  No time entries found.
                </div>
              ) : (
                recentEntries.map((entry) => (
                  <div key={entry.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white shadow-sm hover:border-[rgba(0,0,0,0.1)] transition-colors group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                          {entry.user.image ? <img src={entry.user.image} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{entry.user.name?.[0]}</span>}
                        </div>
                        <span className="font-medium text-sm text-[var(--color-text-primary)]">{entry.user.name}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">• {format(new Date(entry.startTime), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-[var(--color-brand-600)]">{(entry.durationMinutes / 60).toFixed(2)}h</span>
                        <span className="text-[var(--color-text-muted)]">on</span>
                        <Link href={`/tasks/${entry.taskId}`} className="font-medium hover:underline flex items-center gap-1 text-[var(--color-text-primary)] truncate max-w-[200px] sm:max-w-xs">
                          {entry.task?.title || "Unknown Task"}
                        </Link>
                      </div>

                      {entry.description && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-2 pl-4 border-l-2 border-[rgba(0,0,0,0.1)]">
                          {entry.description}
                        </p>
                      )}
                    </div>

                    {entry.task?.campaign && (
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-xs text-[var(--color-text-secondary)] bg-[rgba(0,0,0,0.02)] px-2 py-1 rounded h-fit">
                        <Briefcase className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{entry.task.campaign.title}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
