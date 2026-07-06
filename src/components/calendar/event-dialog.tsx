"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEventAction, updateEventAction } from "@/actions/calendar";
import { toast } from "sonner";
import { format } from "date-fns";
import { Sparkles, MapPin, Users, Type, AlignLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

export function EventDialog({
  isOpen,
  setIsOpen,
  eventData,
  onSaveSuccess,
  isEdit = false,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  eventData?: any;
  onSaveSuccess: () => void;
  isEdit?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: eventData?.title || "",
    description: eventData?.description || "",
    type: eventData?.type || "MEETING",
    start: eventData?.start || new Date(),
    end: eventData?.end || new Date(new Date().getTime() + 60 * 60 * 1000),
    allDay: eventData?.allDay || false,
    color: eventData?.color || "#3b82f6",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (isEdit && eventData?.id) {
        await updateEventAction(eventData.id, formData);
        toast.success("Event updated successfully");
      } else {
        await createEventAction(formData);
        toast.success("Event scheduled successfully");
      }
      onSaveSuccess();
      setIsOpen(false);
    } catch (e) {
      toast.error("Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-[rgba(0,0,0,0.08)] shadow-2xl">
        <div className="h-2 w-full" style={{ backgroundColor: formData.color }} />
        
        <div className="px-6 pt-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {isEdit ? "Edit Event" : "Schedule New Event"}
            </DialogTitle>
            <DialogDescription className="text-[var(--color-text-secondary)]">
              Fill out the details below to add a new event to the calendar.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8">
          {/* AI Suggestions (Premium Touch) */}
          {!isEdit && (
            <div className="flex items-start gap-3 rounded-xl bg-purple-50/80 p-4 border border-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-purple-900">AI Scheduling Assistant</h4>
                <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                  Based on your team's availability, we recommend <strong>2:00 PM - 3:00 PM</strong> tomorrow. Your workload is lightest then.
                </p>
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs bg-white text-purple-700 border-purple-200 hover:bg-purple-50">
                  Apply Suggestion
                </Button>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2 border-b pb-2">
              <Type className="h-4 w-4" /> Basic Details
            </h3>
            <div className="grid gap-3">
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Event Title (e.g., Weekly Sync, Campaign Kickoff)"
                className="text-lg font-medium h-12 bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.06)]"
              />
              <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.06)] h-10">
                  <SelectValue placeholder="Select event category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEETING">Team Meeting</SelectItem>
                  <SelectItem value="TASK">General Task</SelectItem>
                  <SelectItem value="CAMPAIGN">Campaign Event</SelectItem>
                  <SelectItem value="CONTENT_POST">Content Publishing</SelectItem>
                  <SelectItem value="DEADLINE">Hard Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2 border-b pb-2">
              <Clock className="h-4 w-4" /> Time & Duration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-[var(--color-text-secondary)]">Start Time</Label>
                <Input
                  type="datetime-local"
                  value={format(new Date(formData.start), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => handleChange("start", new Date(e.target.value))}
                  className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.06)]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[var(--color-text-secondary)]">End Time</Label>
                <Input
                  type="datetime-local"
                  value={format(new Date(formData.end), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => handleChange("end", new Date(e.target.value))}
                  className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.06)]"
                />
              </div>
            </div>
          </div>

          {/* Color & Description */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2 border-b pb-2">
              <AlignLeft className="h-4 w-4" /> Additional Info
            </h3>
            
            <div className="space-y-3">
              <Label className="text-xs text-[var(--color-text-secondary)]">Event Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleChange("color", c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all ring-offset-2 flex items-center justify-center",
                      formData.color === c.value ? "ring-2 ring-[var(--color-text-primary)] scale-110" : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs text-[var(--color-text-secondary)]">Description & Notes</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Add meeting agenda, campaign notes, or location details..."
                className="min-h-[100px] bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.06)] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-[rgba(0,0,0,0.02)] flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="hover:bg-[rgba(0,0,0,0.05)]">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !formData.title}
            className="shadow-md shadow-[var(--color-brand-500)]/20"
          >
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Schedule Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
