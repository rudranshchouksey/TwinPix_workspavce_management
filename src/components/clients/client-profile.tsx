import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, MapPin, Building2, Briefcase } from "lucide-react";
import { ClientNotes } from "./client-notes";
import { ClientActivity } from "./client-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { MessageSquareText, Activity, Clock, Target } from "lucide-react";
import { differenceInDays } from "date-fns";

interface ClientProfileProps {
  client: any;
}

export function ClientProfile({ client }: ClientProfileProps) {
  // Render colored badge based on status
  let statusColor = "bg-gray-500/15 text-gray-400 border-gray-500/20";
  if (client.status === "ACTIVE") statusColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (client.status === "LEAD") statusColor = "bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (client.status === "CLOSED") statusColor = "bg-rose-500/15 text-rose-400 border-rose-500/20";

  const daysSinceCreation = differenceInDays(new Date(), new Date(client.createdAt));

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.1)] shrink-0 flex items-center justify-center shadow-inner">
          <Building2 className="w-10 h-10 text-[var(--color-text-muted)]" />
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                {client.companyName}
              </h1>
              {client.brandName && (
                <div className="text-sm font-medium text-[var(--color-brand-400)] mt-1">
                  Brand: {client.brandName}
                </div>
              )}
            </div>
            <Badge variant="outline" className={`${statusColor} rounded-full text-sm py-1 px-4 font-semibold tracking-wide uppercase`}>
              {client.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            {client.industry && (
              <Badge variant="secondary" className="bg-[rgba(0,0,0,0.05)] text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.1)]">
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                {client.industry}
              </Badge>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                <Mail className="w-4 h-4 mr-2 text-[var(--color-text-disabled)]" />
                {client.email}
              </a>
            )}
            {client.phone && (
              <div className="flex items-center text-sm text-[var(--color-text-muted)]">
                <Phone className="w-4 h-4 mr-2 text-[var(--color-text-disabled)]" />
                {client.phone}
              </div>
            )}
            {client.website && (
              <a href={client.website} target="_blank" rel="noreferrer" className="flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand-400)] transition-colors">
                <Globe className="w-4 h-4 mr-2 text-[var(--color-text-disabled)] group-hover:text-[var(--color-brand-400)]" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Notes"
          value={client.clientNotes.length.toString()}
          icon={<MessageSquareText className="h-5 w-5 text-white/90" />}
          accent="bg-purple-500"
          index={0}
        />
        <StatCard
          label="Activity Events"
          value={client.activities.length.toString()}
          icon={<Activity className="h-5 w-5 text-white/90" />}
          accent="bg-blue-500"
          index={1}
        />
        <StatCard
          label="Days as Client"
          value={daysSinceCreation.toString()}
          icon={<Clock className="h-5 w-5 text-white/90" />}
          accent="bg-emerald-500"
          index={2}
        />
        <StatCard
          label="Current Status"
          value={client.status}
          icon={<Target className="h-5 w-5 text-white/90" />}
          accent="bg-[var(--color-brand-500)]"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Internal Notes Section */}
          <section className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              Internal Notes
            </h2>
            <ClientNotes clientId={client.id} notes={client.clientNotes} />
          </section>
        </div>

        <div className="space-y-6">
          {/* Details Sidebar */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-5">
              Client Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Contact Person</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{client.contactPerson}</p>
              </div>
              
              {client.address && (
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">Address</p>
                  <p className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-[var(--color-text-disabled)] shrink-0" />
                    <span>{client.address}</span>
                  </p>
                </div>
              )}

              {client.notes && (
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">Quick Note</p>
                  <p className="text-sm text-[var(--color-text-secondary)] italic border-l-2 border-[rgba(0,0,0,0.1)] pl-3">
                    "{client.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              Tags
            </h3>
            {client.tags && client.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-[rgba(0,0,0,0.1)] text-[var(--color-text-secondary)] bg-[rgba(0,0,0,0.02)]">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">No tags assigned.</p>
            )}
          </div>

          {/* Activity Timeline Sidebar */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card overflow-hidden">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-5">
              Recent Activity
            </h3>
            <ClientActivity activities={client.activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
