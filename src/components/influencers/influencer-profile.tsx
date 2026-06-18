import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, MapPin, AtSign, ExternalLink } from "lucide-react";
import { InfluencerMetrics } from "./influencer-metrics";

interface InfluencerProfileProps {
  influencer: any;
}

export function InfluencerProfile({ influencer }: InfluencerProfileProps) {
  // Render colored badge based on status
  let statusColor = "bg-[rgba(0,0,0,0.1)] text-[var(--color-text-secondary)] border-[rgba(0,0,0,0.1)]";
  switch (influencer.status) {
    case "NEW_LEAD":
      statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      break;
    case "CONTACTED":
      statusColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      break;
    case "REPLIED":
      statusColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
      break;
    case "NEGOTIATING":
      statusColor = "bg-orange-500/10 text-orange-400 border-orange-500/20";
      break;
    case "ACTIVE":
    case "ONBOARDED":
      statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      break;
    case "BLACKLISTED":
      statusColor = "bg-red-500/10 text-red-400 border-red-500/20";
      break;
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-[rgba(0,0,0,0.05)] border border-[rgba(0,0,0,0.1)] shrink-0 flex items-center justify-center">
          {influencer.profileImage ? (
            <img
              src={influencer.profileImage}
              alt={influencer.influencerName || "Unnamed"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl font-bold text-[var(--color-text-muted)]">
              {influencer.instagramHandle.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                {influencer.influencerName || "Unnamed Influencer"}
              </h1>
              <a
                href={`https://instagram.com/${influencer.instagramHandle}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] mt-1 transition-colors w-fit group"
              >
                <AtSign className="w-4 h-4 mr-2" />
                @{influencer.instagramHandle}
                <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
            <Badge variant="outline" className={`${statusColor} rounded-full text-sm py-1 px-3`}>
              {influencer.status.replace("_", " ")}
            </Badge>
          </div>

          <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
            {influencer.profileDescription || "No bio provided."}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {influencer.category && (
              <Badge variant="secondary" className="bg-[rgba(0,0,0,0.05)] text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.1)]">
                {influencer.category}
              </Badge>
            )}
            {influencer.location && (
              <div className="flex items-center text-sm text-[var(--color-text-muted)]">
                <MapPin className="w-4 h-4 mr-1.5" />
                {influencer.location}
              </div>
            )}
            {influencer.email && (
              <a href={`mailto:${influencer.email}`} className="flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                <Mail className="w-4 h-4 mr-1.5" />
                Email
              </a>
            )}
            {influencer.phoneNumber && (
              <div className="flex items-center text-sm text-[var(--color-text-muted)]">
                <Phone className="w-4 h-4 mr-1.5" />
                {influencer.phoneNumber}
              </div>
            )}
            {influencer.profileLink && (
              <a href={influencer.profileLink.startsWith('http') ? influencer.profileLink : `https://${influencer.profileLink}`} target="_blank" rel="noreferrer" className="flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                <Globe className="w-4 h-4 mr-1.5" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Analytics Section */}
          <section>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
              Performance Analytics
            </h2>
            <InfluencerMetrics influencer={influencer} />
          </section>
        </div>

        <div className="space-y-6">
          {/* Rates Sidebar */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              Creator Rates
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[rgba(0,0,0,0.05)]">
                <span className="text-sm text-[var(--color-text-secondary)]">Reel Rate</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{influencer.reelRate ? `$${influencer.reelRate}` : "TBD"}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[rgba(0,0,0,0.05)]">
                <span className="text-sm text-[var(--color-text-secondary)]">Story Rate</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{influencer.storyRate ? `$${influencer.storyRate}` : "TBD"}</span>
              </div>
            </div>
          </div>

          {/* Notes Sidebar */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              Internal Notes
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
              {influencer.notes || "No internal notes recorded yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
