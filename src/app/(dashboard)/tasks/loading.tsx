export default function TasksLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="h-8 w-32 bg-stone-100 rounded-md"></div>
        <div className="h-10 w-24 bg-stone-100 rounded-md"></div>
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-48 bg-stone-100 rounded-md"></div>
        <div className="h-10 w-32 bg-stone-100 rounded-md"></div>
        <div className="h-10 w-32 bg-stone-100 rounded-md"></div>
      </div>
      <div className="h-[600px] w-full bg-stone-100 rounded-2xl"></div>
    </div>
  );
}
