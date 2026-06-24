"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Table2, KanbanSquare, ListOrdered, GitBranch, CalendarDays } from "lucide-react";

const VIEWS = [
  { id: "table", label: "Table", icon: Table2 },
  { id: "kanban", label: "Kanban", icon: KanbanSquare },
  { id: "priority", label: "Priority Queue", icon: ListOrdered },
  { id: "timeline", label: "Timeline", icon: GitBranch },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function PipelineViewSwitcher({ view }: { view: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-stone-100/80 p-1 overflow-x-auto">
      {VIEWS.map((v) => {
        const Icon = v.icon;
        const active = view === v.id;
        return (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              active ? "bg-white text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
