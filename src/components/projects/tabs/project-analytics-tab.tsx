import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

export function ProjectAnalyticsTab({ project }: { project: any }) {
  const tasks = project.tasks || [];
  
  // Task Status Data
  const taskStatusCounts = tasks.reduce((acc: any, task: any) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(taskStatusCounts).map(status => ({
    name: status.replace('_', ' '),
    value: taskStatusCounts[status]
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];

  // Hours Tracking Data
  const hoursData = tasks
    .filter((t: any) => t.estimatedHours || t.actualHours)
    .slice(0, 5) // top 5
    .map((t: any) => ({
      name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
      Estimated: t.estimatedHours || 0,
      Logged: t.actualHours || 0
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PremiumCard className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Task Completion</h3>
        {pieData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No task data available
          </div>
        )}
      </PremiumCard>

      <PremiumCard className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Time Tracking (Top 5 Tasks)</h3>
        {hoursData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Estimated" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Logged" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No time tracking data available
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
