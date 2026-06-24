"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Mail,
  Phone,
  AtSign,
  MapPin,
  Tag,
  Clock,
  UserCircle2,
  Wallet,
  CalendarClock,
  Activity,
  Sparkles,
} from "lucide-react";
import { RateCardEditor } from "./rate-card-editor";

interface CreatorRightSidebarProps {
  influencer: any;
  activity: any[];
}

function Fact({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="h-3.5 w-3.5 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{value}</p>
      </div>
    </div>
  );
}

function SidebarSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon className="h-3.5 w-3.5 text-[var(--color-brand-500)]" />
        <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-primary)]">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function CreatorRightSidebar({ influencer, activity }: CreatorRightSidebarProps) {
  const upcomingDeliverables = (influencer.campaigns || [])
    .filter((a: any) => a.campaign?.endDate && new Date(a.campaign.endDate) >= new Date() && !["COMPLETED", "CANCELLED"].includes(a.campaign.status))
    .sort((a: any, b: any) => new Date(a.campaign.endDate).getTime() - new Date(b.campaign.endDate).getTime())
    .slice(0, 4);

  const insights = influencer.creatorIntelligence?.recommendedCategories?.slice(0, 4) || influencer.analytics?.aiInsights?.slice(0, 3) || [];

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-6 self-start">
      <SidebarSection icon={UserCircle2} title="Quick Facts">
        <Fact icon={Tag} label="Category" value={influencer.category} />
        <Fact icon={MapPin} label="Location" value={influencer.location} />
        <Fact icon={UserCircle2} label="Assigned Manager" value={influencer.assignedManager?.name} />
        <Fact
          icon={Clock}
          label="Last Sync"
          value={influencer.lastSyncDate ? format(new Date(influencer.lastSyncDate), "MMM d, yyyy") : "Never"}
        />
      </SidebarSection>

      <SidebarSection icon={Mail} title="Contact Information">
        <Fact icon={Mail} label="Email" value={influencer.email} />
        <Fact icon={Phone} label="Phone" value={influencer.phoneNumber} />
        <Fact icon={AtSign} label="Instagram" value={`@${influencer.instagramHandle}`} />
      </SidebarSection>

      <SidebarSection icon={Wallet} title="Creator Rates">
        <RateCardEditor influencer={influencer} />
      </SidebarSection>

      <SidebarSection icon={CalendarClock} title="Upcoming Deliverables">
        {upcomingDeliverables.length === 0 ? (
          <p className="text-xs text-[var(--color-text-disabled)] py-1">No upcoming deliverables.</p>
        ) : (
          <div className="space-y-2">
            {upcomingDeliverables.map((a: any) => (
              <Link
                key={a.id}
                href={`/campaigns/${a.campaign.id}`}
                className="block rounded-lg p-2 -mx-2 hover:bg-[rgba(0,0,0,0.03)] transition-colors"
              >
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{a.campaign.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {a.deliverables || "No deliverables specified"} · due{" "}
                  {format(new Date(a.campaign.endDate), "MMM d")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </SidebarSection>

      <SidebarSection icon={Activity} title="Recent Activity">
        {activity.length === 0 ? (
          <p className="text-xs text-[var(--color-text-disabled)] py-1">No recent activity.</p>
        ) : (
          <div className="space-y-2.5">
            {activity.slice(0, 6).map((a: any) => (
              <div key={a.id}>
                <p className="text-xs text-[var(--color-text-secondary)] leading-snug">{a.details}</p>
                <p className="text-[10px] text-[var(--color-text-disabled)] mt-0.5">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </SidebarSection>

      <SidebarSection icon={Sparkles} title="AI Recommendations">
        {insights.length === 0 ? (
          <p className="text-xs text-[var(--color-text-disabled)] py-1">Generate AI intelligence to see recommendations.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {insights.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] text-[11px] font-bold border border-[var(--color-brand-100)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </SidebarSection>
    </aside>
  );
}
