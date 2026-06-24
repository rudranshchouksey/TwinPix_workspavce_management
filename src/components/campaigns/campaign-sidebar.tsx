"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { PanelRightClose, PanelRightOpen, CalendarClock, Activity, Sparkles, Megaphone } from "lucide-react";
import type { CampaignInsight } from "@/services/campaigns/campaign-insights.service";
import { getDaysRemainingLabel, STATUS_BADGE_STYLES } from "./campaign-card-utils";
import { Badge } from "@/components/ui/badge";

interface CampaignSidebarProps {
  campaigns: any[];
  insights: CampaignInsight[];
  activity: any[];
}

export function CampaignSidebar({ campaigns, insights, activity }: CampaignSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  const upcomingDeadlines = campaigns
    .filter((c) => c.endDate && new Date(c.endDate) >= new Date() && !["COMPLETED", "CANCELLED"].includes(c.status))
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  const recentCampaigns = [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 rounded-l-xl border border-[rgba(0,0,0,0.08)] bg-white px-2 py-3 shadow-md hover:bg-[var(--color-brand-50)] transition-colors"
        title="Open campaign sidebar"
      >
        <PanelRightOpen className="h-4 w-4 text-[var(--color-text-muted)]" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        className="w-full lg:w-72 shrink-0 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Overview</h3>
          <button onClick={() => setCollapsed(true)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        <SidebarSection icon={CalendarClock} title="Upcoming Deadlines">
          {upcomingDeadlines.length === 0 ? (
            <EmptyHint text="No deadlines coming up." />
          ) : (
            upcomingDeadlines.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="block rounded-lg p-2 hover:bg-[rgba(0,0,0,0.03)] transition-colors">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{c.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{getDaysRemainingLabel(c)}</p>
              </Link>
            ))
          )}
        </SidebarSection>

        <SidebarSection icon={Sparkles} title="AI Recommendations">
          {insights.slice(0, 3).map((insight) => (
            <div key={insight.id} className="rounded-lg p-2 bg-[var(--color-brand-50)]/50">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">{insight.title}</p>
            </div>
          ))}
        </SidebarSection>

        <SidebarSection icon={Activity} title="Recent Activity">
          {activity.length === 0 ? (
            <EmptyHint text="No recent activity." />
          ) : (
            activity.slice(0, 6).map((a) => (
              <div key={a.id} className="p-2">
                <p className="text-xs text-[var(--color-text-secondary)] leading-snug">{a.details}</p>
                <p className="text-[10px] text-[var(--color-text-disabled)] mt-0.5">
                  {a.campaign?.name} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
            ))
          )}
        </SidebarSection>

        <SidebarSection icon={Megaphone} title="Recent Campaigns">
          {recentCampaigns.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-[rgba(0,0,0,0.03)] transition-colors">
              <span className="text-sm text-[var(--color-text-primary)] truncate">{c.name}</span>
              <Badge variant="outline" className={`${STATUS_BADGE_STYLES[c.status]} rounded-full text-[10px] py-0 px-1.5 shrink-0`}>
                {c.status}
              </Badge>
            </Link>
          ))}
        </SidebarSection>
      </motion.aside>
    </AnimatePresence>
  );
}

function SidebarSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass-card bg-white p-3">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Icon className="h-3.5 w-3.5 text-[var(--color-brand-500)]" />
        <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">{title}</h4>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-xs text-[var(--color-text-disabled)] px-2 py-1">{text}</p>;
}
