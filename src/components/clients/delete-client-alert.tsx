"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteClientAction } from "@/actions/clients";

interface DeleteClientAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any; // Client to delete
  redirectOnSuccess?: boolean; // Whether to redirect to /clients after delete
}

export function DeleteClientAlert({ open, onOpenChange, client, redirectOnSuccess = false }: DeleteClientAlertProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  if (!client) return null;

  const onDelete = async () => {
    setIsPending(true);
    try {
      await deleteClientAction(client.id);
      toast.success("Client deleted successfully");
      onOpenChange(false);
      
      if (redirectOnSuccess) {
        router.push("/clients");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete client");
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
            <DialogTitle className="text-[var(--color-text-primary)]">Delete Client</DialogTitle>
          </div>
          <DialogDescription className="text-[var(--color-text-muted)]">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {client.companyName}
            </span>
            ? This action cannot be undone and will permanently remove this client, their notes, and activity history.
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
