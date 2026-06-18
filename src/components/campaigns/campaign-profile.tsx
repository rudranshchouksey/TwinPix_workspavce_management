"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Users, Target, CheckCircle2, Megaphone, FileText, BarChart3 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

interface CampaignProfileProps {
  campaign: any;
}

export function CampaignProfile({ campaign }: CampaignProfileProps) {
  // Render colored badge based on status
  let statusColor = "bg-gray-500/15 text-gray-400 border-gray-500/20";
  if (campaign.status === "ACTIVE") statusColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (campaign.status === "REVIEW") statusColor = "bg-amber-500/15 text-amber-400 border-amber-500/20";
  if (campaign.status === "COMPLETED") statusColor = "bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (campaign.status === "CANCELLED") statusColor = "bg-rose-500/15 text-rose-400 border-rose-500/20";

  const totalInfluencers = campaign.influencers?.length || 0;
  const totalTeam = campaign.teamMembers?.length || 0;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] border border-[rgba(0,0,0,0.1)] shrink-0 flex items-center justify-center shadow-lg shadow-[var(--color-brand-500)]/20">
          <Megaphone className="w-10 h-10 text-white" />
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                {campaign.name}
              </h1>
              <div className="text-sm font-medium text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
                Client: <span className="text-[var(--color-brand-400)]">{campaign.client?.companyName}</span>
              </div>
            </div>
            <Badge variant="outline" className={`${statusColor} rounded-full text-sm py-1 px-4 font-semibold tracking-wide uppercase`}>
              {campaign.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <div className="flex items-center text-sm text-[var(--color-text-primary)] font-medium bg-[rgba(0,0,0,0.05)] px-3 py-1.5 rounded-md border border-[rgba(0,0,0,0.05)]">
              <DollarSign className="w-4 h-4 mr-1 text-[var(--color-brand-400)]" />
              {campaign.budget.toLocaleString()} Budget
            </div>
            {campaign.startDate && (
              <div className="flex items-center text-sm text-[var(--color-text-muted)]">
                <Calendar className="w-4 h-4 mr-2 text-[var(--color-text-disabled)]" />
                Starts: {format(new Date(campaign.startDate), "MMM d, yyyy")}
              </div>
            )}
            {campaign.endDate && (
              <div className="flex items-center text-sm text-[var(--color-text-muted)]">
                <Target className="w-4 h-4 mr-2 text-[var(--color-text-disabled)]" />
                Ends: {format(new Date(campaign.endDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Influencers"
          value={totalInfluencers.toString()}
          icon={<Users className="h-5 w-5 text-white/90" />}
          accent="bg-purple-500"
          index={0}
        />
        <StatCard
          label="Team Members"
          value={totalTeam.toString()}
          icon={<BarChart3 className="h-5 w-5 text-white/90" />}
          accent="bg-blue-500"
          index={1}
        />
        <StatCard
          label="Activities"
          value={campaign.activities?.length.toString() || "0"}
          icon={<FileText className="h-5 w-5 text-white/90" />}
          accent="bg-emerald-500"
          index={2}
        />
        <StatCard
          label="Completion"
          value={campaign.status === "COMPLETED" ? "100%" : campaign.status === "ACTIVE" ? "50%" : "0%"}
          icon={<CheckCircle2 className="h-5 w-5 text-white/90" />}
          accent="bg-[var(--color-brand-500)]"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Deliverables Section */}
          <section className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              Global Deliverables
            </h2>
            <div className="p-4 rounded-lg bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.05)]">
              {campaign.deliverables ? (
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {campaign.deliverables}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] italic">No deliverables specified yet.</p>
              )}
            </div>
          </section>

          {/* Activity Timeline could go here similar to clients */}
        </div>

        <div className="space-y-6">
          {/* Quick Notes Sidebar */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-5">
              Campaign Notes
            </h3>
            
            {campaign.notes ? (
              <p className="text-sm text-[var(--color-text-secondary)] italic border-l-2 border-[rgba(0,0,0,0.1)] pl-3 whitespace-pre-wrap">
                {campaign.notes}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">No internal notes.</p>
            )}
          </div>
          
          {/* Influencer Snapshot */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              Influencers ({totalInfluencers})
            </h3>
            <div className="space-y-3">
              {campaign.influencers?.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center gap-3 p-2 rounded-lg bg-[rgba(0,0,0,0.02)]">
                  <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.1)] flex items-center justify-center shrink-0 overflow-hidden">
                    {assignment.influencer.profileImage ? (
                      <img src={assignment.influencer.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{assignment.influencer.influencerName}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">@{assignment.influencer.instagramHandle}</p>
                  </div>
                </div>
              ))}
              {totalInfluencers === 0 && (
                <p className="text-xs text-[var(--color-text-disabled)]">No influencers assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
