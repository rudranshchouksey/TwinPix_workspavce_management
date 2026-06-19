"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MessageSquare, 
  FileCheck, 
  Play, 
  CreditCard 
} from "lucide-react";

interface CampaignTimelineViewProps {
  campaigns: any[];
}

export function CampaignTimelineView({ campaigns }: CampaignTimelineViewProps) {
  // Generate timeline events based on the campaigns
  // For a real app, this would ideally come from CampaignActivity or a unified activity stream
  // For now, we derive events based on status and created/updated dates
  
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)] border border-dashed rounded-xl border-[var(--color-border)]">
        No campaign history available.
      </div>
    );
  }

  const events: any[] = [];
  
  campaigns.forEach(assignment => {
    const { campaign } = assignment;
    
    // Assigned event
    events.push({
      id: `assigned-${assignment.id}`,
      date: new Date(assignment.createdAt),
      title: "Assigned to Campaign",
      description: `Added to ${campaign.name}`,
      icon: Circle,
      color: "text-blue-500",
      bg: "bg-blue-100 border-blue-200",
    });

    // Determine other events based on status
    const status = assignment.status.toUpperCase();
    const updatedDate = new Date(assignment.updatedAt);
    const isUpdated = updatedDate.getTime() > new Date(assignment.createdAt).getTime() + 60000;

    if (["NEGOTIATING", "ACTIVE", "IN_PROGRESS"].includes(status) && isUpdated) {
      events.push({
        id: `negotiated-${assignment.id}`,
        date: new Date(updatedDate.getTime() - 86400000 * 2), // Mocking past date for timeline logic if real history absent
        title: "Fee Negotiated",
        description: `Agreed to deliverables for ${campaign.name}`,
        icon: MessageSquare,
        color: "text-amber-500",
        bg: "bg-amber-100 border-amber-200",
      });
    }

    if (["CONTENT_SUBMITTED", "APPROVED", "COMPLETED", "PAID"].includes(status)) {
      events.push({
        id: `submitted-${assignment.id}`,
        date: new Date(updatedDate.getTime() - 86400000), 
        title: "Content Submitted",
        description: `Draft submitted for ${campaign.name}`,
        icon: Play,
        color: "text-purple-500",
        bg: "bg-purple-100 border-purple-200",
      });
    }

    if (["APPROVED", "COMPLETED", "PAID"].includes(status)) {
      events.push({
        id: `approved-${assignment.id}`,
        date: updatedDate, 
        title: "Content Approved",
        description: `Client approved content for ${campaign.name}`,
        icon: FileCheck,
        color: "text-emerald-500",
        bg: "bg-emerald-100 border-emerald-200",
      });
    }

    if (status === "PAID") {
      events.push({
        id: `paid-${assignment.id}`,
        date: new Date(updatedDate.getTime() + 86400000), 
        title: "Payment Completed",
        description: `Payment released for ${campaign.name}`,
        icon: CreditCard,
        color: "text-indigo-500",
        bg: "bg-indigo-100 border-indigo-200",
      });
    }
  });

  // Sort events chronologically, newest first
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Take only top 10 for UI brevity
  const topEvents = events.slice(0, 10);

  return (
    <div className="relative pl-6 border-l-2 border-[var(--color-border)] ml-4 space-y-8 my-6">
      {topEvents.map((event, i) => {
        const Icon = event.icon;
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className={`absolute -left-[35px] top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-white ${event.bg}`}>
              <Icon className={`w-3 h-3 ${event.color}`} />
            </div>
            
            <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-[var(--color-text-primary)]">{event.title}</h4>
                <div className="flex items-center text-xs font-medium text-[var(--color-text-muted)]">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(event.date, "MMM d, yyyy")}
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">{event.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
