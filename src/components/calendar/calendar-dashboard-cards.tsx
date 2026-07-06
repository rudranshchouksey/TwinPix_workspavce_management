import { CalendarCheck, Clock, Users, Megaphone, CheckCircle2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATS = [
  { label: "Today's Events", value: "4", icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" },
  { label: "Upcoming Deadlines", value: "12", icon: Clock, color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200" },
  { label: "Meetings", value: "3", icon: Users, color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-200" },
  { label: "Campaign Launches", value: "1", icon: Megaphone, color: "text-green-600", bg: "bg-green-100", border: "border-green-200" },
  { label: "Tasks Due", value: "8", icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-100", border: "border-indigo-200" },
  { label: "Content Scheduled", value: "5", icon: ImageIcon, color: "text-pink-600", bg: "bg-pink-100", border: "border-pink-200" },
  { label: "Overdue Items", value: "0", icon: AlertCircle, color: "text-red-600", bg: "bg-red-100", border: "border-red-200" },
];

export function CalendarDashboardCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-white/60 p-4 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-md",
              stat.border
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", stat.bg)}>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div className="flex h-5 w-12 items-center justify-center opacity-50">
                {/* Simulated tiny sparkline using SVG */}
                <svg viewBox="0 0 40 12" className="h-full w-full stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2,10 L10,6 L18,8 L26,4 L38,2" />
                </svg>
              </div>
            </div>
            
            <div className="mt-3">
              <h3 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {stat.value}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                {stat.label}
              </p>
            </div>
            
            {/* Bottom accent */}
            <div className={cn("absolute bottom-0 left-0 h-1 w-full opacity-50", stat.bg)} />
          </div>
        );
      })}
    </div>
  );
}
