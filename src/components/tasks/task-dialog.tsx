"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, X, FileText, Activity, LayoutDashboard, Target, Briefcase, Hash, Users, Clock, Paperclip, Bell, RefreshCw, Flag, CheckCircle2, User, Calendar, MessageSquare, AlertCircle, Sparkles, Building2, Eye, MoreHorizontal, Pencil, Trash, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import { taskSchema, TaskInput } from "@/lib/validations/task";
import { createTaskAction, updateTaskAction, getTaskByIdAction } from "@/actions/tasks";
import { FileList } from "@/components/files/file-list";
import { TaskActivityTimeline } from "@/components/tasks/task-activity-timeline";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import { TaskAIPanel } from "./task-ai-panel";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  users?: any[];
  campaigns?: any[];
  projects?: any[];
  defaultStatus?: string;
}

const getPriorityColor = (p: string) => {
  switch (p) {
    case "URGENT": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    case "HIGH": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "MEDIUM": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "LOW": return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    default: return "";
  }
};

const getStatusColor = (s: string) => {
  switch (s) {
    case "DONE": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "REVIEW": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "IN_PROGRESS": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "TODO": return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    default: return "";
  }
};

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

  const est = form.watch("estimatedHours") || 0;
  const act = form.watch("actualHours") || 0;
  const progressPercent = est > 0 ? Math.min((act / est) * 100, 100) : 0;
  const isOverTime = est > 0 && act > est;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`transition-all duration-300 ${isAIOpen ? "sm:max-w-[1500px]" : "sm:max-w-[1300px]"} bg-[#FDFDFD] border-[rgba(0,0,0,0.08)] shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] h-[90vh] rounded-[24px]`}>
        
        {/* PREMIUM HEADER */}
        <DialogHeader className="px-8 py-5 border-b border-[rgba(0,0,0,0.06)] bg-white shrink-0 flex flex-row items-start justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              {isEditMode && (
                <span className="text-[var(--color-text-muted)] font-mono text-xs bg-[rgba(0,0,0,0.04)] px-2 py-1 rounded-md font-medium tracking-wide">
                  TSK-{activeTask.id.substring(0,4).toUpperCase()}
                </span>
              )}
              {activeTask?.campaign?.name && (
                <span className="text-[var(--color-text-muted)] text-xs font-medium">
                  Campaign • {activeTask.campaign.name}
                </span>
              )}
              <Badge variant="outline" className={`${getStatusColor(form.watch("status"))} uppercase text-[10px] tracking-wider px-2 py-0.5 border-transparent`}>
                {form.watch("status") === "DONE" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                {form.watch("status").replace("_", " ")}
              </Badge>
              <Badge variant="outline" className={`${getPriorityColor(form.watch("priority"))} uppercase text-[10px] tracking-wider px-2 py-0.5 border-transparent`}>
                <Flag className="w-3 h-3 mr-1" />
                {form.watch("priority")}
              </Badge>
            </div>
            
            <DialogTitle className="text-2xl font-bold text-[var(--color-text-primary)] leading-tight">
              {isEditMode ? form.watch("title") || "Untitled Task" : "Create New Task"}
            </DialogTitle>

            {isEditMode && (
              <div className="flex items-center gap-4 mt-2 text-xs font-medium text-[var(--color-text-muted)]">
                {lastSaved ? (
                  <span className="flex items-center text-emerald-500"><Check className="w-3.5 h-3.5 mr-1" /> Auto Saved</span>
                ) : isSaving ? (
                  <span className="flex items-center text-[var(--color-brand-500)]"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</span>
                ) : form.formState.isDirty ? (
                  <span className="flex items-center text-amber-500"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Unsaved changes</span>
                ) : (
                  <span>All changes saved</span>
                )}
                {activeTask?.updatedAt && (
                  <span>Last updated {format(new Date(activeTask.updatedAt), 'MMM d, h:mm a')}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isAIOpen && (
              <Button 
                type="button" 
                onClick={() => setIsAIOpen(true)} 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white border-0 shadow-md transition-all gap-2 px-4 h-9 rounded-full mr-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">AI Assistant</span>
              </Button>
            )}
            {isEditMode && (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[rgba(0,0,0,0.08)] bg-white text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.03)] shadow-sm h-9 w-9">
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-[rgba(0,0,0,0.08)] shadow-xl p-1">
                  <DropdownMenuItem className="rounded-lg text-sm cursor-pointer hover:bg-[rgba(0,0,0,0.04)]">
                    <Copy className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" /> Duplicate Task
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg text-sm cursor-pointer hover:bg-[rgba(0,0,0,0.04)]">
                    <Share2 className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" /> Share Link
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg text-sm cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700">
                    <Trash className="w-4 h-4 mr-2" /> Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DialogClose className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 w-9 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)]">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
        </DialogHeader>

        {/* CONTENT LAYOUT */}
        <div className="flex flex-1 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col min-w-0">
              
              <ScrollArea className="flex-1 h-full px-8 py-8 bg-[rgba(0,0,0,0.01)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1300px] mx-auto">
                  
                  {/* LEFT COLUMN (70%) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* General Information Card */}
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
                                Task Title
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter a descriptive title..." {...field} className="h-12 text-lg font-medium bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)] rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[var(--color-brand-500)]" />
                                Description
                              </FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Add comprehensive details, markdown supported..." 
                                  {...field} 
                                  className="min-h-[250px] resize-y text-base leading-relaxed bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)] rounded-xl p-4" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {isEditMode && (
                      <>
                        <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-500)]" />
                            Checklist
                          </h3>
                          <TaskChecklist taskId={activeTask.id} initialChecklist={activeTask.checklist} />
                        </div>

                        <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-[var(--color-brand-500)]" />
                            Attachments
                          </h3>
                          <FileList entityId={activeTask.id} entityType="TASK" title="" />
                        </div>

                        <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[var(--color-brand-500)]" />
                            Activity & Comments
                          </h3>
                          <TaskActivityTimeline 
                            taskId={activeTask.id} 
                            activities={activeTask.activities || []} 
                            comments={activeTask.comments || []} 
                            currentUser={{ id: "system", role: "ADMIN" }} // Simplified for dialog
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* RIGHT SIDEBAR (30%) */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm overflow-hidden divide-y divide-[rgba(0,0,0,0.04)] sticky top-0">
                      
                      {/* Status & Priority */}
                      <div className="p-6 bg-[rgba(0,0,0,0.01)] space-y-5">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-white border-[rgba(0,0,0,0.08)] rounded-xl font-medium shadow-sm">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="TODO" className="font-medium">To Do</SelectItem>
                                  <SelectItem value="IN_PROGRESS" className="font-medium text-blue-600">In Progress</SelectItem>
                                  <SelectItem value="REVIEW" className="font-medium text-amber-600">Review</SelectItem>
                                  <SelectItem value="DONE" className="font-medium text-emerald-600">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Priority</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-white border-[rgba(0,0,0,0.08)] rounded-xl font-medium shadow-sm">
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="LOW" className="font-medium text-gray-500">Low</SelectItem>
                                  <SelectItem value="MEDIUM" className="font-medium text-blue-500">Medium</SelectItem>
                                  <SelectItem value="HIGH" className="font-medium text-amber-500">High</SelectItem>
                                  <SelectItem value="URGENT" className="font-medium text-rose-500">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* People */}
                      <div className="p-6 space-y-5">
                        <FormField
                          control={form.control}
                          name="assigneeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Assignee</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-white border-[rgba(0,0,0,0.08)] rounded-xl shadow-sm">
                                    <SelectValue placeholder="Unassigned" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="unassigned" onClick={() => field.onChange("")} className="py-2 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>
                                      <span className="font-medium text-gray-500">Unassigned</span>
                                    </div>
                                  </SelectItem>
                                  {users.map(u => (
                                    <SelectItem key={u.id} value={u.id} className="py-2 cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                                          {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover"/> : <span className="text-[10px] font-bold text-indigo-500">{u.name?.charAt(0) || "U"}</span>}
                                        </div>
                                        <div className="flex flex-col text-left">
                                          <span className="font-medium leading-none">{u.name || u.email}</span>
                                          {u.jobTitle && <span className="text-[10px] text-gray-500 mt-1">{u.jobTitle}</span>}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="reporterId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider">Reporter</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-white border-[rgba(0,0,0,0.08)] rounded-xl shadow-sm">
                                    <SelectValue placeholder="Select Reporter" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {users.map(u => (
                                    <SelectItem key={u.id} value={u.id} className="py-2 cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                                          {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover"/> : <span className="text-[10px] font-bold text-indigo-500">{u.name?.charAt(0) || "U"}</span>}
                                        </div>
                                        <div className="flex flex-col text-left">
                                          <span className="font-medium leading-none">{u.name || u.email}</span>
                                          {u.jobTitle && <span className="text-[10px] text-gray-500 mt-1">{u.jobTitle}</span>}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Campaign & Project */}
                      <div className="p-6 space-y-5">
                        <FormField
                          control={form.control}
                          name="campaignId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5"/> Campaign</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-white border-[rgba(0,0,0,0.08)] rounded-xl font-medium shadow-sm">
                                    <SelectValue placeholder="No Campaign" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="none" onClick={() => field.onChange("")} className="font-medium text-gray-500 cursor-pointer">No Campaign</SelectItem>
                                  {campaigns.map(c => (
                                    <SelectItem key={c.id} value={c.id} className="font-medium cursor-pointer py-2">
                                      <div className="flex flex-col text-left">
                                        <span>{c.name}</span>
                                        {c.client && <span className="text-[10px] text-gray-500">{c.client.companyName}</span>}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Project</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-white border-[rgba(0,0,0,0.08)] rounded-xl font-medium shadow-sm">
                                    <SelectValue placeholder="No Project" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="none" onClick={() => field.onChange("")} className="font-medium text-gray-500 cursor-pointer">No Project</SelectItem>
                                  {projects?.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="font-medium cursor-pointer">
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Dates */}
                      <div className="p-6">
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} value={field.value || ""} className="h-10 bg-white border-[rgba(0,0,0,0.08)] rounded-xl shadow-sm text-sm font-medium" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Time Tracking Widget */}
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm p-6 relative overflow-hidden">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--color-brand-500)]" />
                        Time Tracking
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name="estimatedHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)]">Estimated (h)</FormLabel>
                              <FormControl><Input type="number" step="0.5" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} className="h-9 rounded-lg" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="actualHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-[var(--color-text-muted)]">Logged (h)</FormLabel>
                              <FormControl><Input type="number" step="0.5" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} className="h-9 rounded-lg" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {est > 0 && (
                        <>
                          <div className="h-2 w-full bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isOverTime ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          {isOverTime && (
                            <div className="mt-3 text-xs text-red-500 font-medium flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Over estimate by {Math.abs(est - act)}h
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </ScrollArea>

              {/* FOOTER */}
              <DialogFooter className="px-8 py-5 border-t border-[rgba(0,0,0,0.06)] bg-white shrink-0 flex justify-between items-center z-10 shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
                <Button type="button" variant="outline" onClick={handleDiscard} className="rounded-full px-6 h-10 border-[rgba(0,0,0,0.08)] text-[var(--color-text-secondary)] hover:bg-[rgba(0,0,0,0.02)] shadow-sm">
                  {isEditMode ? "Discard Changes" : "Cancel"}
                </Button>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="secondary" onClick={() => onSubmit(form.getValues())} className="rounded-full px-6 h-10 bg-[rgba(0,0,0,0.04)] text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.08)]">
                    Save Draft
                  </Button>
                  <Button type="submit" disabled={isSaving} className="rounded-full px-8 h-10 bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] shadow-md font-medium">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? "Save Changes" : "Create Task"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>

          {isAIOpen && (
            <div className="w-[400px] shrink-0 border-l border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300 relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.03)]">
              <TaskAIPanel form={form} users={users} onClose={() => setIsAIOpen(false)} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
