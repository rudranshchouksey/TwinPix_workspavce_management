"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, X, FileText, Activity, LayoutDashboard, Target, Briefcase, Hash, Users, Clock, Paperclip, Bell, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { taskSchema, TaskInput } from "@/lib/validations/task";
import { createTaskAction, updateTaskAction, getTaskByIdAction } from "@/actions/tasks";
import { FileList } from "@/components/files/file-list";
import { TaskActivityTimeline } from "@/components/tasks/task-activity-timeline";
import { TaskTimeTracking } from "@/components/time-tracking/task-time-tracking";
import { TaskAIPanel } from "./task-ai-panel";
import { Sparkles } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Optional: you can use a custom MultiSelect component here. We'll use a simplified implementation for followers/watchers.
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  users?: any[];
  campaigns?: any[];
  projects?: any[];
  defaultStatus?: string;
}

export function TaskDialog({ open, onOpenChange, task: initialTask, users = [], campaigns = [], projects = [], defaultStatus = "TODO" }: TaskDialogProps) {
  const isEditMode = !!initialTask;
  const [task, setTask] = useState<any>(initialTask);
  const activeTask = task || initialTask;
  const [isLoading, setIsLoading] = useState(isEditMode);
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema) as unknown as Resolver<TaskInput>,
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: defaultStatus as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE",
      dueDate: "",
      assigneeId: "",
      campaignId: "",
      attachments: [],
      projectId: "",
      reporterId: "",
      estimatedHours: null,
      actualHours: null,
      storyPoints: null,
      watcherIds: [],
      followerIds: [],
      reminder: null,
      recurringRule: null,
      checklist: [],
      labels: [],
    },
  });

  const loadTask = useCallback(async () => {
    if (!initialTask?.id) return;
    setIsLoading(true);
    try {
      const fullTask = await getTaskByIdAction(initialTask.id);
      if (fullTask) {
        setTask(fullTask);
        form.reset({
          title: fullTask.title,
          description: fullTask.description || "",
          priority: fullTask.priority,
          status: fullTask.status,
          dueDate: fullTask.dueDate ? new Date(fullTask.dueDate).toISOString().split('T')[0] : "",
          assigneeId: fullTask.assigneeId || "",
          campaignId: fullTask.campaignId || "",
          projectId: fullTask.projectId || "",
          reporterId: fullTask.reporterId || fullTask.authorId,
          estimatedHours: fullTask.estimatedHours || null,
          actualHours: fullTask.actualHours || null,
          storyPoints: fullTask.storyPoints || null,
          watcherIds: fullTask.watchers?.map((u: any) => u.id) || [],
          followerIds: fullTask.followers?.map((u: any) => u.id) || [],
          reminder: fullTask.reminder ? new Date(fullTask.reminder).toISOString().slice(0, 16) : null,
          recurringRule: fullTask.recurringRule || null,
          attachments: fullTask.attachments || [],
          checklist: (Array.isArray(fullTask.checklist) ? fullTask.checklist : []) as any,
          labels: fullTask.labels || [],
        });
      }
    } catch (e) {
      toast.error("Failed to load task details");
    } finally {
      setIsLoading(false);
    }
  }, [initialTask, form]);

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        loadTask();
      } else {
        form.reset();
        setTask(null);
      }
      setLastSaved(null);
    }
  }, [open, isEditMode, loadTask]);

  // Autosave logic
  const watchedValues = useWatch({ control: form.control });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEditMode || isLoading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save for 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      if (form.formState.isDirty && form.formState.isValid) {
        handleAutosave(form.getValues());
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [watchedValues, isEditMode, isLoading, form]);

  const handleAutosave = async (data: TaskInput) => {
    setIsSaving(true);
    try {
      await updateTaskAction(task.id, data);
      setLastSaved(new Date());
      // Reset form's dirty state with the new values
      form.reset(data, { keepValues: true }); 
    } catch (error: any) {
      toast.error("Autosave failed: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: TaskInput) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    try {
      if (isEditMode) {
        await updateTaskAction(activeTask?.id, data);
        toast.success("Task updated successfully");
      } else {
        await createTaskAction(data);
        toast.success("Task created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (isEditMode) {
      loadTask(); // Re-fetch from DB
      toast.info("Changes discarded, reverted to last saved version.");
    } else {
      onOpenChange(false);
    }
  };

  if (isLoading && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] h-[600px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-500)]" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`transition-all duration-300 ${isAIOpen ? "sm:max-w-[1200px]" : "sm:max-w-[850px]"} bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)] shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] h-[90vh]`}>
        <DialogHeader className="px-6 py-4 border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-b from-[rgba(0,0,0,0.02)] to-transparent shrink-0 flex flex-row items-center justify-between">
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold text-[var(--color-text-primary)]">
              {isEditMode ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            {isEditMode && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {isSaving ? (
                  <span className="flex items-center text-[var(--color-brand-500)]"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Autosaving...</span>
                ) : lastSaved ? (
                  <span className="flex items-center text-emerald-500"><Check className="w-3 h-3 mr-1" /> Autosaved at {format(lastSaved, 'HH:mm')}</span>
                ) : (
                  <span>All changes are autosaved.</span>
                )}
              </p>
            )}
          </div>
          {!isAIOpen && (
            <Button 
              type="button" 
              onClick={() => setIsAIOpen(true)} 
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white border-0 shadow-md transition-all gap-2 px-4 h-9 rounded-full mr-6"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">AI Assistant</span>
            </Button>
          )}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col min-w-0">
            <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] overflow-x-auto hide-scrollbar">
                <TabsList className="h-12 bg-transparent w-full justify-start p-0">
                  <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-brand-500)] rounded-none h-12 px-4">General</TabsTrigger>
                  <TabsTrigger value="assignment" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-brand-500)] rounded-none h-12 px-4">Assignment</TabsTrigger>
                  <TabsTrigger value="schedule" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-brand-500)] rounded-none h-12 px-4">Schedule</TabsTrigger>
                  {isEditMode && <TabsTrigger value="checklist" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-brand-500)] rounded-none h-12 px-4">Checklist</TabsTrigger>}
                  {isEditMode && <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-brand-500)] rounded-none h-12 px-4">Files</TabsTrigger>}
                  {isEditMode && <TabsTrigger value="time-tracking" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-brand-500)] rounded-none h-12 px-4">Time Tracking</TabsTrigger>}
                  {isEditMode && <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-brand-500)] rounded-none h-12 px-4">History</TabsTrigger>}
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-6">
                <TabsContent value="general" className="mt-0 space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--color-text-primary)] font-semibold">Task Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a descriptive title..." {...field} className="h-10 text-base" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="TODO">To Do</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="REVIEW">Review</SelectItem>
                              <SelectItem value="DONE">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--color-text-primary)] font-semibold">Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add comprehensive details..." {...field} className="min-h-[150px] resize-y" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="campaignId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Campaign</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="No Campaign" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="none" onClick={() => field.onChange("")}>None</SelectItem>
                              {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Project</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="No Project" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="none" onClick={() => field.onChange("")}>None</SelectItem>
                              {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="assignment" className="mt-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="assigneeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Assignee</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned" onClick={() => field.onChange("")}>Unassigned</SelectItem>
                              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reporterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Reporter</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select reporter" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Minimal multi-select fallback for Watchers/Followers for now */}
                    <FormField
                      control={form.control}
                      name="watcherIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Watchers</FormLabel>
                          <div className="border border-[rgba(0,0,0,0.08)] rounded-md p-2 max-h-[150px] overflow-y-auto space-y-1">
                            {users.map(u => (
                              <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-[rgba(0,0,0,0.02)] rounded cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={field.value?.includes(u.id) || false}
                                  onChange={(e) => {
                                    const val = field.value || [];
                                    if (e.target.checked) field.onChange([...val, u.id]);
                                    else field.onChange(val.filter((id: string) => id !== u.id));
                                  }}
                                />
                                <span className="text-sm">{u.name || u.email}</span>
                              </label>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="followerIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold flex items-center gap-2"><Bell className="w-4 h-4" /> Followers</FormLabel>
                          <div className="border border-[rgba(0,0,0,0.08)] rounded-md p-2 max-h-[150px] overflow-y-auto space-y-1">
                            {users.map(u => (
                              <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-[rgba(0,0,0,0.02)] rounded cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={field.value?.includes(u.id) || false}
                                  onChange={(e) => {
                                    const val = field.value || [];
                                    if (e.target.checked) field.onChange([...val, u.id]);
                                    else field.onChange(val.filter((id: string) => id !== u.id));
                                  }}
                                />
                                <span className="text-sm">{u.name || u.email}</span>
                              </label>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="mt-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ""} className="[color-scheme:dark]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reminder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Reminder</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} value={field.value || ""} className="[color-scheme:dark]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="estimatedHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Est. Hours</FormLabel>
                          <FormControl><Input type="number" step="0.5" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="actualHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold">Actual Hours</FormLabel>
                          <FormControl><Input type="number" step="0.5" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurringRule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--color-text-primary)] font-semibold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Recurring</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Does not repeat" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="none" onClick={() => field.onChange("")}>Does not repeat</SelectItem>
                              <SelectItem value="DAILY">Daily</SelectItem>
                              <SelectItem value="WEEKLY">Weekly</SelectItem>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {isEditMode && (
                  <TabsContent value="time-tracking" className="mt-0">
                    <TaskTimeTracking 
                      taskId={activeTask?.id || ""} 
                      estimatedHours={activeTask?.estimatedHours} 
                      actualHours={activeTask?.actualHours} 
                    />
                  </TabsContent>
                )}

                {isEditMode && (
                  <>
                    <TabsContent value="checklist" className="mt-0">
                      <div className="bg-[rgba(0,0,0,0.02)] rounded-lg p-4 border border-[rgba(0,0,0,0.08)]">
                         <p className="text-sm text-[var(--color-text-muted)] italic">Checklist drag-and-drop builder will be rendered here.</p>
                         {/* We will add a dedicated ChecklistBuilder component later if requested, but for now we note it. */}
                      </div>
                    </TabsContent>

                    <TabsContent value="files" className="mt-0 space-y-4">
                      <FileList 
                        entityId={activeTask?.id || ""} 
                        entityType="TASK" 
                      />
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                      {activeTask?.activities ? (
                        <TaskActivityTimeline 
                          taskId={activeTask?.id || ""} 
                          activities={activeTask?.activities} 
                          comments={activeTask?.comments || []} 
                          currentUser={{ id: activeTask?.authorId || "system", role: "ADMIN" }} // Mock currentUser for timeline props
                        />
                      ) : (
                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" /></div>
                      )}
                    </TabsContent>
                  </>
                )}
              </ScrollArea>
            </Tabs>

            <DialogFooter className="px-6 py-4 border-t border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] shrink-0 flex justify-between sm:justify-between items-center">
              <Button type="button" variant="outline" onClick={handleDiscard}>
                {isEditMode ? "Discard Changes" : "Cancel"}
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {isAIOpen && (
          <div className="w-[380px] shrink-0 border-l border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
            <TaskAIPanel form={form} users={users} onClose={() => setIsAIOpen(false)} />
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
