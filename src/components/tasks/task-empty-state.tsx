import { Inbox, CheckCircle2 } from "lucide-react";

export function TaskEmptyState({ isDone = false }: { isDone?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-stone-200 rounded-3xl bg-white/50 backdrop-blur-sm min-h-[400px]">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-400'}`}>
        {isDone ? <CheckCircle2 className="w-8 h-8" /> : <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-[17px] font-semibold text-stone-800 mb-1">
        {isDone ? "All caught up!" : "No tasks found"}
      </h3>
      <p className="text-sm text-stone-500 max-w-sm">
        {isDone 
          ? "You have completed all your work. Enjoy the rest of your day!" 
          : "Try adjusting your filters or search query to find what you're looking for."}
      </p>
    </div>
  );
}
