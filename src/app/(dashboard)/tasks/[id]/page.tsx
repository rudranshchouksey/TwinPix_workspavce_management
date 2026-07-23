import { Metadata } from "next";
import { getTaskByIdAction, getTaskNameAction } from "@/actions/tasks";
import { requireAuth } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Flag, CheckCircle2, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskComments } from "@/components/tasks/task-comments";
import { BreadcrumbLabel } from "@/components/layout/breadcrumb-label";
import { TaskDetailActions } from "@/components/tasks/task-detail-actions";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const task = await getTaskNameAction(id);

  return {
    title: task?.title ? `${task.title} | TwinPix` : "Task Detail | TwinPix",
    description: "View task details, progress, and comments.",
  };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const user = await requireAuth();

  let task;
  let users = [];
  let campaigns = [];
  
  try {
    const [taskData, usersData, campaignsData] = await Promise.all([
      getTaskByIdAction(resolvedParams.id),
      getAllUsersBasicAction(),
      getCampaignsAction({ limit: 100 })
    ]);
    
    if (!taskData) notFound();
    task = taskData;
    users = usersData;
    campaigns = campaignsData.campaigns;
  } catch (error) {
    notFound();
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "URGENT": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "HIGH": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "MEDIUM": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "LOW": return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default: return "";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "DONE": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "REVIEW": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "IN_PROGRESS": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "TODO": return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default: return "";
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <BreadcrumbLabel label={task.title} />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] pb-6">
        <Link 
          href="/tasks"
          className="flex items-center text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`${getPriorityColor(task.priority)} uppercase text-xs tracking-wider`}>
            <Flag className="w-3 h-3 mr-1" />
            {task.priority}
          </Badge>
          <Badge variant="outline" className={`${getStatusColor(task.status)} uppercase text-xs tracking-wider`}>
            {task.status === "DONE" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
            {task.status.replace("_", " ")}
          </Badge>
          
          <div className="w-px h-6 bg-[rgba(0,0,0,0.08)] mx-2"></div>
          
          <TaskDetailActions 
            task={task as any} 
            users={users} 
            campaigns={campaigns} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] leading-tight">
              {task.title}
            </h1>
            
            {task.campaign && (
              <div className="mt-3 flex items-center text-sm">
                <span className="text-[var(--color-text-muted)] mr-2">Campaign:</span>
                <Link href={`/campaigns/${task.campaign.id}`} className="text-[var(--color-brand-400)] hover:underline font-medium">
                  {task.campaign.name}
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              Description
            </h3>
            {task.description ? (
              <div className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                {task.description}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] italic">No description provided.</p>
            )}
          </div>

          {/* Comments Section */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <TaskComments taskId={task.id} comments={task.comments} currentUser={user} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card space-y-6">
            
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                Assignee
              </h3>
              {task.assignee ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.1)] flex items-center justify-center shrink-0 overflow-hidden">
                    {task.assignee.image ? (
                      <img src={task.assignee.image} alt={task.assignee.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{task.assignee.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{task.assignee.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                  <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <p className="text-sm italic">Unassigned</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[rgba(0,0,0,0.08)]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                Due Date
              </h3>
              <div className="flex items-center text-sm text-[var(--color-text-primary)]">
                <Calendar className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />
                {task.dueDate ? (
                  new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
                ) : (
                  <span className="text-[var(--color-text-muted)] italic">No due date</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(0,0,0,0.08)]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                Reporter
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[rgba(0,0,0,0.1)] flex items-center justify-center shrink-0 overflow-hidden">
                  {task.author?.image ? (
                    <img src={task.author.image} alt={task.author.name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{task.author?.name || "Unknown"}</p>
              </div>
            </div>
          </div>
          
          {/* Attachments Section - Placeholder for now since we use String[] URLs */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-6 glass-card">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-4">
              Attachments
            </h3>
            {task.attachments.length > 0 ? (
              <ul className="space-y-2">
                {task.attachments.map((url: string, i: number) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-[var(--color-brand-400)] hover:underline truncate block">
                      Attachment {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] italic">No attachments.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
