import { 
  Search, 
  X, 
  Filter, 
  Check, 
  ChevronDown,
  Calendar,
  Flag,
  User,
  Megaphone,
  Bookmark,
  Save
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AdvancedTaskFilters } from "@/hooks/use-task-filters";

interface TaskFilterBarProps {
  filters: AdvancedTaskFilters;
  setFilters: (filters: Partial<AdvancedTaskFilters>) => void;
  clearFilters: () => void;
  users: any[];
  campaigns: any[];
}

export function TaskFilterBar({ filters, setFilters, clearFilters, users, campaigns }: TaskFilterBarProps) {
  const activeFilterCount = 
    filters.priorities.length + 
    filters.statuses.length + 
    filters.assigneeIds.length + 
    filters.campaignIds.length +
    (filters.isOverdue ? 1 : 0) +
    (filters.isCompleted !== null ? 1 : 0);

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  const [savedFilters, setSavedFilters] = useState<Record<string, string>>({});
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem("taskFilters");
      if (saved) setSavedFilters(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const handleSaveFilter = () => {
    const name = prompt("Enter a name for this saved filter:");
    if (!name) return;
    const currentParams = window.location.search;
    const newSaved = { ...savedFilters, [name]: currentParams };
    setSavedFilters(newSaved);
    localStorage.setItem("taskFilters", JSON.stringify(newSaved));
  };

  const handleLoadFilter = (query: string) => {
    window.location.search = query;
  };

  const handleDeleteSavedFilter = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSaved = { ...savedFilters };
    delete newSaved[name];
    setSavedFilters(newSaved);
    localStorage.setItem("taskFilters", JSON.stringify(newSaved));
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <Input
          id="task-search-input"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="pl-9 h-9 border-[rgba(0,0,0,0.1)] focus-visible:ring-[var(--color-brand-200)] rounded-xl bg-gray-50/50"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
            onClick={() => setFilters({ search: "" })}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed gap-2 rounded-xl text-xs">
              <Flag className="w-3.5 h-3.5 text-gray-400" />
              Priority
              {filters.priorities.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px] bg-gray-100 rounded-md">
                  {filters.priorities.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
              <DropdownMenuCheckboxItem
                key={p}
                checked={filters.priorities.includes(p)}
                onCheckedChange={() => setFilters({ priorities: toggleArrayItem(filters.priorities, p) })}
                className="text-xs"
              >
                {p}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed gap-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              Status
              {filters.statuses.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px] bg-gray-100 rounded-md">
                  {filters.statuses.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={filters.statuses.includes(s)}
                onCheckedChange={() => setFilters({ statuses: toggleArrayItem(filters.statuses, s) })}
                className="text-xs"
              >
                {s.replace("_", " ")}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed gap-2 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Assignee
              {filters.assigneeIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px] bg-gray-100 rounded-md">
                  {filters.assigneeIds.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel className="text-xs">Filter by Assignee</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.assigneeIds.includes("UNASSIGNED")}
              onCheckedChange={() => setFilters({ assigneeIds: toggleArrayItem(filters.assigneeIds, "UNASSIGNED") })}
              className="text-xs font-medium"
            >
              Unassigned
            </DropdownMenuCheckboxItem>
            {users.map((u) => (
              <DropdownMenuCheckboxItem
                key={u.id}
                checked={filters.assigneeIds.includes(u.id)}
                onCheckedChange={() => setFilters({ assigneeIds: toggleArrayItem(filters.assigneeIds, u.id) })}
                className="text-xs"
              >
                {u.name || u.email}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed gap-2 rounded-xl text-xs">
              <Megaphone className="w-3.5 h-3.5 text-gray-400" />
              Campaign
              {filters.campaignIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 h-5 text-[10px] bg-gray-100 rounded-md">
                  {filters.campaignIds.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel className="text-xs">Filter by Campaign</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {campaigns.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={filters.campaignIds.includes(c.id)}
                onCheckedChange={() => setFilters({ campaignIds: toggleArrayItem(filters.campaignIds, c.id) })}
                className="text-xs"
              >
                {c.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed gap-2 rounded-xl text-xs">
              <Bookmark className="w-3.5 h-3.5 text-gray-400" />
              Saved Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs">Your Saved Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.keys(savedFilters).length === 0 ? (
              <div className="p-2 text-xs text-[var(--color-text-muted)]">No saved filters yet.</div>
            ) : (
              Object.entries(savedFilters).map(([name, query]) => (
                <div key={name} className="flex items-center justify-between px-2 py-1.5 hover:bg-[rgba(0,0,0,0.04)] rounded-md cursor-pointer group" onClick={() => handleLoadFilter(query)}>
                  <span className="text-xs">{name}</span>
                  <X className="w-3 h-3 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={(e) => handleDeleteSavedFilter(name, e)} />
                </div>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSaveFilter} className="text-xs font-medium text-[var(--color-brand-600)] cursor-pointer">
              <Save className="w-3.5 h-3.5 mr-2" />
              Save current view
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Quick Toggles */}
        <Button
          variant={filters.isOverdue ? "default" : "outline"}
          size="sm"
          className={`h-9 rounded-xl text-xs ${filters.isOverdue ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'border-dashed'}`}
          onClick={() => setFilters({ isOverdue: filters.isOverdue ? null : true })}
        >
          Overdue
        </Button>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
