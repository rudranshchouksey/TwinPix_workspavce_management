export function KpiDashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-36 rounded-2xl bg-stone-100 animate-pulse" />
      ))}
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="h-4 w-40 bg-stone-100 rounded animate-pulse mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-stone-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function ViewSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-stone-100 animate-pulse" />
      ))}
    </div>
  );
}

export default function PipelineLoading() {
  return (
    <div className="space-y-6 pb-16">
      <div className="h-44 rounded-3xl bg-stone-100 animate-pulse" />
      <KpiDashboardSkeleton />
      <InsightsSkeleton />
      <ViewSkeleton />
    </div>
  );
}
