"use client";

import { motion } from "framer-motion";
import { Briefcase, Calendar, Building2, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignTimelineProps {
  campaigns: any[];
}

export function CampaignTimeline({ campaigns }: CampaignTimelineProps) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Campaign History</h2>
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-[var(--color-border)] bg-stone-50 shadow-sm">
          <Briefcase className="h-10 w-10 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No Campaigns Yet</h3>
          <p className="mt-2 text-[var(--color-text-muted)] max-w-sm font-medium">
            This creator has not been added to any campaigns.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "COMPLETED": return "bg-sky-50 text-sky-700 border-sky-200";
      case "DRAFT": return "bg-stone-100 text-stone-700 border-stone-200";
      default: return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  return (
    <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Campaign History</h2>
      
      <div className="relative pl-4 md:pl-0">
        {/* Timeline Line */}
        <div className="absolute left-4 md:left-[140px] top-4 bottom-4 w-px bg-stone-200" />
        
        <div className="space-y-8 relative">
          {campaigns.map((campaign, idx) => (
            <motion.div 
              key={campaign.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative flex flex-col md:flex-row gap-6 md:gap-12"
            >
              {/* Date Marker (Desktop) */}
              <div className="hidden md:flex flex-col items-end pt-1 w-[120px] shrink-0 text-sm font-bold text-[var(--color-text-muted)]">
                {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Ongoing"}
              </div>

              {/* Timeline Node */}
              <div className="absolute left-0 md:left-[140px] -translate-x-1/2 mt-1.5 md:mt-2 h-4 w-4 rounded-full bg-white border-4 border-stone-300 shadow-sm z-10" />

              {/* Card */}
              <div className="flex-1 ml-8 md:ml-0 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                        {campaign.name}
                      </h3>
                      {campaign.client && (
                        <div className="flex items-center text-sm font-semibold text-[var(--color-text-secondary)] mt-1">
                          <Building2 className="w-4 h-4 mr-1.5 text-stone-400" />
                          {campaign.client.name}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(campaign.status)} font-bold tracking-wider rounded-full px-3 py-1`}>
                      {campaign.status}
                    </Badge>
                 </div>

                 <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--color-text-muted)] bg-stone-50 p-3 rounded-xl border border-[var(--color-border)]">
                    <div className="flex items-center">
                       <Calendar className="w-4 h-4 mr-2" />
                       {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "TBD"} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "TBD"}
                    </div>
                    {campaign.status === "COMPLETED" ? (
                      <div className="flex items-center text-emerald-600">
                         <CheckCircle2 className="w-4 h-4 mr-2" />
                         Deliverables Met
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600">
                         <Clock className="w-4 h-4 mr-2" />
                         In Progress
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
