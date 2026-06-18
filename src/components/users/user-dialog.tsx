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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { createUserAction, updateUserAction } from "@/actions/users";
import { CreateUserInput, createUserSchema, UpdateUserInput, updateUserSchema } from "@/lib/validations/user";

import { User } from "@prisma/client";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User; // If provided, we're in EDIT mode
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const isEditing = !!user;
  const [isPending, setIsPending] = useState(false);

  // Use the appropriate schema depending on whether we're editing
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "TEAM_MEMBER",
      status: "ACTIVE",
      jobTitle: "",
      department: "",
    },
  });

  // Reset form when opened with new user data
  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          name: user.name || "",
          email: user.email || "",
          password: "", // Leave blank on edit unless they want to change it
          role: user.role || "TEAM_MEMBER",
          status: user.status || "ACTIVE",
          jobTitle: user.jobTitle || "",
          department: user.department || "",
        });
      } else {
        form.reset({
          name: "",
          email: "",
          password: "",
          role: "TEAM_MEMBER",
          status: "ACTIVE",
          jobTitle: "",
          department: "",
        });
      }
    }
  }, [open, user, form]);

  const onSubmit = async (data: any) => {
    setIsPending(true);
    try {
      if (isEditing) {
        // If password is blank, we don't send it to update
        const payload = { ...data };
        if (!payload.password) delete payload.password;
        await updateUserAction(user.id, payload as UpdateUserInput);
        toast.success("User updated successfully");
      } else {
        await createUserAction(data as CreateUserInput);
        toast.success("User created successfully");
      }
      onOpenChange(false);
    } catch (error: Error | any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text-primary)]">
            {isEditing ? "Edit User" : "Create User"}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-muted)]">
            {isEditing
              ? "Update the user's details and permissions."
              : "Add a new member to your workspace."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
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
                  <FormItem className="col-span-2">
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
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
                name="password"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>
                      {isEditing ? "New Password (optional)" : "Password"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={isEditing ? "Leave blank to keep current" : "••••••••"}
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                        <SelectItem value="CLIENT">Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Designer"
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
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Creative"
                        className="bg-[rgba(0,0,0,0.03)] border-[rgba(0,0,0,0.08)]"
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
                {isEditing ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
