"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const EVENT_TYPES = [
  // Campaigns - Purple
  { id: "CAMPAIGN", label: "Campaigns", color: "bg-purple-500" },
  { id: "CAMPAIGN_LAUNCH", label: "Campaign Launches", color: "bg-purple-600" },
  { id: "CAMPAIGN_DEADLINE", label: "Campaign Deadlines", color: "bg-purple-700" },
  { id: "CAMPAIGN_REVIEW", label: "Campaign Reviews", color: "bg-purple-400" },
  // Content - Green
  { id: "CONTENT_POST", label: "Content Posts", color: "bg-emerald-500" },
  { id: "INSTAGRAM_POST", label: "IG Posts", color: "bg-emerald-400" },
  { id: "INSTAGRAM_REEL", label: "IG Reels", color: "bg-emerald-500" },
  { id: "INSTAGRAM_STORY", label: "IG Stories", color: "bg-emerald-300" },
  { id: "YOUTUBE_UPLOAD", label: "YouTube", color: "bg-emerald-600" },
  { id: "BRAND_COLLABORATION", label: "Brand Collabs", color: "bg-emerald-700" },
  // Meetings - Blue
  { id: "MEETING", label: "Meetings", color: "bg-blue-500" },
  { id: "CLIENT_MEETING", label: "Client Meetings", color: "bg-blue-600" },
  { id: "DISCOVERY_CALL", label: "Discovery Calls", color: "bg-blue-400" },
  { id: "TEAM_MEETING", label: "Team Meetings", color: "bg-blue-500" },
  { id: "INTERNAL_STANDUP", label: "Standups", color: "bg-blue-300" },
  // Deliverables - Red
  { id: "TASK", label: "Tasks", color: "bg-red-500" },
  { id: "DEADLINE", label: "Deadlines", color: "bg-red-600" },
  { id: "DELIVERABLE_DUE", label: "Deliverables Due", color: "bg-red-500" },
  // Approvals & Reminders - Orange
  { id: "FOLLOW_UP_REMINDER", label: "Follow-ups", color: "bg-orange-400" },
  { id: "CONTRACT_REMINDER", label: "Contract Reminders", color: "bg-orange-500" },
  { id: "PAYMENT_REMINDER", label: "Payment Reminders", color: "bg-orange-600" },
  { id: "APPROVAL_DEADLINE", label: "Approval Deadlines", color: "bg-orange-500" },
  { id: "CONTENT_APPROVAL", label: "Content Approvals", color: "bg-orange-400" },
  // Shoots & Events - Pink
  { id: "INFLUENCER_PHOTOSHOOT", label: "Photoshoots", color: "bg-pink-500" },
  { id: "VIDEO_SHOOT", label: "Video Shoots", color: "bg-pink-600" },
  { id: "LIVE_EVENT", label: "Live Events", color: "bg-pink-700" },
  { id: "PODCAST_RECORDING", label: "Podcasts", color: "bg-pink-400" },
  // Contracts - Slate
  { id: "CONTRACT_SIGNING", label: "Contracts", color: "bg-slate-500" },
  // Payments - Yellow
  { id: "INVOICE_DUE", label: "Invoices Due", color: "bg-yellow-500" }
];

interface CalendarFiltersProps {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
}

export function CalendarFilters({ selectedTypes, onChange }: CalendarFiltersProps) {
  const toggleType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onChange(selectedTypes.filter((t) => t !== typeId));
    } else {
      onChange([...selectedTypes, typeId]);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-sm">Filters</h3>
      <div className="space-y-3">
        {EVENT_TYPES.map((type) => (
          <div key={type.id} className="flex items-center space-x-2">
            <Checkbox
              id={`filter-${type.id}`}
              checked={selectedTypes.includes(type.id)}
              onCheckedChange={() => toggleType(type.id)}
            />
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${type.color}`} />
              <Label htmlFor={`filter-${type.id}`} className="text-sm cursor-pointer">
                {type.label}
              </Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
