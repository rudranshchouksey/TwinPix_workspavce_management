"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEventAction, updateEventAction, deleteEventAction } from "@/actions/calendar";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

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
        toast.success("Event updated");
      } else {
        await createEventAction(formData);
        toast.success("Event created");
      }
      onSaveSuccess();
      setIsOpen(false);
    } catch (e) {
      toast.error("Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventData?.id) return;
    try {
      setLoading(true);
      await deleteEventAction(eventData.id);
      toast.success("Event deleted");
      onSaveSuccess();
      setIsOpen(false);
    } catch (e) {
      toast.error("Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Event title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Event Type</Label>
            <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="TASK">Task</SelectItem>
                <SelectItem value="CAMPAIGN">Campaign</SelectItem>
                <SelectItem value="CONTENT_POST">Content Post</SelectItem>
                <SelectItem value="DEADLINE">Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={format(new Date(formData.start), "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => handleChange("start", new Date(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>End</Label>
              <Input
                type="datetime-local"
                value={format(new Date(formData.end), "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => handleChange("end", new Date(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full ${formData.color === color ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange("color", color)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Event details..."
            />
          </div>
        </div>

        <div className="flex justify-between mt-4">
          {isEdit ? (
            <Button variant="destructive" size="icon" onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : <div />}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !formData.title}>
              {loading ? "Saving..." : "Save Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
