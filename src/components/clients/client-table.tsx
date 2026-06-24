"use client";

import { useState } from "react";
import Link from "next/link";
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
import { MoreHorizontal, ArrowUpDown, Plus, Search, ExternalLink, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { ClientDialog } from "./client-dialog";
import { DeleteClientAlert } from "./delete-client-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { PremiumCard } from "@/components/ui/premium-card";

interface ClientTableProps {
  data: any[];
}

export function ClientTable({ data }: ClientTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsEditOpen(true);
  };

  const handleDelete = (client: any) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "companyName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)] px-0 font-semibold"
          >
            Company
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div>
            <Link 
              href={`/clients/${client.id}`}
              className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand-400)] transition-colors flex items-center group"
            >
              {client.companyName}
            </Link>
            {client.brandName && (
              <div className="text-sm text-[var(--color-text-muted)]">
                Brand: {client.brandName}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "contactPerson",
      header: "Contact",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {client.contactPerson}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <a 
                href={`mailto:${client.email}`} 
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-400)] flex items-center transition-colors"
                title={client.email}
              >
                <Mail className="w-3 h-3 mr-1" />
                Email
              </a>
              {client.phone && (
                <span 
                  className="text-xs text-[var(--color-text-muted)] flex items-center"
                  title={client.phone}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Phone
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => {
        const val = row.getValue("industry") as string;
        if (!val) return <span className="text-sm text-[var(--color-text-disabled)]">—</span>;
        return <span className="text-sm text-[var(--color-text-secondary)]">{val}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        
        let colorClass = "bg-gray-500/15 text-gray-400 border-gray-500/20";
        if (status === "ACTIVE") colorClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
        if (status === "LEAD") colorClass = "bg-blue-500/15 text-blue-400 border-blue-500/20";
        if (status === "CLOSED") colorClass = "bg-rose-500/15 text-rose-400 border-rose-500/20";

        return (
          <Badge variant="outline" className={`${colorClass} rounded-full text-xs py-0.5`}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)] px-0 font-semibold"
          >
            Added On
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <span className="text-sm text-[var(--color-text-secondary)]">
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-[var(--color-text-muted)] hover:bg-[rgba(0,0,0,0.05)]"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)] shadow-xl"
            >
              <DropdownMenuItem className="hover:bg-[rgba(0,0,0,0.05)] focus:bg-[rgba(0,0,0,0.05)] cursor-pointer p-0">
                <Link href={`/clients/${client.id}`} className="flex items-center w-full px-2 py-1.5">
                  <ExternalLink className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleEdit(client)}
                className="hover:bg-[rgba(0,0,0,0.05)] focus:bg-[rgba(0,0,0,0.05)] cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" />
                Edit Client
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.08)]" />
              <DropdownMenuItem 
                onClick={() => handleDelete(client)}
                className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Client
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
            placeholder="Search clients..."
            value={(table.getColumn("companyName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("companyName")?.setFilterValue(event.target.value)
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
            Add Client
          </Button>
        </div>
      </div>

      {/* Table */}
      <PremiumCard className="overflow-hidden p-0 border-0 shadow-executive-sm rounded-xl">
        <Table>
          <TableHeader className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.08)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
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
                  className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.02)] transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-64 p-4 text-center">
                  <EmptyState 
                    icon={Users} 
                    title="No clients found" 
                    description="Get started by adding your first client."
                    action={
                      <Button
                        onClick={() => setIsCreateOpen(true)}
                        variant="default"
                        className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] text-white hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-500)] shadow-md"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </PremiumCard>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)]"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)]"
        >
          Next
        </Button>
      </div>

      {/* Modals */}
      <ClientDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />
      
      <ClientDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen}
        client={selectedClient} 
      />

      <DeleteClientAlert
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        client={selectedClient}
      />
    </div>
  );
}
