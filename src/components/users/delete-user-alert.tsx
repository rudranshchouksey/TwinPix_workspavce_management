"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "@/actions/users";

import { User } from "@prisma/client";

interface DeleteUserAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null; // User to delete
}

export function DeleteUserAlert({ open, onOpenChange, user }: DeleteUserAlertProps) {
  const [isPending, setIsPending] = useState(false);

  if (!user) return null;

  const onDelete = async () => {
    setIsPending(true);
    try {
      await deleteUserAction(user.id);
      toast.success("User deleted successfully");
      onOpenChange(false);
    } catch (error: Error | any) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <DialogTitle className="text-[var(--color-text-primary)]">Delete User</DialogTitle>
          </div>
          <DialogDescription className="text-[var(--color-text-muted)]">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {user.name || user.email}
            </span>
            ? This action cannot be undone and will remove all their access to the platform.
          </DialogDescription>
        </DialogHeader>
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
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
