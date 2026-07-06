export default function TasksLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-3xl bg-gradient-to-br from-stone-50 to-stone-100 p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-stone-200/60 rounded-lg" />
          <div className="h-4 w-96 bg-stone-200/40 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-28 bg-stone-200/50 rounded-lg" />
          <div className="h-9 w-36 bg-stone-200/40 rounded-lg" />
          <div className="h-9 w-20 bg-stone-200/40 rounded-lg" />
          <div className="h-9 w-20 bg-stone-200/40 rounded-lg" />
          <div className="ml-auto h-9 w-64 bg-stone-200/40 rounded-lg" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-stone-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 bg-stone-200/60 rounded-xl" />
              <div className="h-4 w-10 bg-stone-200/40 rounded" />
            </div>
            <div className="h-7 w-16 bg-stone-200/50 rounded" />
            <div className="h-3 w-24 bg-stone-200/30 rounded" />
            <div className="h-9 w-full bg-stone-100 rounded" />
          </div>
        ))}
      </div>

      {/* Insights skeleton */}
      <div className="rounded-2xl bg-white border border-stone-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-stone-200/50 rounded" />
          <div className="h-4 w-32 bg-stone-200/50 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-stone-100 p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 bg-stone-200/50 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-full bg-stone-200/40 rounded" />
                  <div className="h-3 w-3/4 bg-stone-200/30 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick filters + Kanban skeleton */}
      <div className="flex gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-20 bg-stone-100 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-stone-50 border border-stone-100 min-h-[520px] p-3 space-y-3">
            <div className="flex items-center justify-between px-1.5 pt-1">
              <div className="h-4 w-20 bg-stone-200/50 rounded" />
              <div className="h-5 w-8 bg-stone-200/40 rounded-full" />
            </div>
            {Array.from({ length: 3 - i }).map((_, j) => (
              <div key={j} className="rounded-[20px] bg-white border border-stone-100 p-4 space-y-2">
                <div className="h-4 w-16 bg-stone-200/40 rounded-full" />
                <div className="h-4 w-full bg-stone-200/30 rounded" />
                <div className="h-3 w-3/4 bg-stone-200/20 rounded" />
                <div className="flex justify-between items-center pt-2 border-t border-stone-50">
                  <div className="h-3 w-16 bg-stone-200/30 rounded" />
                  <div className="h-6 w-6 bg-stone-200/40 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
