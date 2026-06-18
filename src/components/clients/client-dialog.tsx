"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { createClientAction, updateClientAction } from "@/actions/clients";
import { ClientInput, clientSchema, UpdateClientInput, updateClientSchema } from "@/lib/validations/client";

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any; // If provided, we're in EDIT mode
}

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
  const isEditing = !!client;
  const [isPending, setIsPending] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? updateClientSchema : clientSchema),
    defaultValues: {
      companyName: "",
      brandName: "",
      contactPerson: "",
      email: "",
      phone: "",
      industry: "",
      website: "",
      address: "",
      notes: "",
      status: "LEAD",
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        form.reset({
          companyName: client.companyName || "",
          brandName: client.brandName || "",
          contactPerson: client.contactPerson || "",
          email: client.email || "",
          phone: client.phone || "",
          industry: client.industry || "",
          website: client.website || "",
          address: client.address || "",
          notes: client.notes || "",
          status: client.status || "LEAD",
        });
      } else {
        form.reset({
          companyName: "",
          brandName: "",
          contactPerson: "",
          email: "",
          phone: "",
          industry: "",
          website: "",
          address: "",
          notes: "",
          status: "LEAD",
        });
      }
    }
  }, [open, client, form]);

  const onSubmit = async (data: any) => {
    setIsPending(true);
    try {
      if (isEditing) {
        await updateClientAction(client.id, data as UpdateClientInput);
        toast.success("Client updated successfully");
      } else {
        await createClientAction(data as ClientInput);
        toast.success("Client created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text-primary)]">
            {isEditing ? "Edit Client" : "Add New Client"}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-muted)]">
            {isEditing
              ? "Update the client's details and contact information."
              : "Create a new client profile to manage their campaigns."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Corp"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jane Doe"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jane@acme.com"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 000-0000"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Technology, Fashion"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://acme.com"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Company address..."
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)] min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Quick Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Initial context or internal notes..."
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)] min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
