import { 
  ArrowDownUp, 
  LayoutGrid,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdvancedTaskFilters, SortOption, GroupOption } from "@/hooks/use-task-filters";

interface TaskViewOptionsProps {
  filters: AdvancedTaskFilters;
  setFilters: (filters: Partial<AdvancedTaskFilters>) => void;
}

export function TaskViewOptions({ filters, setFilters }: TaskViewOptionsProps) {
  return (
    <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs text-[var(--color-text-secondary)]">
            <LayoutGrid className="w-4 h-4" />
            Group by: <span className="font-semibold text-[var(--color-text-primary)] capitalize">{filters.groupBy.replace('Id', '')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs">Group Board By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={filters.groupBy} onValueChange={(v) => setFilters({ groupBy: v as GroupOption })}>
            <DropdownMenuRadioItem value="status" className="text-xs">Status</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="priority" className="text-xs">Priority</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="assigneeId" className="text-xs">Assignee</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="campaignId" className="text-xs">Campaign</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-[rgba(0,0,0,0.1)]" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs text-[var(--color-text-secondary)]">
            <ArrowDownUp className="w-4 h-4" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs">Sort Tasks By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={filters.sortBy} onValueChange={(v) => setFilters({ sortBy: v as SortOption })}>
            <DropdownMenuRadioItem value="createdAt_desc" className="text-xs">Created (Newest)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="createdAt_asc" className="text-xs">Created (Oldest)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dueDate_asc" className="text-xs">Due Date (Earliest)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dueDate_desc" className="text-xs">Due Date (Latest)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="priority_desc" className="text-xs">Priority (High to Low)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="priority_asc" className="text-xs">Priority (Low to High)</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
