"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { useState, useCallback } from "react";
import { ArrowUpDown, Calendar, MessageSquare, Paperclip, Flag, User, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { deleteTaskAction } from "@/actions/tasks";
import { TaskDialog } from "./task-dialog";
import { TaskEmptyState } from "./task-empty-state";
import type { TaskWithDetails } from "./task-kanban";

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-rose-50 text-rose-600 border-rose-200",
  HIGH: "bg-amber-50 text-amber-600 border-amber-200",
  MEDIUM: "bg-blue-50 text-blue-600 border-blue-200",
  LOW: "bg-gray-50 text-gray-500 border-gray-200",
};

const STATUS_STYLES: Record<string, string> = {
  TODO: "bg-gray-50 text-gray-600 border-gray-200",
  IN_PROGRESS: "bg-blue-50 text-blue-600 border-blue-200",
  REVIEW: "bg-amber-50 text-amber-600 border-amber-200",
  DONE: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

const columnHelper = createColumnHelper<TaskWithDetails>();

export function TaskTableView({ 
  tasks,
  users = [],
  campaigns = []
}: { 
  tasks: TaskWithDetails[];
  users?: any[];
  campaigns?: any[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleEdit = useCallback((task: TaskWithDetails) => {
    router.push(`/tasks/${task.id}`);
  }, [router]);

  const handleDelete = useCallback(async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTaskAction(taskId);
      toast.success("Task deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    }
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: ({ column }) => (
          <button className="flex items-center gap-1 font-semibold" onClick={column.getToggleSortingHandler()}>
            Title <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <Link
            href={`/tasks/${info.row.original.id}`}
            className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand-600)] transition-colors line-clamp-1"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("priority", {
        header: ({ column }) => (
          <button className="flex items-center gap-1 font-semibold" onClick={column.getToggleSortingHandler()}>
            Priority <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => {
          const v = info.getValue();
          return (
            <Badge variant="outline" className={`${PRIORITY_STYLES[v]} text-[10px] py-0 px-2 rounded-full uppercase tracking-wider font-semibold`}>
              <Flag className="w-2.5 h-2.5 mr-0.5" />
              {v}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: ({ column }) => (
          <button className="flex items-center gap-1 font-semibold" onClick={column.getToggleSortingHandler()}>
            Status <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => {
          const v = info.getValue();
          return (
            <Badge variant="outline" className={`${STATUS_STYLES[v]} text-[10px] py-0 px-2 rounded-full font-semibold`}>
              {STATUS_LABELS[v] || v}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("assignee", {
        header: "Assignee",
        cell: (info) => {
          const a = info.getValue();
          if (!a) return <span className="text-xs text-[var(--color-text-disabled)] italic">Unassigned</span>;
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--color-brand-500)] text-[10px] text-white flex items-center justify-center font-semibold overflow-hidden shrink-0">
                {a.image ? (
                  <img src={a.image} alt={a.name || ""} className="w-full h-full object-cover" />
                ) : (
                  a.name?.substring(0, 2).toUpperCase() || <User className="w-3 h-3" />
                )}
              </div>
              <span className="text-sm text-[var(--color-text-secondary)] truncate">{a.name || "Unknown"}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("campaign", {
        header: "Campaign",
        cell: (info) => {
          const c = info.getValue();
          if (!c) return <span className="text-xs text-[var(--color-text-disabled)]">—</span>;
          return (
            <Link href={`/campaigns/${c.id}`} className="text-xs text-[var(--color-brand-600)] hover:underline font-medium truncate block max-w-[150px]">
              {c.name}
            </Link>
          );
        },
      }),
      columnHelper.accessor("dueDate", {
        header: ({ column }) => (
          <button className="flex items-center gap-1 font-semibold" onClick={column.getToggleSortingHandler()}>
            Due Date <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => {
          const d = info.getValue();
          if (!d) return <span className="text-xs text-[var(--color-text-disabled)]">—</span>;
          const date = new Date(d);
          const isOverdue = date < new Date(new Date().setHours(0, 0, 0, 0)) && info.row.original.status !== "DONE";
          return (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500 font-medium" : "text-[var(--color-text-muted)]"}`}>
              <Calendar className="w-3 h-3" />
              {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          );
        },
      }),
      columnHelper.accessor("comments", {
        header: "",
        cell: (info) => {
          const c = info.getValue();
          const attachments = info.row.original.attachments;
          return (
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
              {(c?.length ?? 0) > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="w-3 h-3" />
                  {c?.length}
                </span>
              )}
              {attachments.length > 0 && (
                <span className="flex items-center gap-0.5">
                  <Paperclip className="w-3 h-3" />
                  {attachments.length}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const task = info.row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(task)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-red-600 focus:text-red-600">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <div className="rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white overflow-hidden shadow-sm">
        {tasks.length === 0 ? (
          <TaskEmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[rgba(0,0,0,0.02)] text-[var(--color-text-secondary)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-[rgba(0,0,0,0.04)]">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-5 py-4 font-medium whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.04)] text-[var(--color-text-primary)]">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-[rgba(0,0,0,0.01)] transition-colors data-[state=selected]:bg-[rgba(0,0,0,0.02)]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <TaskDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setTimeout(() => setEditingTask(null), 300);
        }}
        task={editingTask}
        users={users}
        campaigns={campaigns}
      />
    </>
  );
}
