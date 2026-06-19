"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { campaignSchema, CampaignInput } from "@/lib/validations/campaign";
import { createCampaignAction } from "@/actions/campaigns";
import { addInfluencerToCampaignAction } from "@/actions/influencer-campaigns";
import { getClientsAction } from "@/actions/clients";

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

interface CreateCampaignModalProps {
  influencerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignModal({ influencerId, open, onOpenChange }: CreateCampaignModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (open && clients.length === 0) {
      getClientsAction({ limit: 100 }).then(res => setClients(res.clients)).catch(console.error);
    }
  }, [open, clients.length]);

  const form = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema) as any,
    defaultValues: {
      name: "",
      clientId: "",
      budget: 0,
      deliverables: "",
      startDate: "",
      endDate: "",
      status: "PLANNING",
      notes: "",
    },
  });

  const onSubmit = async (data: CampaignInput) => {
    setIsSubmitting(true);
    try {
      // 1. Create the campaign
      const campaign = await createCampaignAction(data);
      
      // 2. Automatically assign the influencer to it
      await addInfluencerToCampaignAction({
        campaignId: campaign.id,
        influencerId: influencerId,
        status: "INVITED"
      });

      toast.success("Campaign created & influencer assigned successfully!");
      onOpenChange(false);
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)] shadow-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-b from-[rgba(0,0,0,0.02)] to-transparent">
          <DialogTitle className="text-xl font-bold text-[var(--color-text-primary)]">
            Create Campaign
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            Launch a new campaign. This creator will be automatically assigned.
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
                Create & Assign
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
