"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ArrowUpDown, Calendar, MessageSquare, Paperclip, Flag, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export function TaskTableView({ tasks }: { tasks: TaskWithDetails[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

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
    <div className="rounded-2xl glass-card bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[rgba(0,0,0,0.06)]">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3 bg-[rgba(0,0,0,0.015)]"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.015)] transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center mb-3">
            <Flag className="w-6 h-6 text-[var(--color-text-disabled)]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">No tasks found</p>
          <p className="text-xs text-[var(--color-text-disabled)] mt-1">Try adjusting your filters or create a new task</p>
        </div>
      )}
    </div>
  );
}
