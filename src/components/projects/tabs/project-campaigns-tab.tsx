"use client";

import React, { useState } from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import Link from "next/link";
import { FolderKanban, Plus, Calendar, Target, Users, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CampaignDialog } from "@/components/campaigns/campaign-dialog";

interface ProjectCampaignsTabProps {
  project: any;
  clients?: any[];
  projects?: any[];
}

export function ProjectCampaignsTab({ project, clients = [], projects = [] }: ProjectCampaignsTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const campaigns = project.campaigns || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Campaigns</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">Manage influencer campaigns for this project.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center bg-white/50">
          <div className="mb-4 rounded-full bg-[var(--color-brand-50)] p-4 shadow-sm border border-[var(--color-brand-100)]">
            <FolderKanban className="h-8 w-8 text-[var(--color-brand-500)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No campaigns yet</h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-sm">
            Launch your first campaign to start assigning influencers and managing tasks for this project.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((campaign: any) => {
            const tasks = campaign.tasks || [];
            const completedTasks = tasks.filter((t: any) => t.status === "DONE").length;
            const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
            
            const upcomingTasks = tasks
              .filter((t: any) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) >= new Date())
              .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            
            const nextDeadline = upcomingTasks.length > 0 ? upcomingTasks[0] : null;

            return (
              <Link href={`/campaigns/${campaign.id}`} key={campaign.id} className="block group">
                <PremiumCard hoverEffect="lift" className="p-6 h-full flex flex-col relative border-[rgba(0,0,0,0.08)] bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)] transition-colors line-clamp-1">
                        {campaign.name}
                      </h3>
                      {campaign.budget > 0 && (
                        <p className="text-sm font-medium text-[var(--color-brand-600)] mt-1">
                          ${campaign.budget.toLocaleString()} Budget
                        </p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                      campaign.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      campaign.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      campaign.status === 'PLANNING' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-gray-900">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-gray-100" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-[var(--color-brand-400)]" />
                        <span className="font-medium">{campaign.influencers?.length || 0} Influencers</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium">{completedTasks}/{tasks.length} Tasks Done</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(campaign.influencers || []).slice(0, 4).map((inf: any) => (
                        <Avatar key={inf.id} className="w-8 h-8 border-2 border-white shadow-sm">
                          <AvatarImage src={inf.influencer?.profileImage || ""} />
                          <AvatarFallback className="bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-[10px] font-bold">
                            {(inf.influencer?.influencerName || "U").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {(campaign.influencers?.length || 0) > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm z-10">
                          +{campaign.influencers.length - 4}
                        </div>
                      )}
                    </div>

                    {nextDeadline ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                        <Clock className="w-3.5 h-3.5" />
                        Next Due: {new Date(nextDeadline.dueDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        No upcoming tasks
                      </div>
                    )}
                  </div>
                </PremiumCard>
              </Link>
            );
          })}
        </div>
      )}

      <CampaignDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        clients={clients} 
        projects={projects}
        prefill={{ 
          projectId: project.id, 
          clientId: project.clientId 
        }} 
      />
    </div>
  );
}
