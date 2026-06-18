"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full flex-col gap-6 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-[var(--color-surface-800)]" />
        <Skeleton className="h-10 w-32 bg-[var(--color-surface-800)]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl bg-[var(--color-surface-800)]" />
        ))}
      </div>

      <Skeleton className="h-[400px] w-full rounded-xl bg-[var(--color-surface-800)]" />
    </div>
  )
}
