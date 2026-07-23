"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "./task-dialog";
import { deleteTaskAction } from "@/actions/tasks";
import type { TaskWithDetails } from "./task-kanban";

interface TaskDetailActionsProps {
  task: TaskWithDetails;
  users: any[];
  campaigns: any[];
}

export function TaskDetailActions({ task, users, campaigns }: TaskDetailActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    setIsDeleting(true);
    try {
      await deleteTaskAction(task.id);
      toast.success("Task deleted successfully");
      router.push("/tasks");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsEditOpen(true)}
          className="text-[var(--color-text-secondary)] border-[rgba(0,0,0,0.08)] bg-white hover:bg-[rgba(0,0,0,0.02)]"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 border-[rgba(0,0,0,0.08)] bg-white hover:bg-red-50 hover:text-red-700"
        >
          <Trash className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <TaskDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        task={task}
        users={users}
        campaigns={campaigns}
      />
    </>
  );
}
