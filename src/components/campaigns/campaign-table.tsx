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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { ArrowUpDown, Calendar, Megaphone, Users, ListChecks } from "lucide-react";
import { CampaignDialog } from "./campaign-dialog";
import { CampaignAddInfluencersModal } from "./campaign-add-influencers-modal";
import { CampaignBriefModal } from "./campaign-brief-modal";
import { CampaignQuickActions } from "./campaign-quick-actions";
import {
  getCompletionPct,
  getDaysRemainingLabel,
  getUrgency,
  getAssignedManager,
  STATUS_BADGE_STYLES,
} from "./campaign-card-utils";

interface CampaignTableProps {
  data: any[];
  clients: any[];
}

function EmptyCampaigns({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-50)]">
        <Megaphone className="h-8 w-8 text-[var(--color-brand-400)]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No Active Campaigns Yet</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)] max-w-sm">
          Start your first influencer campaign and manage everything in one place.
        </p>
      </div>
      <Button onClick={onCreate} className="mt-2 shadow-lg shadow-[var(--color-brand-500)]/20">
        Create Campaign
      </Button>
    </div>
  );
}

export function CampaignTable({ data, clients }: CampaignTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any | null>(null);
  const [addInfluencersCampaign, setAddInfluencersCampaign] = useState<any | null>(null);
  const [briefCampaign, setBriefCampaign] = useState<any | null>(null);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.05)] px-0 font-semibold"
        >
          Campaign
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <Link href={`/campaigns/${campaign.id}`} className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand-600)] transition-colors">
            {campaign.name}
          </Link>
        );
      },
    },
    {
      id: "client",
      header: "Client",
      cell: ({ row }) => (
        <span className="text-sm text-[var(--color-text-secondary)]">{row.original.client?.companyName || "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant="outline" className={`${STATUS_BADGE_STYLES[status]} rounded-full text-xs py-0.5`}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "budget",
      header: "Budget",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          ${parseFloat(row.getValue("budget")).toLocaleString()}
        </span>
      ),
    },
    {
      id: "influencers",
      header: "Influencers",
      cell: ({ row }) => {
        const campaign = row.original;
        const assignments = campaign.influencers || [];
        if (assignments.length === 0) {
          return <span className="text-xs text-[var(--color-text-disabled)]">—</span>;
        }
        const visible = assignments.slice(0, 3);
        const remaining = assignments.length - visible.length;
        return (
          <div className="flex items-center gap-2">
            <AvatarGroup>
              {visible.map((a: any) => (
                <Avatar key={a.id} size="sm">
                  <AvatarImage src={a.influencer?.profileImage || undefined} alt="" />
                  <AvatarFallback>{(a.influencer?.influencerName || "?")[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
              {remaining > 0 && (
                <AvatarGroupCount>
                  <span className="text-[10px] font-semibold">+{remaining}</span>
                </AvatarGroupCount>
              )}
            </AvatarGroup>
            <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
              <Users className="w-3 h-3" />
              {assignments.length}
            </span>
          </div>
        );
      },
    },
    {
      id: "deliverables",
      header: "Deliverables",
      cell: ({ row }) => (
        <span className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          {row.original._count?.tasks ?? 0}
        </span>
      ),
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const pct = getCompletionPct(row.original);
        return (
          <div className="flex items-center gap-2 w-28">
            <div className="h-1.5 flex-1 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--color-text-muted)] w-9 text-right">{pct}%</span>
          </div>
        );
      },
    },
    {
      id: "deadline",
      header: "Deadline",
      cell: ({ row }) => {
        const campaign = row.original;
        const label = getDaysRemainingLabel(campaign);
        const urgency = getUrgency(campaign);
        if (!campaign.endDate) return <span className="text-sm text-[var(--color-text-disabled)]">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Calendar className="w-3 h-3" />
              {new Date(campaign.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {label && (
              <span
                className={`text-[10px] font-semibold ${
                  urgency === "overdue" ? "text-red-600" : urgency === "urgent" ? "text-orange-600" : urgency === "soon" ? "text-amber-600" : "text-[var(--color-text-disabled)]"
                }`}
              >
                {label}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "manager",
      header: "Manager",
      cell: ({ row }) => {
        const manager = getAssignedManager(row.original);
        return manager ? (
          <span className="text-sm text-[var(--color-text-secondary)]">{manager}</span>
        ) : (
          <span className="text-xs italic text-[var(--color-text-disabled)]">Unassigned</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <CampaignQuickActions
          campaign={row.original}
          onEdit={setEditCampaign}
          onAddInfluencers={setAddInfluencersCampaign}
          onGenerateBrief={setBriefCampaign}
        />
      ),
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
    state: { sorting, columnFilters },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white overflow-hidden glass-card">
        <Table>
          <TableHeader className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.08)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyCampaigns onCreate={() => setIsCreateOpen(true)} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CampaignDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} clients={clients} />
      <CampaignDialog open={!!editCampaign} onOpenChange={(open) => !open && setEditCampaign(null)} campaign={editCampaign} clients={clients} />

      {addInfluencersCampaign && (
        <CampaignAddInfluencersModal
          campaignId={addInfluencersCampaign.id}
          isOpen={!!addInfluencersCampaign}
          onClose={() => setAddInfluencersCampaign(null)}
          existingInfluencerIds={(addInfluencersCampaign.influencers || []).map((a: any) => a.influencerId)}
        />
      )}

      {briefCampaign && (
        <CampaignBriefModal
          isOpen={!!briefCampaign}
          onClose={() => setBriefCampaign(null)}
          campaignId={briefCampaign.id}
          campaignName={briefCampaign.name}
        />
      )}
    </div>
  );
}
