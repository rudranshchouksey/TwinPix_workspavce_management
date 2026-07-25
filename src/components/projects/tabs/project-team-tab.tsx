import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

export function ProjectTeamTab({ project }: { project: any }) {
  const teamMap = new Map();

  (project.campaigns || []).forEach((c: any) => {
    (c.teamMembers || []).forEach((tm: any) => {
      if (tm.user) {
        teamMap.set(tm.user.id, { ...tm.user, role: tm.role || 'Member' });
      }
    });
  });

  (project.tasks || []).forEach((t: any) => {
    if (t.assignee) {
      if (!teamMap.has(t.assignee.id)) {
        teamMap.set(t.assignee.id, { ...t.assignee, role: 'Task Assignee' });
      }
    }
  });

  const team = Array.from(teamMap.values());

  if (team.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center">
        <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
          <Users className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No team members</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Assign users to campaigns or tasks to see them here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {team.map((user: any) => (
        <PremiumCard key={user.id} className="p-4 flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-[var(--color-brand-100)] text-[var(--color-brand-600)] font-semibold">
              {(user.name || "U").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{user.name}</h4>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[rgba(0,0,0,0.05)] text-[var(--color-text-secondary)]">
              {user.role}
            </span>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}
