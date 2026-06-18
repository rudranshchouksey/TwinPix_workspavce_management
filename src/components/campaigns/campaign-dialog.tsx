"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { campaignSchema, CampaignInput } from "@/lib/validations/campaign";
import { createCampaignAction, updateCampaignAction } from "@/actions/campaigns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: any; // If provided, edit mode
  clients: any[]; // For the client dropdown
}

export function CampaignDialog({ open, onOpenChange, campaign, clients }: CampaignDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!campaign;

  const form = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema) as any,
    defaultValues: {
      name: campaign?.name || "",
      clientId: campaign?.clientId || "",
      budget: campaign?.budget || 0,
      deliverables: campaign?.deliverables || "",
      startDate: campaign?.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : "",
      endDate: campaign?.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : "",
      status: campaign?.status || "PLANNING",
      notes: campaign?.notes || "",
    },
  });

  const onSubmit = async (data: CampaignInput) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateCampaignAction(campaign.id, data);
        toast.success("Campaign updated successfully");
      } else {
        await createCampaignAction(data);
        toast.success("Campaign created successfully");
      }
      onOpenChange(false);
      if (!isEditMode) form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to save campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)] shadow-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-b from-[rgba(0,0,0,0.02)] to-transparent">
          <DialogTitle className="text-xl font-bold text-[var(--color-text-primary)]">
            {isEditMode ? "Edit Campaign" : "Create New Campaign"}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            {isEditMode
              ? "Update the details for this influencer campaign."
              : "Launch a new campaign and assign it to a client."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--color-text-primary)]">Campaign Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Summer Launch 2026"
                        {...field}
                        className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-[var(--color-brand-500)]"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--color-text-primary)]">Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus:ring-[var(--color-brand-500)]">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id} className="hover:bg-[rgba(0,0,0,0.05)] focus:bg-[rgba(0,0,0,0.05)] cursor-pointer">
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--color-text-primary)]">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus:ring-[var(--color-brand-500)]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                          <SelectItem value="PLANNING">Planning</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="REVIEW">Review</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--color-text-primary)]">Budget ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 50000"
                          {...field}
                          className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-[var(--color-brand-500)]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--color-text-primary)]">Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-[var(--color-brand-500)] text-[var(--color-text-primary)] [color-scheme:dark]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--color-text-primary)]">End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-[var(--color-brand-500)] text-[var(--color-text-primary)] [color-scheme:dark]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deliverables"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--color-text-primary)]">Global Deliverables</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. 3 Instagram Reels, 1 TikTok per influencer..."
                        {...field}
                        className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] min-h-[80px] resize-none focus-visible:ring-[var(--color-brand-500)]"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-6 pt-0 flex justify-end gap-3 bg-[var(--color-surface-800)] border-t border-[rgba(0,0,0,0.08)] mt-auto pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] shadow-lg shadow-[var(--color-brand-500)]/20"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Save Changes" : "Create Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
