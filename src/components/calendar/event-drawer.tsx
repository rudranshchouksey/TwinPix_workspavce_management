"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";
import { Clock, MapPin, Users, Edit3, Trash2, Calendar, FileText, CheckCircle2, MessageSquare, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventDrawer({
  isOpen,
  setIsOpen,
  eventData,
  onEdit,
  onDelete,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  eventData: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!eventData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-[#FAFAFA] border-l border-[rgba(0,0,0,0.08)] shadow-2xl">
        <div className="relative h-32 w-full shrink-0">
          <div 
            className="absolute inset-0 opacity-20" 
            style={{ backgroundColor: eventData.color || "#3b82f6" }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] to-transparent" />
          
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="outline" size="icon" onClick={onEdit} className="h-8 w-8 rounded-full bg-white/80 backdrop-blur border-transparent shadow-sm hover:bg-white">
              <Edit3 className="h-4 w-4 text-[var(--color-text-secondary)]" />
            </Button>
            <Button variant="outline" size="icon" onClick={onDelete} className="h-8 w-8 rounded-full bg-white/80 backdrop-blur border-transparent shadow-sm hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto -mt-10 relative z-10 space-y-8">
          {/* Header */}
          <div>
            <div 
              className="inline-flex items-center justify-center rounded-lg h-12 w-12 shadow-sm mb-4 border-2 border-white ring-1 ring-[rgba(0,0,0,0.05)]"
              style={{ backgroundColor: eventData.color || "#3b82f6" }}
            >
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {eventData.title}
              </SheetTitle>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium text-sm">
                <Clock className="h-4 w-4" />
                {eventData.allDay ? (
                  <span>All day</span>
                ) : (
                  <span>
                    {format(new Date(eventData.start), "MMM d, h:mm a")} 
                    {eventData.end && ` - ${format(new Date(eventData.end), "h:mm a")}`}
                  </span>
                )}
              </div>
            </SheetHeader>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {eventData.user && (
              <div className="rounded-xl bg-white p-3 border border-[rgba(0,0,0,0.05)] shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> Assignee
                </div>
                <p className="text-sm font-medium">{eventData.user.name}</p>
              </div>
            )}
            
            {eventData.influencer && (
              <div className="rounded-xl bg-white p-3 border border-[rgba(0,0,0,0.05)] shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> Influencer
                </div>
                <div className="flex items-center gap-2">
                  {eventData.influencer.profileImage && (
                    <img src={eventData.influencer.profileImage} alt="" className="w-5 h-5 rounded-full" />
                  )}
                  <p className="text-sm font-medium truncate">@{eventData.influencer.instagramHandle || eventData.influencer.influencerName}</p>
                </div>
              </div>
            )}
            
            {eventData.client && (
              <div className="rounded-xl bg-white p-3 border border-[rgba(0,0,0,0.05)] shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Client
                </div>
                <p className="text-sm font-medium truncate">{eventData.client.companyName}</p>
              </div>
            )}

            {eventData.campaign && (
              <div className="rounded-xl bg-white p-3 border border-[rgba(0,0,0,0.05)] shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Campaign
                </div>
                <p className="text-sm font-medium truncate">{eventData.campaign.name}</p>
              </div>
            )}
            
            {eventData.status && (
              <div className="rounded-xl bg-white p-3 border border-[rgba(0,0,0,0.05)] shadow-sm col-span-2 sm:col-span-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> Status
                </div>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                  {eventData.status}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white p-3 border border-[rgba(0,0,0,0.05)] shadow-sm col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Description
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                {eventData.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Activity/Timeline Tabs (Mocked visual structure) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-600)]" /> 
              Activity Timeline
            </h3>
            
            <div className="space-y-4 pl-2">
              <div className="relative pl-6 border-l-2 border-[rgba(0,0,0,0.05)]">
                <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                </div>
                <p className="text-sm font-medium">Event created</p>
                <p className="text-xs text-[var(--color-text-muted)]">by {eventData.user?.name || "System"} • {format(new Date(), "MMM d, h:mm a")}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            <Button variant="outline" className="w-full bg-white">
              <Paperclip className="mr-2 h-4 w-4" />
              Attachments
            </Button>
            <Button variant="outline" className="w-full bg-white">
              <MessageSquare className="mr-2 h-4 w-4" />
              Comments (0)
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
