"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AtSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react";
import { InfluencerActionsDropdown } from "@/components/influencers/influencer-actions-dropdown";
import { BulkActionBar } from "./bulk-action-bar";
import { STATUS_META, PRIORITY_META, computeNextFollowUp, computePriority, compactNumber } from "./pipeline-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { CreateInfluencerDialog } from "@/components/influencers/create-influencer-dialog";

interface PipelineTableViewProps {
  data: any[];
  total: number;
  totalPages: number;
  currentPage: number;
  currentSort: string;
  currentOrder: string;
  isAdmin: boolean;
  managers: { id: string; name: string | null; image: string | null }[];
}

export function PipelineTableView({ data, total, totalPages, currentPage, currentSort, currentOrder, isAdmin, managers }: PipelineTableViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const buildUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        value === undefined ? params.delete(key) : params.set(key, value);
      });
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const toggleSort = (field: string) => {
    let newOrder = "asc";
    if (currentSort === field) {
      if (currentOrder === "asc") newOrder = "desc";
      else {
        router.push(buildUrl({ sort: undefined, order: undefined, page: undefined }));
        return;
      }
    }
    router.push(buildUrl({ sort: field, order: newOrder, page: undefined }));
  };

  const sortIcon = (field: string) => {
    if (currentSort !== field) return <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-40" />;
    return currentOrder === "asc" ? <ArrowUp className="ml-1.5 h-3 w-3 text-[var(--color-brand-600)]" /> : <ArrowDown className="ml-1.5 h-3 w-3 text-[var(--color-brand-600)]" />;
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === data.length ? new Set() : new Set(data.map((d) => d.id))));
  };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "select",
        header: () => <Checkbox checked={data.length > 0 && selected.size === data.length} onCheckedChange={toggleAll} />,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected.has(row.original.id)} onCheckedChange={() => toggleRow(row.original.id)} />
          </div>
        ),
      },
      {
        id: "creator",
        header: () => (
          <Button variant="ghost" onClick={() => toggleSort("influencerName")} className="px-0 hover:bg-transparent font-bold text-[var(--color-text-secondary)]">
            Creator {sortIcon("influencerName")}
          </Button>
        ),
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden shrink-0 border border-[var(--color-border)]">
                {r.profileImage ? (
                  <img src={r.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-stone-500">{r.instagramHandle.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/influencers/${r.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-[var(--color-text-primary)] truncate max-w-[150px] block hover:text-[var(--color-brand-600)] hover:underline"
                >
                  {r.influencerName || "Unnamed"}
                </Link>
                <div className="flex items-center text-xs font-medium text-[var(--color-text-muted)] mt-0.5">
                  <AtSign className="w-3 h-3 mr-0.5" />
                  <span className="truncate max-w-[120px]">{r.instagramHandle}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <span className="text-sm font-medium text-[var(--color-text-secondary)] truncate max-w-[140px] block">{row.original.category || "—"}</span>,
      },
      {
        id: "followers",
        header: () => (
          <Button variant="ghost" onClick={() => toggleSort("followers")} className="px-0 hover:bg-transparent font-bold text-[var(--color-text-secondary)]">
            Followers {sortIcon("followers")}
          </Button>
        ),
        cell: ({ row }) => <span className="text-sm font-bold text-[var(--color-text-primary)]">{compactNumber(row.original.followers)}</span>,
      },
      {
        id: "engagement",
        header: () => (
          <Button variant="ghost" onClick={() => toggleSort("engagementRate")} className="px-0 hover:bg-transparent font-bold text-[var(--color-text-secondary)]">
            Engagement {sortIcon("engagementRate")}
          </Button>
        ),
        cell: ({ row }) => (row.original.engagementRate != null ? <Badge variant="outline" className="font-bold">{row.original.engagementRate.toFixed(2)}%</Badge> : <span className="text-[var(--color-text-muted)]">—</span>),
      },
      {
        id: "status",
        header: "Pipeline Status",
        cell: ({ row }) => {
          const meta = STATUS_META[row.original.status as keyof typeof STATUS_META];
          return <Badge variant="outline" className={`${meta.color} font-bold text-[10px] tracking-wide`}>{meta.label}</Badge>;
        },
      },
      {
        id: "lastContact",
        header: () => (
          <Button variant="ghost" onClick={() => toggleSort("lastContactDate")} className="px-0 hover:bg-transparent font-bold text-[var(--color-text-secondary)]">
            Last Contact {sortIcon("lastContactDate")}
          </Button>
        ),
        cell: ({ row }) => (row.original.lastContactDate ? <span className="text-xs font-medium text-[var(--color-text-secondary)]">{format(new Date(row.original.lastContactDate), "MMM d, yyyy")}</span> : <span className="text-[var(--color-text-muted)]">—</span>),
      },
      {
        id: "nextFollowUp",
        header: "Next Follow Up",
        cell: ({ row }) => {
          const fu = computeNextFollowUp(row.original);
          if (!fu.dueDate) return <span className="text-[var(--color-text-muted)] text-xs">—</span>;
          return (
            <Badge variant="outline" className={`text-[10px] font-bold ${fu.overdue ? "bg-red-50 text-red-700 border-red-200" : "bg-stone-50 text-stone-600 border-stone-200"}`}>
              {fu.label}
            </Badge>
          );
        },
      },
      {
        id: "campaign",
        header: "Campaign",
        cell: ({ row }) => {
          const assignment = row.original.campaigns?.[0];
          if (!assignment) return <span className="text-[var(--color-text-muted)] text-xs">—</span>;
          return (
            <Link href={`/campaigns/${assignment.campaign.id}`} onClick={(e) => e.stopPropagation()} className="text-xs font-bold text-[var(--color-brand-600)] hover:underline truncate max-w-[120px] block">
              {assignment.campaign.name}
            </Link>
          );
        },
      },
      {
        id: "manager",
        header: "Assigned Manager",
        cell: ({ row }) => {
          const m = row.original.assignedManager;
          if (!m) return <span className="text-[var(--color-text-muted)] text-xs">Unassigned</span>;
          return (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                {m.image ? <img src={m.image} alt="" className="h-full w-full object-cover" /> : <span className="text-[9px] font-bold text-stone-500">{m.name?.substring(0, 2).toUpperCase()}</span>}
              </div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] truncate max-w-[90px]">{m.name}</span>
            </div>
          );
        },
      },
      {
        id: "aiScore",
        header: "AI Score",
        cell: ({ row }) => {
          const score = row.original.creatorIntelligence?.intelligenceScore;
          if (score == null) return <span className="text-[var(--color-text-muted)] text-xs">—</span>;
          return (
            <span className="flex items-center gap-1 text-sm font-black text-[var(--color-brand-600)]">
              <Sparkles className="w-3 h-3" /> {score}
            </span>
          );
        },
      },
      {
        id: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const p = computePriority(row.original);
          const meta = PRIORITY_META[p.level];
          return <Badge variant="outline" className={`${meta.color} font-bold text-[10px]`}>{meta.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <InfluencerActionsDropdown influencer={row.original} isAdmin={isAdmin} />
          </div>
        ),
      },
    ],
    [data, selected, isAdmin, currentSort, currentOrder]
  );

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const pageSize = 50;
  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, total);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No creators in this view yet"
        description="Import leads or add creators to start building your pipeline."
        action={<CreateInfluencerDialog />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[var(--color-surface-900)] sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-none hover:bg-transparent">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="h-12 font-bold text-[var(--color-text-secondary)] whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => router.push(`/influencers/${row.original.id}`)}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-900)] transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            Showing {startEntry} to {endEntry} of {total.toLocaleString()} creators
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push(buildUrl({ page: undefined }))} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push(buildUrl({ page: String(currentPage - 1) }))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((p, idx) =>
              p === "ellipsis" ? (
                <span key={`e-${idx}`} className="px-2 text-sm text-[var(--color-text-muted)]">…</span>
              ) : (
                <Button
                  key={p}
                  variant={currentPage === p ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-sm font-semibold"
                  onClick={() => router.push(buildUrl({ page: p === 1 ? undefined : String(p) }))}
                >
                  {p}
                </Button>
              )
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push(buildUrl({ page: String(currentPage + 1) }))} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push(buildUrl({ page: String(totalPages) }))} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <BulkActionBar selectedIds={Array.from(selected)} onClear={() => setSelected(new Set())} managers={managers} isAdmin={isAdmin} />
    </div>
  );
}
