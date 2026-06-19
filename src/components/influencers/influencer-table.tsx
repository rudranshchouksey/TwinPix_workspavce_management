"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import Link from "next/link";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, Search, ExternalLink, Phone, Mail, AtSign, Users, Globe, Video, MessageCircle, Smartphone } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { InfluencerActionsDropdown } from "./influencer-actions-dropdown";

interface InfluencerTableProps {
  data: any[];
  isAdmin?: boolean;
}

export function InfluencerTable({ data, isAdmin = false }: InfluencerTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "instagramHandle",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Influencer
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden shrink-0 border border-[var(--color-border)] shadow-sm">
            {row.original.profileImage ? (
              <img src={row.original.profileImage} alt={row.original.instagramHandle} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-stone-500">
                {row.original.instagramHandle.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[var(--color-text-primary)] truncate max-w-[150px]">
              {row.original.influencerName || "Unnamed"}
            </span>
            <div className="flex items-center text-xs font-medium text-[var(--color-text-muted)] mt-0.5">
              {row.original.platform?.toLowerCase() === 'instagram' ? <AtSign className="w-3 h-3 mr-1" /> :
               row.original.platform?.toLowerCase() === 'youtube' ? <Video className="w-3 h-3 mr-1" /> :
               row.original.platform?.toLowerCase() === 'linkedin' ? <Users className="w-3 h-3 mr-1" /> :
               row.original.platform?.toLowerCase() === 'twitter' ? <MessageCircle className="w-3 h-3 mr-1" /> :
               <Globe className="w-3 h-3 mr-1" />}
              <span className="truncate max-w-[120px]">@{row.original.instagramHandle}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-[var(--color-text-secondary)] font-medium text-sm line-clamp-2 max-w-[200px]">
          {row.getValue("category") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-[var(--color-text-secondary)] font-medium text-sm">
          {row.getValue("location") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-[var(--color-text-secondary)] font-medium text-sm">
          {row.getValue("email") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "followers",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Followers
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const followers = row.getValue("followers") as number;
        if (followers === null || followers === undefined) return <span className="text-[var(--color-text-muted)]">—</span>;
        
        const formatted = new Intl.NumberFormat('en-US', {
          notation: "compact",
          compactDisplay: "short",
          maximumFractionDigits: 1
        }).format(followers);

        return (
          <div className="font-bold text-[var(--color-text-primary)]">
            {formatted}
          </div>
        );
      },
    },
    {
      accessorKey: "following",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Following
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const following = row.getValue("following") as number;
        if (following === null || following === undefined) return <span className="text-[var(--color-text-muted)]">—</span>;
        
        const formatted = new Intl.NumberFormat('en-US', {
          notation: "compact",
          compactDisplay: "short",
          maximumFractionDigits: 1
        }).format(following);

        return (
          <div className="font-bold text-[var(--color-text-primary)]">
            {formatted}
          </div>
        );
      },
    },
    {
      accessorKey: "posts",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Posts
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const posts = row.getValue("posts") as number;
        if (posts === null || posts === undefined) return <span className="text-[var(--color-text-muted)]">—</span>;
        
        const formatted = new Intl.NumberFormat('en-US', {
          notation: "compact",
          compactDisplay: "short",
          maximumFractionDigits: 1
        }).format(posts);

        return (
          <div className="font-bold text-[var(--color-text-primary)]">
            {formatted}
          </div>
        );
      },
    },
    {
      accessorKey: "engagementRate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Eng. Rate
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const rate = row.getValue("engagementRate") as number;
        if (!rate) return <span className="text-[var(--color-text-muted)]">—</span>;

        return (
          <Badge variant="outline" className="bg-[var(--color-surface-900)] border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold shadow-sm">
            {rate.toFixed(2)}%
          </Badge>
        );
      },
    },
    {
      accessorKey: "lastSyncDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Last Sync
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("lastSyncDate") as Date | null;
        if (!date) return <span className="text-[var(--color-text-muted)] text-sm">—</span>;
        
        return (
          <span className="text-[var(--color-text-secondary)] text-sm font-medium">
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        
        let colorClass = "bg-stone-100 text-stone-700 border-stone-200";
        
        switch (status) {
          case "NEW_LEAD":
            colorClass = "bg-sky-50 text-sky-700 border-sky-200";
            break;
          case "CONTACTED":
            colorClass = "bg-amber-50 text-amber-700 border-amber-200";
            break;
          case "REPLIED":
            colorClass = "bg-violet-50 text-violet-700 border-violet-200";
            break;
          case "NEGOTIATING":
            colorClass = "bg-orange-50 text-orange-700 border-orange-200";
            break;
          case "ACTIVE":
          case "ONBOARDED":
            colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
            break;
          case "BLACKLISTED":
            colorClass = "bg-red-50 text-red-700 border-red-200";
            break;
        }

        return (
          <Badge variant="outline" className={`${colorClass} font-bold tracking-wide text-[10px] shadow-sm`}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const { email, phoneNumber } = row.original;
        return (
          <div className="flex items-center gap-2">
            {email ? (
              <a href={`mailto:${email}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors" title={email}>
                <Mail className="h-4 w-4" />
              </a>
            ) : null}
            {phoneNumber ? (
              <a href={`tel:${phoneNumber}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors" title={phoneNumber}>
                <Phone className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            <InfluencerActionsDropdown influencer={row.original} isAdmin={isAdmin} />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input
            placeholder="Search influencers..."
            value={(table.getColumn("instagramHandle")?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
              table.getColumn("instagramHandle")?.setFilterValue(event.target.value);
            }}
            className="pl-9 h-10 bg-white border-[var(--color-border)] text-[var(--color-text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)] shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden shadow-executive-sm">
        <Table>
          <TableHeader className="bg-[var(--color-surface-900)] border-b border-[var(--color-border)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-12 font-semibold text-[var(--color-text-secondary)]">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-900)] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <EmptyState
                    icon={Users}
                    title="No influencers found"
                    description="Try adjusting your search or filters"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 bg-white border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-900)]"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 bg-white border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-900)]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
