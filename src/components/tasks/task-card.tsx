import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  MoreHorizontal, 
  Flag, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  Pencil, 
  Trash,
  Copy,
  UserPlus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ListTodo
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import type { TaskWithDetails } from "./task-kanban";
import { TaskStatus } from "@prisma/client";

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string; iconColor: string }> = {
  URGENT: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", iconColor: "text-rose-500" },
  HIGH: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", iconColor: "text-amber-500" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", iconColor: "text-blue-500" },
  LOW: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", iconColor: "text-gray-400" },
};

function isOverdue(task: TaskWithDetails): boolean {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

function getTimeRemaining(task: TaskWithDetails): string | null {
  if (!task.dueDate || task.status === "DONE") return null;
  const due = new Date(task.dueDate).getTime();
  const now = new Date().setHours(0,0,0,0);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `${diffDays}d left`;
}

interface TaskCardProps {
  task: TaskWithDetails;
  onEdit: (task: TaskWithDetails) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  users?: any[];
  onAssign?: (taskId: string, assigneeId: string) => void;
}

export function SortableTaskCard(props: TaskCardProps) {
  const { task } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "Task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard {...props} isDragging={isDragging} />
    </div>
  );
}

export function TaskCard({ task, onEdit, onDelete, onDuplicate, onStatusChange, users = [], onAssign, isDragging }: TaskCardProps & { isDragging?: boolean }) {
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
  const overdue = isOverdue(task);
  const timeRemaining = getTimeRemaining(task);

  // Calculate Progress % and Checklist Progress
  let checklistTotal = 0;
  let checklistCompleted = 0;
  if (Array.isArray(task.checklist)) {
    checklistTotal = task.checklist.length;
    checklistCompleted = task.checklist.filter((item: any) => item.completed).length;
  }
  const progressPercent = checklistTotal > 0 
    ? Math.round((checklistCompleted / checklistTotal) * 100)
    : task.status === "DONE" ? 100 : task.status === "IN_PROGRESS" ? 50 : 0;

  // AI Risk Indicator Mock (Overdue + High/Urgent priority)
  const isHighRisk = overdue && (task.priority === "HIGH" || task.priority === "URGENT");

  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.01 }}
      className={`relative bg-white dark:bg-[var(--color-surface-800)] border ${isDragging ? 'border-[var(--color-brand-500)] shadow-xl' : 'border-[rgba(0,0,0,0.08)] shadow-sm hover:shadow-md'} rounded-xl p-4 mb-3 cursor-grab active:cursor-grabbing transition-all duration-200 group overflow-hidden`}
    >
      {/* Top Border Accent for Priority */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${priority.bg} opacity-50`} style={{ backgroundColor: priority.iconColor.replace('text-', '') /* fallback visualization */ }} />
      <span className="absolute left-0 top-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: priority.iconColor.replace('text-', '') }} />

      <div className="pl-1">
        {/* Top Row: Meta & Quick Actions */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--color-text-muted)] bg-[rgba(0,0,0,0.04)] px-1.5 py-0.5 rounded">
              #{task.id.slice(-5).toUpperCase()}
            </span>
            
            {task.campaign && (
              <Badge variant="outline" className="text-[9px] h-4 py-0 px-1.5 bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-200)] uppercase tracking-wider">
                {task.campaign.name}
              </Badge>
            )}

            {isHighRisk && (
              <Badge variant="outline" className="text-[9px] h-4 py-0 px-1.5 bg-rose-50 text-rose-600 border-rose-200 flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5" /> AI Risk
              </Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-1 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-48" onPointerDown={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="w-4 h-4 mr-2" /> Open Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(task.id)}>
                <Copy className="w-4 h-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Change Status
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map(status => (
                      <DropdownMenuItem key={status} onClick={() => onStatusChange(task.id, status as TaskStatus)}>
                        {status.replace("_", " ")}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {onAssign && users.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <UserPlus className="w-4 h-4 mr-2" /> Assign To
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => onAssign(task.id, "")}>Unassigned</DropdownMenuItem>
                      {users.map(u => (
                        <DropdownMenuItem key={u.id} onClick={() => onAssign(task.id, u.id)}>
                          {u.name || u.email}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600 focus:text-red-600">
                <Trash className="w-4 h-4 mr-2" /> Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title & Priority */}
        <div className="flex items-start gap-2 mb-2">
          <Flag className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${priority.iconColor}`} />
          <Link href={`/tasks/${task.id}`} className="block" onPointerDown={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-[13px] text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)] transition-colors leading-snug line-clamp-2">
              {task.title}
            </h4>
          </Link>
        </div>

        {/* Labels Row */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.labels.map((label, idx) => (
              <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-[rgba(0,0,0,0.05)] text-[var(--color-text-secondary)] rounded-md font-medium">
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Progress Bar (if applicable) */}
        {(checklistTotal > 0 || task.status === "IN_PROGRESS") && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--color-brand-500)] transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] font-medium shrink-0 w-8 text-right">
              {progressPercent}%
            </span>
          </div>
        )}

        {/* Bottom Metrics Row */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)] font-medium">
            
            {/* Due Date / Time Remaining */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${overdue ? 'text-rose-500' : ''}`} title={new Date(task.dueDate).toLocaleDateString()}>
                <Calendar className="w-3 h-3" />
                {timeRemaining}
              </span>
            )}
            
            {/* Checklist Count */}
            {checklistTotal > 0 && (
              <span className="flex items-center gap-1" title="Checklist items">
                <ListTodo className="w-3 h-3" />
                {checklistCompleted}/{checklistTotal}
              </span>
            )}
            
            {/* Comments & Attachments */}
            {(task.comments?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1" title="Comments">
                <MessageSquare className="w-3 h-3" />
                {task.comments?.length}
              </span>
            )}
            {task.attachments.length > 0 && (
              <span className="flex items-center gap-1" title="Attachments">
                <Paperclip className="w-3 h-3" />
                {task.attachments.length}
              </span>
            )}

            {/* Estimated Hours */}
            {task.estimatedHours && (
              <span className="flex items-center gap-1" title="Estimated Hours">
                <Clock className="w-3 h-3" />
                {task.estimatedHours}h
              </span>
            )}
          </div>

          {/* Assignee Avatar */}
          {task.assignee ? (
            <div
              className="w-6 h-6 rounded-full bg-[var(--color-brand-500)] text-[9px] text-white flex items-center justify-center font-bold overflow-hidden ring-2 ring-white dark:ring-[var(--color-surface-800)] shrink-0 shadow-sm"
              title={task.assignee.name || undefined}
            >
              {task.assignee.image ? (
                <img
                  src={task.assignee.image}
                  alt={task.assignee.name || "User avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                task.assignee.name?.substring(0, 2).toUpperCase()
              )}
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.1)] text-[var(--color-text-disabled)] flex items-center justify-center ring-2 ring-white dark:ring-[var(--color-surface-800)] shrink-0"
              title="Unassigned"
            >
              <UserPlus className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
