"use client";

import React, { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, RadialBarChart, RadialBar, ScatterChart, Scatter, ZAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, Clock, Target, TrendingUp, DollarSign, Calendar } from "lucide-react";

export default function AnalyticsClient({ widgets, charts }: { widgets: any, charts: any }) {
  // Widget render helper
  const renderWidget = (title: string, value: string | number, icon: any, colorClass: string, desc: string) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Enterprise Analytics</h2>
      </div>
      
      {/* 6 Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {renderWidget(
          "Health Score", 
          `${widgets.healthScore}/100`, 
          <Activity className="h-4 w-4 text-muted-foreground" />,
          widgets.healthScore > 80 ? "text-emerald-500" : widgets.healthScore > 50 ? "text-amber-500" : "text-red-500",
          "Overall system health index"
        )}
        {renderWidget(
          "Risk Level", 
          widgets.risk, 
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
          widgets.risk === "Low" ? "text-emerald-500" : widgets.risk === "Medium" ? "text-amber-500" : "text-red-500",
          "Based on overdue items & budget"
        )}
        {renderWidget(
          "Late Tasks", 
          widgets.lateTasks, 
          <Clock className="h-4 w-4 text-muted-foreground" />,
          widgets.lateTasks > 0 ? "text-red-500" : "text-emerald-500",
          "Tasks past due date"
        )}
        {renderWidget(
          "Pending Deliverables", 
          widgets.pendingDeliverables, 
          <Target className="h-4 w-4 text-muted-foreground" />,
          "text-amber-500",
          "Awaiting influencer delivery"
        )}
        {renderWidget(
          "Upcoming Deadlines", 
          widgets.upcomingDeadlines, 
          <Calendar className="h-4 w-4 text-muted-foreground" />,
          "text-blue-500",
          "Due in the next 7 days"
        )}
        {renderWidget(
          "ROI", 
          `${widgets.roi > 0 ? "+" : ""}${widgets.roi}%`, 
          <TrendingUp className="h-4 w-4 text-muted-foreground" />,
          widgets.roi >= 0 ? "text-emerald-500" : "text-red-500",
          "Revenue vs Budget"
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        
        {/* Project Progress */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Task completion % across active projects</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.projectProgress} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip formatter={(val) => `${val}%`} />
                <Bar dataKey="completion" fill="#8884d8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Progress */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Campaign Progress</CardTitle>
            <CardDescription>Task completion % across active campaigns</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.campaignProgress} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip formatter={(val) => `${val}%`} />
                <Bar dataKey="completion" fill="#82ca9d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Burn Down */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Task Burn Down</CardTitle>
            <CardDescription>Created vs Completed tasks (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.burnDown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 8 }} name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Usage */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Budget Usage</CardTitle>
            <CardDescription>Campaign budget vs influencer fees</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={charts.budgetUsage} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#f5f5f5" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(val) => `$${val}`} />
                <Legend />
                <Bar dataKey="budget" barSize={20} fill="#413ea0" name="Budget" />
                <Line type="monotone" dataKey="usage" stroke="#ff7300" strokeWidth={3} name="Spent" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Paid invoices (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <RechartsTooltip formatter={(val) => `$${val}`} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorAmount)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Influencer Performance (Engagement) */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Engagement Timeline</CardTitle>
            <CardDescription>Posts vs Reels total engagement</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.engagementTimeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="posts" stackId="a" fill="#3b82f6" name="Posts" />
                <Bar dataKey="reels" stackId="a" fill="#f43f5e" name="Reels" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Breakdown */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Task Pipeline Breakdown</CardTitle>
            <CardDescription>Distribution of all tasks across statuses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={20} data={charts.completionBreakdown}>
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background
                  dataKey="value"
                  fill="#8884d8"
                />
                <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                <RechartsTooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Campaign Starts</CardTitle>
            <CardDescription>Timeline of upcoming campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {charts.upcomingEvents && charts.upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {charts.upcomingEvents.map((event: any, index: number) => (
                  <div key={index} className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()} - {event.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming events found.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
