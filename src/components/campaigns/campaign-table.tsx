"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown, Plus, Search, ExternalLink, Edit, Trash2, Calendar, Megaphone } from "lucide-react";
import { CampaignDialog } from "./campaign-dialog";
import { EmptyState } from "@/components/ui/empty-state";
// You'll need to create a delete campaign alert similarly to the client one
// import { DeleteCampaignAlert } from "./delete-campaign-alert";

interface CampaignTableProps {
  data: any[];
  clients: any[];
}

export function CampaignTable({ data, clients }: CampaignTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  // const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const handleEdit = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsEditOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)] px-0 font-semibold"
          >
            Campaign Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div>
            <Link 
              href={`/campaigns/${campaign.id}`}
              className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand-400)] transition-colors flex items-center group"
            >
              {campaign.name}
            </Link>
            <div className="text-sm text-[var(--color-text-muted)]">
              Client: {campaign.client?.companyName}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "budget",
      header: "Budget",
      cell: ({ row }) => {
        const budget = parseFloat(row.getValue("budget"));
        return (
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            ${budget.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        
        let colorClass = "bg-gray-500/15 text-gray-400 border-gray-500/20";
        if (status === "ACTIVE") colorClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
        if (status === "REVIEW") colorClass = "bg-amber-500/15 text-amber-400 border-amber-500/20";
        if (status === "COMPLETED") colorClass = "bg-blue-500/15 text-blue-400 border-blue-500/20";
        if (status === "CANCELLED") colorClass = "bg-rose-500/15 text-rose-400 border-rose-500/20";

        return (
          <Badge variant="outline" className={`${colorClass} rounded-full text-xs py-0.5`}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "startDate",
      header: "Dates",
      cell: ({ row }) => {
        const start = row.original.startDate;
        const end = row.original.endDate;
        if (!start && !end) return <span className="text-sm text-[var(--color-text-disabled)]">—</span>;
        
        return (
          <div className="flex flex-col text-xs text-[var(--color-text-muted)]">
            {start && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(start), "MMM d, yyyy")}
              </span>
            )}
            {end && (
              <span className="flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-[var(--color-text-disabled)]" />
                {format(new Date(end), "MMM d, yyyy")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-[var(--color-text-muted)] hover:bg-[rgba(0,0,0,0.05)]">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)] shadow-xl"
            >
              <DropdownMenuItem className="hover:bg-[rgba(0,0,0,0.05)] focus:bg-[rgba(0,0,0,0.05)] cursor-pointer p-0">
                <Link href={`/campaigns/${campaign.id}`} className="flex items-center w-full px-2 py-1.5">
                  <ExternalLink className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleEdit(campaign)}
                className="hover:bg-[rgba(0,0,0,0.05)] focus:bg-[rgba(0,0,0,0.05)] cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" />
                Edit Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input
            placeholder="Search campaigns..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-9 bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-[var(--color-brand-500)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center rounded-lg h-8 px-2.5 bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] shadow-lg shadow-[var(--color-brand-500)]/20 transition-all duration-200 text-sm font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] overflow-hidden glass-card">
        <Table>
          <TableHeader className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.08)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.02)] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-64 p-4 text-center">
                  <EmptyState 
                    icon={Megaphone} 
                    title="No campaigns found" 
                    description="Get started by creating your first campaign."
                    action={
                      <Button
                        onClick={() => setIsCreateOpen(true)}
                        variant="default"
                        className="shadow-lg shadow-[var(--color-brand-500)]/20"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Campaign
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CampaignDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        clients={clients}
      />
      
      <CampaignDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen}
        campaign={selectedCampaign} 
        clients={clients}
      />
    </div>
  );
}
