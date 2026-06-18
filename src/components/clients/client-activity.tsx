import { formatDistanceToNow } from "date-fns";
import { UserPlus, Edit3, MessageSquareText, RefreshCcw, FileText, CheckCircle2 } from "lucide-react";

interface ClientActivityProps {
  activities: any[];
}

export function ClientActivity({ activities }: ClientActivityProps) {
  // Map activity types to specific icons and colors
  const getActivityConfig = (type: string) => {
    switch (type) {
      case "CLIENT_CREATED":
        return { icon: UserPlus, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case "CLIENT_UPDATED":
        return { icon: Edit3, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
      case "STATUS_CHANGED":
        return { icon: RefreshCcw, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
      case "NOTE_ADDED":
        return { icon: MessageSquareText, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" };
      case "FILE_UPLOADED":
        return { icon: FileText, color: "text-[var(--color-brand-400)]", bg: "bg-[var(--color-brand-500)]/10", border: "border-[var(--color-brand-500)]/20" };
      default:
        return { icon: CheckCircle2, color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" };
    }
  };

  return (
    <div className="space-y-6">
      {activities.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
          No activity recorded yet.
        </p>
      ) : (
        <div className="relative border-l border-[rgba(0,0,0,0.08)] ml-4 space-y-6 pb-4">
          {activities.map((activity, index) => {
            const config = getActivityConfig(activity.type);
            const Icon = config.icon;
            
            return (
              <div key={activity.id} className="relative pl-6">
                {/* Timeline Node */}
                <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border flex items-center justify-center ${config.bg} ${config.border}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                
                {/* Content */}
                <div>
                  <p className="text-sm text-[var(--color-text-primary)]">
                    {activity.details}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
