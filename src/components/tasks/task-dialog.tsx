"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, X, FileText, Activity, LayoutDashboard, Target, Briefcase, Hash, Users, Clock, Paperclip, Bell, RefreshCw, Flag, CheckCircle2, User, Calendar, MessageSquare, AlertCircle, Sparkles, Building2, Eye, MoreHorizontal, Pencil, Trash, Share2, Copy } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ChevronDown, Download } from "lucide-react";

import { taskSchema, TaskInput } from "@/lib/validations/task";
import { createTaskAction, updateTaskAction, getTaskByIdAction } from "@/actions/tasks";
import { FileList } from "@/components/files/file-list";
import { TaskActivityTimeline } from "@/components/tasks/task-activity-timeline";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import { TaskAIPanel } from "./task-ai-panel";
import { StatusSelect, PrioritySelect, UserSelect, EntitySelect, DatePickerPopover } from "./task-properties";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  users?: any[];
  campaigns?: any[];
  projects?: any[];
  defaultStatus?: string;
  fixedProjectId?: string;
  fixedClientId?: string;
  fixedCampaignId?: string;
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

function SearchableSelect({ value, onSelect, placeholder, items, renderItem, getDisplayValue }: any) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between bg-white border border-[rgba(0,0,0,0.08)] rounded-xl px-3 py-2 cursor-pointer shadow-sm min-h-[48px] hover:border-[rgba(0,0,0,0.2)] transition-colors",
          open && "ring-1 ring-[var(--color-brand-500)] border-[var(--color-brand-500)]"
        )}
      >
        <div className="flex-1 overflow-hidden truncate">
          {value ? getDisplayValue(value) : <span className="text-sm text-[var(--color-text-muted)]">{placeholder}</span>}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-[var(--color-text-muted)] shrink-0 transition-transform", open && "rotate-180")} />
      </div>
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
           <Command className="max-h-[300px]">
             <CommandInput placeholder={`Search...`} className="h-10 text-sm border-none ring-0 focus-visible:ring-0 shadow-none" />
             <CommandList>
               <CommandEmpty>No results found.</CommandEmpty>
               <CommandGroup className="p-1">
                 <CommandItem 
                    value="unassigned" 
                    onSelect={() => { onSelect(""); setOpen(false); }}
                    className="cursor-pointer rounded-lg text-sm mb-1"
                 >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center"><User className="w-4 h-4 text-[var(--color-text-muted)]" /></div>
                      <span className="font-medium text-[var(--color-text-secondary)]">None / Unassigned</span>
                    </div>
                    {value === "" && <Check className="ml-auto w-4 h-4 text-[var(--color-brand-500)]" />}
                 </CommandItem>
                 
                 {items.map((item: any) => (
                   <CommandItem
                     key={item.id}
                     value={item.searchValue || item.name || item.email || ""}
                     onSelect={() => { onSelect(item.id); setOpen(false); }}
                     className="cursor-pointer rounded-lg text-sm mb-1 data-[selected=true]:bg-[rgba(0,0,0,0.03)]"
                   >
                     {renderItem(item)}
                     {value === item.id && <Check className="ml-auto w-4 h-4 text-[var(--color-brand-500)]" />}
                   </CommandItem>
                 ))}
               </CommandGroup>
             </CommandList>
           </Command>
        </div>
      )}
    </div>
  );
}

const renderUser = (u: any) => (
  <div className="flex items-center gap-2 w-full">
    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
      {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover"/> : <span className="text-xs font-bold text-indigo-500">{u.name?.charAt(0) || "U"}</span>}
    </div>
    <div className="flex flex-col text-left flex-1 min-w-0">
      <span className="font-medium leading-none truncate text-[var(--color-text-primary)]">{u.name || u.email}</span>
      {(u.jobTitle || u.role) && <span className="text-[10px] text-[var(--color-text-muted)] mt-1.5 truncate leading-none">{u.jobTitle || u.role}</span>}
    </div>
    {u.status && (
      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 uppercase tracking-wider font-semibold", 
        u.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"
      )}>
        {u.status}
      </span>
    )}
  </div>
);

const renderCampaign = (c: any) => (
  <div className="flex flex-col text-left w-full py-0.5 gap-1">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
        <LayoutDashboard className="w-3 h-3 text-purple-500" />
      </div>
      <span className="font-medium truncate text-[var(--color-text-primary)] leading-none">{c.name}</span>
      {c.status && (
        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ml-auto uppercase font-semibold", 
          c.status === 'ACTIVE' ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-gray-50 text-gray-500 border-gray-200"
        )}>
          {c.status}
        </span>
      )}
    </div>
    {c.client && (
      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5 ml-8 mt-0.5">
        <Building2 className="w-3 h-3"/> {c.client.companyName}
      </span>
    )}
    {c.teamMembers?.length > 0 && (
      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5 ml-8">
        <Users className="w-3 h-3"/> {c.teamMembers.length} Team Members
      </span>
    )}
  </div>
);

const renderProject = (p: any) => (
  <div className="flex flex-col text-left w-full py-0.5 gap-1">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
        <Briefcase className="w-3 h-3 text-blue-500" />
      </div>
      <span className="font-medium truncate text-[var(--color-text-primary)] leading-none">{p.name}</span>
      {p.status && (
        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ml-auto uppercase font-semibold", 
          p.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"
        )}>
          {p.status}
        </span>
      )}
    </div>
    {p.client && (
      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5 ml-8 mt-0.5">
        <Building2 className="w-3 h-3"/> {p.client.companyName}
      </span>
    )}
  </div>
);

export function TaskDialog({ 
  open, onOpenChange, task: initialTask, users = [], campaigns = [], projects = [], 
  defaultStatus = "TODO", fixedProjectId, fixedClientId, fixedCampaignId 
}: TaskDialogProps) {
  const isEditMode = !!initialTask;
  const [task, setTask] = useState<any>(initialTask);
  const activeTask = task || initialTask;
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(isEditMode);
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const handleExport = async (format: 'pdf' | 'docx' | 'md' | 'json') => {
    if (!activeTask) return;
    
    const promise = (async () => {
      const { exportTaskAsPDF, exportTaskAsDOCX, exportTaskAsMarkdown, exportTaskAsJSON } = await import('@/lib/export-task');
      
      switch (format) {
        case 'pdf': await exportTaskAsPDF(activeTask); break;
        case 'docx': await exportTaskAsDOCX(activeTask); break;
        case 'md': exportTaskAsMarkdown(activeTask); break;
        case 'json': exportTaskAsJSON(activeTask); break;
      }
    })();

    toast.promise(promise, {
      loading: 'Generating export...',
      success: `Task exported as ${format.toUpperCase()}`,
      error: 'Failed to export task'
    });
  };

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema) as unknown as Resolver<TaskInput>,
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: defaultStatus as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE",
      dueDate: "",
      assigneeId: "",
      campaignId: fixedCampaignId || "",
      attachments: [],
      projectId: fixedProjectId || "",
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
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-[rgba(0,0,0,0.08)] shadow-xl p-1">
                  <DropdownMenuItem className="rounded-lg text-sm cursor-pointer hover:bg-[rgba(0,0,0,0.04)]">
                    <Copy className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" /> Duplicate Task
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg text-sm cursor-pointer hover:bg-[rgba(0,0,0,0.04)]">
                    <Share2 className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" /> Share Link
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.08)] -mx-1 my-1" />
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Export As</div>
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="rounded-lg text-sm cursor-pointer hover:bg-[rgba(0,0,0,0.04)]">
                    <Download className="w-4 h-4 mr-2 text-red-500" /> PDF Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('docx')} className="rounded-lg text-sm cursor-pointer hover:bg-[rgba(0,0,0,0.04)]">
                    <Download className="w-4 h-4 mr-2 text-blue-500" /> Word Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('md')} className="rounded-lg text-sm cursor-pointer hover:bg-[rgba(0,0,0,0.04)]">
                    <Download className="w-4 h-4 mr-2 text-gray-700" /> Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')} className="rounded-lg text-sm cursor-pointer hover:bg-[rgba(0,0,0,0.04)]">
                    <Download className="w-4 h-4 mr-2 text-yellow-600" /> JSON Data
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.08)] -mx-1 my-1" />
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
                            currentUser={session?.user || { id: "system", role: "ADMIN" }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* RIGHT SIDEBAR (30%) */}
                  <div className="lg:col-span-4 relative">
                    <div className="space-y-6 lg:sticky lg:top-0 z-10">
                      <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(250,250,250,0.5)] shadow-sm p-4 space-y-3">
                        <FormField control={form.control} name="status" render={({ field }) => (
                          <FormItem><StatusSelect value={field.value} onChange={field.onChange} /></FormItem>
                        )} />
                        
                        <FormField control={form.control} name="priority" render={({ field }) => (
                          <FormItem><PrioritySelect value={field.value} onChange={field.onChange} /></FormItem>
                        )} />
                        
                        <FormField control={form.control} name="assigneeId" render={({ field }) => (
                          <FormItem><UserSelect value={field.value || ""} onChange={field.onChange} users={users} label="Assignee" /></FormItem>
                        )} />

                        <FormField control={form.control} name="reporterId" render={({ field }) => (
                          <FormItem><UserSelect value={field.value || ""} onChange={field.onChange} users={users} label="Reporter" /></FormItem>
                        )} />

                        {!fixedCampaignId && (
                          <FormField control={form.control} name="campaignId" render={({ field }) => (
                            <FormItem>
                              <EntitySelect 
                                value={field.value || ""} 
                                onChange={field.onChange} 
                                items={fixedProjectId ? campaigns.filter(c => c.projectId === fixedProjectId) : campaigns} 
                                label="Campaign" 
                                icon={LayoutDashboard} 
                              />
                            </FormItem>
                          )} />
                        )}

                        {!fixedProjectId && (
                          <FormField control={form.control} name="projectId" render={({ field }) => (
                            <FormItem><EntitySelect value={field.value || ""} onChange={field.onChange} items={projects || []} label="Project" icon={Briefcase} /></FormItem>
                          )} />
                        )}

                        <FormField control={form.control} name="dueDate" render={({ field }) => (
                          <FormItem><DatePickerPopover value={field.value || ""} onChange={field.onChange} /></FormItem>
                        )} />
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
