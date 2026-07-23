import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type SortOption = 
  | "createdAt_desc" 
  | "createdAt_asc" 
  | "dueDate_asc" 
  | "dueDate_desc" 
  | "priority_desc" 
  | "priority_asc"
  | "title_asc"
  | "title_desc";

export type GroupOption = "status" | "priority" | "assigneeId" | "campaignId";

export interface AdvancedTaskFilters {
  search: string;
  priorities: string[];
  statuses: string[];
  campaignIds: string[];
  projectIds: string[];
  assigneeIds: string[];
  reporterIds: string[];
  labels: string[];
  isOverdue: boolean | null;
  isCompleted: boolean | null;
  isArchived: boolean | null;
  dueDateFrom: string;
  dueDateTo: string;
  sortBy: SortOption;
  groupBy: GroupOption;
}

export const defaultAdvancedFilters: AdvancedTaskFilters = {
  search: "",
  priorities: [],
  statuses: [],
  campaignIds: [],
  projectIds: [],
  assigneeIds: [],
  reporterIds: [],
  labels: [],
  isOverdue: null,
  isCompleted: null,
  isArchived: null,
  dueDateFrom: "",
  dueDateTo: "",
  sortBy: "createdAt_desc",
  groupBy: "status",
};

export function useTaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parseArray = (key: string) => {
    const val = searchParams.get(key);
    return val ? val.split(",").filter(Boolean) : [];
  };

  const parseBoolean = (key: string) => {
    const val = searchParams.get(key);
    if (val === "true") return true;
    if (val === "false") return false;
    return null;
  };

  const filters: AdvancedTaskFilters = useMemo(() => ({
    search: searchParams.get("search") || "",
    priorities: parseArray("priorities"),
    statuses: parseArray("statuses"),
    campaignIds: parseArray("campaignIds"),
    projectIds: parseArray("projectIds"),
    assigneeIds: parseArray("assigneeIds"),
    reporterIds: parseArray("reporterIds"),
    labels: parseArray("labels"),
    isOverdue: parseBoolean("isOverdue"),
    isCompleted: parseBoolean("isCompleted"),
    isArchived: parseBoolean("isArchived"),
    dueDateFrom: searchParams.get("dueDateFrom") || "",
    dueDateTo: searchParams.get("dueDateTo") || "",
    sortBy: (searchParams.get("sortBy") as SortOption) || "createdAt_desc",
    groupBy: (searchParams.get("groupBy") as GroupOption) || "status",
  }), [searchParams]);

  const setFilters = useCallback((newFilters: Partial<AdvancedTaskFilters>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    const updateArray = (key: string, arr: string[] | undefined) => {
      if (arr && arr.length > 0) {
        current.set(key, arr.join(","));
      } else if (arr !== undefined) {
        current.delete(key);
      }
    };

    const updateValue = (key: string, val: string | null | undefined) => {
      if (val) {
        current.set(key, val);
      } else if (val !== undefined) {
        current.delete(key);
      }
    };

    const updateBoolean = (key: string, val: boolean | null | undefined) => {
      if (val === true) current.set(key, "true");
      else if (val === false) current.set(key, "false");
      else if (val !== undefined) current.delete(key);
    };

    if (newFilters.search !== undefined) updateValue("search", newFilters.search);
    updateArray("priorities", newFilters.priorities);
    updateArray("statuses", newFilters.statuses);
    updateArray("campaignIds", newFilters.campaignIds);
    updateArray("projectIds", newFilters.projectIds);
    updateArray("assigneeIds", newFilters.assigneeIds);
    updateArray("reporterIds", newFilters.reporterIds);
    updateArray("labels", newFilters.labels);
    updateBoolean("isOverdue", newFilters.isOverdue);
    updateBoolean("isCompleted", newFilters.isCompleted);
    updateBoolean("isArchived", newFilters.isArchived);
    updateValue("dueDateFrom", newFilters.dueDateFrom);
    updateValue("dueDateTo", newFilters.dueDateTo);
    
    if (newFilters.sortBy) {
      if (newFilters.sortBy === defaultAdvancedFilters.sortBy) current.delete("sortBy");
      else updateValue("sortBy", newFilters.sortBy);
    }
    
    if (newFilters.groupBy) {
      if (newFilters.groupBy === defaultAdvancedFilters.groupBy) current.delete("groupBy");
      else updateValue("groupBy", newFilters.groupBy);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return { filters, setFilters, clearFilters };
}
