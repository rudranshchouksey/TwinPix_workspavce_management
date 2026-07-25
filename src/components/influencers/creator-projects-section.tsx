"use client";

import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { FolderKanban, Megaphone, Calendar, DollarSign, Briefcase, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

export function CreatorProjectsSection({ influencer }: { influencer: any }) {
  const campaigns = influencer.campaigns?.map((c: any) => c.campaign) || [];
  
  // Extract unique projects
  const projectMap = new Map();
  campaigns.forEach((c: any) => {
    if (c.project) {
      projectMap.set(c.project.id, c.project);
    }
  });
  const allProjects = Array.from(projectMap.values());
  const currentProjects = allProjects.filter((p: any) => p.status === "ACTIVE" || p.status === "IN_PROGRESS");
  const pastProjects = allProjects.filter((p: any) => p.status === "COMPLETED" || p.status === "ARCHIVED");

  // Campaign categorization
  const currentCampaigns = campaigns.filter((c: any) => c.status === "ACTIVE" || c.status === "PLANNING");
  const completedCampaigns = campaigns.filter((c: any) => c.status === "COMPLETED");

  // Tasks
  const allTasks = campaigns.flatMap((c: any) => c.tasks || []);
  const completedTasksCount = allTasks.filter((t: any) => t.status === "DONE").length;
  
  // Unique Brand Collaborations (Clients)
  const clientMap = new Map();
  campaigns.forEach((c: any) => {
    if (c.client) {
      clientMap.set(c.client.id, c.client);
    }
  });
  const brandCollabs = Array.from(clientMap.values());

  // Revenue calculation simulation based on rate cards and completed campaigns/tasks.
  // We'll estimate based on their reelRate / storyRate mapped against campaign activity.
  const baseRate = influencer.reelRate || influencer.storyRate || 500;
  const estimatedRevenue = completedCampaigns.length * baseRate * 2; 

  const performanceScore = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 100;

  return (
    <div className="space-y-8">
      {/* KPI Header Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PremiumCard className="p-5 border-l-4 border-[var(--color-brand-500)]">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium mb-2">
            <DollarSign className="w-4 h-4 text-[var(--color-brand-500)]" />
            Revenue Generated
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">
            ${estimatedRevenue.toLocaleString()}
          </div>
        </PremiumCard>
        
        <PremiumCard className="p-5 border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Performance Score
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">
            {performanceScore}/100
          </div>
        </PremiumCard>

        <PremiumCard className="p-5 border-l-4 border-purple-500">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium mb-2">
            <Briefcase className="w-4 h-4 text-purple-500" />
            Brand Collabs
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">
            {brandCollabs.length}
          </div>
        </PremiumCard>

        <PremiumCard className="p-5 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-medium mb-2">
            <FolderKanban className="w-4 h-4 text-blue-500" />
            Total Projects
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">
            {allProjects.length}
          </div>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Projects & Campaigns */}
        <div className="space-y-6">
          <PremiumCard className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-[rgba(0,0,0,0.05)] pb-4">
              <FolderKanban className="w-5 h-5 text-[var(--color-brand-500)]" />
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Current Projects</h3>
            </div>
            
            {currentProjects.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] italic">No active projects right now.</p>
            ) : (
              <div className="space-y-4">
                {currentProjects.map((proj: any) => (
                  <Link href={`/projects/${proj.id}`} key={proj.id} className="block group">
                    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[rgba(0,0,0,0.01)] group-hover:bg-[var(--color-brand-50)] transition-colors">
                      <h4 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)]">
                        {proj.name}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Status: <span className="text-[var(--color-brand-500)] font-medium">{proj.status}</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </PremiumCard>

          <PremiumCard className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-[rgba(0,0,0,0.05)] pb-4">
              <Megaphone className="w-5 h-5 text-[var(--color-brand-500)]" />
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Current Campaigns</h3>
            </div>
            
            {currentCampaigns.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] italic">No active campaigns.</p>
            ) : (
              <div className="space-y-4">
                {currentCampaigns.map((camp: any) => {
                  const campTasks = camp.tasks || [];
                  const doneTasks = campTasks.filter((t: any) => t.status === "DONE").length;
                  const prog = campTasks.length > 0 ? Math.round((doneTasks / campTasks.length) * 100) : 0;
                  
                  return (
                    <Link href={`/campaigns/${camp.id}`} key={camp.id} className="block group">
                      <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[rgba(0,0,0,0.01)] group-hover:bg-white group-hover:shadow-sm transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)]">
                            {camp.name}
                          </h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[var(--color-brand-100)] text-[var(--color-brand-600)]">
                            {camp.status}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-semibold text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{prog}%</span>
                          </div>
                          <Progress value={prog} className="h-1.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </PremiumCard>
        </div>

        {/* Right Column: Calendar & Past Work */}
        <div className="space-y-6">
          <PremiumCard className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-[rgba(0,0,0,0.05)] pb-4">
              <Calendar className="w-5 h-5 text-[var(--color-brand-500)]" />
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Content Calendar</h3>
            </div>
            
            {allTasks.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] italic">No tasks or deliverables scheduled.</p>
            ) : (
              <div className="space-y-3">
                {allTasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(0,0,0,0.05)]">
                    <div className={`w-2 h-2 rounded-full ${task.status === 'DONE' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-1">{task.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {task.campaign?.name} • {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>

          <PremiumCard className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-[rgba(0,0,0,0.05)] pb-4">
              <Briefcase className="w-5 h-5 text-[var(--color-brand-500)]" />
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Past Work</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">Completed Projects</h4>
                {pastProjects.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">None yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pastProjects.map((p: any) => (
                      <span key={p.id} className="text-xs font-medium px-2.5 py-1 rounded bg-gray-100 text-gray-700">
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[rgba(0,0,0,0.05)]">
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">Completed Campaigns</h4>
                {completedCampaigns.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">None yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {completedCampaigns.map((c: any) => (
                      <span key={c.id} className="text-xs font-medium px-2.5 py-1 rounded bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
}
