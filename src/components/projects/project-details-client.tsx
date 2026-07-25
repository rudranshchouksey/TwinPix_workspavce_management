"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectOverviewTab } from "./tabs/project-overview-tab";
import { ProjectCampaignsTab } from "./tabs/project-campaigns-tab";
import { ProjectInfluencersTab } from "./tabs/project-influencers-tab";
import { ProjectTasksTab } from "./tabs/project-tasks-tab";
import { ProjectCalendarTab } from "./tabs/project-calendar-tab";
import { ProjectFilesTab } from "./tabs/project-files-tab";
import { ProjectTeamTab } from "./tabs/project-team-tab";
import { ProjectAnalyticsTab } from "./tabs/project-analytics-tab";
import { ProjectActivityTab } from "./tabs/project-activity-tab";
import { ProjectSettingsTab } from "./tabs/project-settings-tab";
import { ProjectAssistantTab } from "./tabs/project-assistant-tab";

interface ProjectDetailsClientProps {
  project: any;
  clients?: any[];
  projects?: any[];
  users?: any[];
}

export function ProjectDetailsClient({ project, clients = [], projects = [], users = [] }: ProjectDetailsClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={project.name} 
          description={project.description || "No description provided."} 
        />
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
            project.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-500' :
            'bg-amber-500/10 text-amber-500'
          }`}>
            {project.status}
          </span>
          {project.client && (
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Client: <span className="text-[var(--color-brand-500)]">{project.client.companyName}</span>
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-2 mb-4 border-b border-[rgba(0,0,0,0.05)]">
          <TabsList variant="line" className="w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="influencers">Influencers</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <ProjectOverviewTab project={project} />
        </TabsContent>
        <TabsContent value="campaigns">
          <ProjectCampaignsTab project={project} clients={clients} projects={projects} />
        </TabsContent>
        <TabsContent value="influencers">
          <ProjectInfluencersTab project={project} />
        </TabsContent>
        <TabsContent value="tasks">
          <ProjectTasksTab project={project} users={users} />
        </TabsContent>
        <TabsContent value="calendar">
          <ProjectCalendarTab project={project} />
        </TabsContent>
        <TabsContent value="files">
          <ProjectFilesTab project={project} />
        </TabsContent>
        <TabsContent value="team">
          <ProjectTeamTab project={project} />
        </TabsContent>
        <TabsContent value="analytics">
          <ProjectAnalyticsTab project={project} />
        </TabsContent>
        <TabsContent value="activity">
          <ProjectActivityTab project={project} />
        </TabsContent>
        <TabsContent value="ai-assistant">
          <ProjectAssistantTab project={project} />
        </TabsContent>
        <TabsContent value="settings">
          <ProjectSettingsTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
