"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { taskSchema, TaskInput } from "@/lib/validations/task";
import { createTaskAction, updateTaskAction } from "@/actions/tasks";
import { FileList } from "@/components/files/file-list";

import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  users?: any[];
  campaigns?: any[];
  defaultStatus?: string;
}

export function TaskDialog({ open, onOpenChange, task, users = [], campaigns = [], defaultStatus = "TODO" }: TaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!task;

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "MEDIUM",
      status: task?.status || defaultStatus,
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      assigneeId: task?.assigneeId || "",
      campaignId: task?.campaignId || "",
      attachments: task?.attachments || [],
    },
  });

  const onSubmit = async (data: TaskInput) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateTaskAction(task.id, data);
        toast.success("Task updated successfully");
      } else {
        await createTaskAction(data);
        toast.success("Task created successfully");
      }
      onOpenChange(false);
      if (!isEditMode) form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)] shadow-2xl p-0">
        <DialogHeader className="p-6 pb-4 border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-b from-[rgba(0,0,0,0.02)] to-transparent">
          <DialogTitle className="text-xl font-bold text-[var(--color-text-primary)]">
            {isEditMode ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--color-text-primary)]">Task Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Draft brief for Summer Campaign"
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--color-text-primary)]">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add details about this task..."
                        {...field}
                        className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] min-h-[100px] resize-none focus-visible:ring-[var(--color-brand-500)]"
                      />
                    </FormControl>
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
                          <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="REVIEW">Review</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--color-text-primary)]">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--color-text-primary)]">Assignee</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                          <SelectItem value="unassigned" onClick={() => field.onChange("")}>Unassigned</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--color-text-primary)]">Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] [color-scheme:dark]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="campaignId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--color-text-primary)]">Link to Campaign (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
                        <SelectItem value="none" onClick={() => field.onChange("")}>None</SelectItem>
                        {campaigns.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {isEditMode && task?.id && (
                <div className="pt-6 mt-6 border-t border-[rgba(0,0,0,0.08)]">
                  <FileList entityType="TASK" entityId={task.id} title="Attachments" />
                </div>
              )}
            </div>

            <div className="p-6 pt-0 flex justify-end gap-3 bg-[var(--color-surface-800)] border-t border-[rgba(0,0,0,0.08)] mt-auto pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Save Changes" : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
