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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, Plus, Search } from "lucide-react";
import { format } from "date-fns";

import { getRoleLabel, getRoleBadgeColor } from "@/lib/rbac";
import { UserDialog } from "./user-dialog";
import { DeleteUserAlert } from "./delete-user-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { PremiumCard } from "@/components/ui/premium-card";

import { User } from "@prisma/client";

interface UserTableProps {
  data: User[];
  currentUserRole: string;
}

export function UserTable({ data, currentUserRole }: UserTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-[var(--color-text-primary)]">
            {row.original.name || "Unnamed"}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant="outline" className={`${getRoleBadgeColor(role)} rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide`}>
            {getRoleLabel(role)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const color =
          status === "ACTIVE"
            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
            : status === "INACTIVE"
            ? "bg-gray-500/15 text-gray-400 border-gray-500/20"
            : "bg-red-500/15 text-red-400 border-red-500/20";
            
        return (
          <Badge variant="outline" className={`${color} rounded-full`}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "jobTitle",
      header: "Title",
      cell: ({ row }) => (
        <span className="text-[var(--color-text-secondary)]">
          {row.getValue("jobTitle") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-[var(--color-text-secondary)]">
          {format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        
        // Disable modifying SUPER_ADMIN if you're not one
        const canModify = !(user.role === "SUPER_ADMIN" && currentUserRole !== "SUPER_ADMIN");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--color-surface-800)] border-[rgba(0,0,0,0.08)]">
              <DropdownMenuLabel className="text-[var(--color-text-primary)]">Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)]"
                onClick={() => navigator.clipboard.writeText(user.email)}
              >
                Copy email
              </DropdownMenuItem>
              
              {canModify && (
                <>
                  <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.08)]" />
                  <DropdownMenuItem
                    className="cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)]"
                    onClick={() => setEditUser(user)}
                  >
                    Edit User
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
                    onClick={() => setDeleteUser(user)}
                  >
                    Delete User
                  </DropdownMenuItem>
                </>
              )}
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
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input
            placeholder="Search by name or email..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-9 bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] focus-visible:ring-[var(--color-brand-500)]"
          />
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] shadow-lg shadow-[var(--color-brand-500)]/20 transition-all duration-200"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Table */}
      <PremiumCard className="overflow-hidden p-0 border-0 shadow-executive-sm rounded-xl">
        <Table>
          <TableHeader className="bg-[rgba(0,0,0,0.02)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-[rgba(0,0,0,0.08)] hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-[var(--color-text-muted)] font-bold text-xs uppercase tracking-wider h-11 px-4">
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
                  className="border-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.02)] transition-colors group"
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
                    title="No users found" 
                    description="Get started by adding your first team member."
                    action={
                      <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] text-white hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-500)] shadow-md transition-all duration-200"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
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
          className="bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)] disabled:opacity-50 disabled:bg-transparent"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="bg-transparent border-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)] disabled:opacity-50 disabled:bg-transparent"
        >
          Next
        </Button>
      </div>

      {/* Modals */}
      <UserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <UserDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser || undefined}
      />
      <DeleteUserAlert
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        user={deleteUser}
      />
    </div>
  );
}
