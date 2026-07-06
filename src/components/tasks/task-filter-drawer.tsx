"use client";

import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface TaskFilters {
  status: string;
  priority: string;
  campaignId: string;
  assigneeId: string;
  dueDateFrom: string;
  dueDateTo: string;
}

const DEFAULT_FILTERS: TaskFilters = {
  status: "",
  priority: "",
  campaignId: "",
  assigneeId: "",
  dueDateFrom: "",
  dueDateTo: "",
};

interface TaskFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  users: any[];
  campaigns: any[];
  filters: TaskFilters;
  onApply: (filters: TaskFilters) => void;
}

export function TaskFilterDrawer({
  open,
  onClose,
  users,
  campaigns,
  filters,
  onApply,
}: TaskFilterDrawerProps) {
  const [local, setLocal] = useState<TaskFilters>(filters);

  if (!open) return null;

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white border-l border-[rgba(0,0,0,0.08)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(0,0,0,0.06)]">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">Filters</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status */}
          <FilterField label="Status">
            <Select value={local.status || "all"} onValueChange={(v) => setLocal({ ...local, status: v === "all" ? "" : (v || "") })}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          {/* Priority */}
          <FilterField label="Priority">
            <Select value={local.priority || "all"} onValueChange={(v) => setLocal({ ...local, priority: v === "all" ? "" : (v || "") })}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          {/* Campaign */}
          <FilterField label="Campaign">
            <Select value={local.campaignId || "all"} onValueChange={(v) => setLocal({ ...local, campaignId: v === "all" ? "" : (v || "") })}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          {/* Assignee */}
          <FilterField label="Assignee">
            <Select value={local.assigneeId || "all"} onValueChange={(v) => setLocal({ ...local, assigneeId: v === "all" ? "" : (v || "") })}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          {/* Due Date Range */}
          <FilterField label="Due Date From">
            <Input
              type="date"
              value={local.dueDateFrom}
              onChange={(e) => setLocal({ ...local, dueDateFrom: e.target.value })}
              className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]"
            />
          </FilterField>

          <FilterField label="Due Date To">
            <Input
              type="date"
              value={local.dueDateTo}
              onChange={(e) => setLocal({ ...local, dueDateTo: e.target.value })}
              className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)]"
            />
          </FilterField>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[rgba(0,0,0,0.06)] flex items-center gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 shadow-lg shadow-[var(--color-brand-500)]/20">
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
