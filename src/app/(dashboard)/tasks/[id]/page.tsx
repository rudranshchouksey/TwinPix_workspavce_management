import { Metadata } from "next";
import { getTaskByIdAction, getTaskNameAction } from "@/actions/tasks";
import { requireAuth } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flag, CheckCircle2, User, Clock, FileText, Activity, LayoutDashboard, Target, Briefcase, Hash, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbLabel } from "@/components/layout/breadcrumb-label";
import { TaskDetailActions } from "@/components/tasks/task-detail-actions";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";
import { getProjectsAction } from "@/actions/projects";
import { InlineEdit } from "@/components/tasks/inline-edit";
import { TaskActivityTimeline } from "@/components/tasks/task-activity-timeline";

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
  let projects = [];
  
  try {
    const [taskData, usersData, campaignsData, projectsData] = await Promise.all([
      getTaskByIdAction(resolvedParams.id),
      getAllUsersBasicAction(),
      getCampaignsAction({ limit: 100 }),
      getProjectsAction()
    ]);
    
    if (!taskData) notFound();
    task = taskData;
    users = usersData;
    campaigns = campaignsData.campaigns;
    projects = projectsData;
  } catch (error) {
    notFound();
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "URGENT": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "HIGH": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "MEDIUM": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "LOW": return "text-gray-500 bg-gray-500/10 border-gray-500/20";
      default: return "";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "DONE": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "REVIEW": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "IN_PROGRESS": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "TODO": return "text-gray-500 bg-gray-500/10 border-gray-500/20";
      default: return "";
    }
  };

  // Convert array data for InlineEdit select options
  const userOptions = [{ label: "Unassigned", value: "" }, ...users.map(u => ({ label: u.name || u.email, value: u.id }))];
  const campaignOptions = [{ label: "None", value: "" }, ...campaigns.map(c => ({ label: c.name, value: c.id }))];
  const projectOptions = [{ label: "None", value: "" }, ...projects.map(p => ({ label: p.name, value: p.id }))];
  const priorityOptions = [
    { label: "Low", value: "LOW" },
    { label: "Medium", value: "MEDIUM" },
    { label: "High", value: "HIGH" },
    { label: "Urgent", value: "URGENT" }
  ];
  const statusOptions = [
    { label: "To Do", value: "TODO" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Review", value: "REVIEW" },
    { label: "Done", value: "DONE" }
  ];

  // Time Tracking Progress
  const est = task.estimatedHours || 0;
  const act = task.actualHours || 0;
  const progressPercent = est > 0 ? Math.min((act / est) * 100, 100) : 0;
  const isOverTime = est > 0 && act > est;

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto">
      <BreadcrumbLabel label={task.title} />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/tasks"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(0,0,0,0.03)] hover:bg-[rgba(0,0,0,0.06)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider mb-1">Task</span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)] font-mono text-sm bg-[rgba(0,0,0,0.04)] px-1.5 py-0.5 rounded">
                TSK-{task.id.substring(0,4).toUpperCase()}
              </span>
              <InlineEdit 
                taskId={task.id}
                field="title"
                value={task.title}
                className="text-xl font-bold text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.04)] p-1 -m-1 rounded transition-colors"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <TaskDetailActions 
            task={task as any} 
            users={users} 
            campaigns={campaigns} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Task Information (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--color-brand-500)]" />
              Description
            </h3>
            <InlineEdit
              taskId={task.id}
              field="description"
              value={task.description}
              type="textarea"
              placeholder="Add a detailed description..."
              className="text-sm text-[var(--color-text-secondary)] min-h-[100px] items-start"
              displayValue={
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {task.description || <span className="text-[var(--color-text-muted)] italic">Add a description...</span>}
                </div>
              }
            />
          </div>

          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--color-brand-500)]" />
              Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-muted)]">Story Points</span>
                <InlineEdit 
                  taskId={task.id}
                  field="storyPoints"
                  value={task.storyPoints}
                  type="number"
                  placeholder="0"
                  className="font-medium bg-[rgba(0,0,0,0.03)] px-2 py-0.5 rounded text-center w-12"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-muted)]">Est. Hours</span>
                <InlineEdit 
                  taskId={task.id}
                  field="estimatedHours"
                  value={task.estimatedHours}
                  type="number"
                  placeholder="0.0"
                  className="font-medium"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-muted)]">Actual Hours</span>
                <InlineEdit 
                  taskId={task.id}
                  field="actualHours"
                  value={task.actualHours}
                  type="number"
                  placeholder="0.0"
                  className="font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Activity Timeline & Comments (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-6 shadow-sm min-h-[500px]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-brand-500)]" />
              Activity & Comments
            </h3>
            <TaskActivityTimeline 
              taskId={task.id} 
              activities={task.activities} 
              comments={task.comments} 
              currentUser={user} 
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Properties Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm overflow-hidden divide-y divide-[rgba(0,0,0,0.06)]">
            
            {/* Status & Priority */}
            <div className="p-5 bg-[rgba(0,0,0,0.02)]">
              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-1">Status</span>
                  <InlineEdit
                    taskId={task.id}
                    field="status"
                    value={task.status}
                    type="select"
                    options={statusOptions}
                    displayValue={
                      <Badge variant="outline" className={`${getStatusColor(task.status)} uppercase text-[10px] tracking-wider w-full justify-center`}>
                        {task.status === "DONE" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {task.status.replace("_", " ")}
                      </Badge>
                    }
                  />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-1">Priority</span>
                  <InlineEdit
                    taskId={task.id}
                    field="priority"
                    value={task.priority}
                    type="select"
                    options={priorityOptions}
                    displayValue={
                      <Badge variant="outline" className={`${getPriorityColor(task.priority)} uppercase text-[10px] tracking-wider w-full justify-center`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {task.priority}
                      </Badge>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Assignee & Reporter */}
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2">Assignee</span>
                <InlineEdit
                  taskId={task.id}
                  field="assigneeId"
                  value={task.assigneeId || ""}
                  type="select"
                  options={userOptions}
                  displayValue={
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 overflow-hidden border border-[rgba(0,0,0,0.08)]">
                        {task.assignee?.image ? (
                          <img src={task.assignee.image} alt={task.assignee.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{task.assignee?.name || "Unassigned"}</p>
                      </div>
                    </div>
                  }
                />
              </div>
              
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2">Reporter</span>
                <InlineEdit
                  taskId={task.id}
                  field="reporterId"
                  value={task.reporterId || task.authorId}
                  type="select"
                  options={userOptions}
                  displayValue={
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 overflow-hidden border border-[rgba(0,0,0,0.08)]">
                        {task.author?.image ? (
                          <img src={task.author.image} alt={task.author.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{task.author?.name || "Unknown"}</p>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Campaign & Project */}
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3 h-3" /> Campaign
                </span>
                <InlineEdit
                  taskId={task.id}
                  field="campaignId"
                  value={task.campaignId || ""}
                  type="select"
                  options={campaignOptions}
                  displayValue={
                    <div className="text-sm text-[var(--color-text-primary)] font-medium">
                      {task.campaign?.name || <span className="text-[var(--color-text-muted)] italic font-normal">None</span>}
                    </div>
                  }
                />
              </div>
              
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> Project
                </span>
                <InlineEdit
                  taskId={task.id}
                  field="projectId"
                  value={task.projectId || ""}
                  type="select"
                  options={projectOptions}
                  displayValue={
                    <div className="text-sm text-[var(--color-text-primary)] font-medium">
                      {task.project?.name || <span className="text-[var(--color-text-muted)] italic font-normal">None</span>}
                    </div>
                  }
                />
              </div>
            </div>

            {/* Dates */}
            <div className="p-5">
              <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2">Due Date</span>
              <InlineEdit
                taskId={task.id}
                field="dueDate"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                type="date"
                displayValue={
                  <div className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Set Date"}
                  </div>
                }
              />
            </div>
            
            <div className="p-5 bg-[rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-2">
                 <span>Created</span>
                 <span>{new Date(task.createdAt).toLocaleDateString()}</span>
               </div>
               <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                 <span>Updated</span>
                 <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
               </div>
            </div>

          </div>

          {/* Time Tracking Progress */}
          {est > 0 && (
            <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm p-6 relative overflow-hidden">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-brand-500)]" />
                Time Tracking
              </h3>
              
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-[var(--color-text-secondary)]">{act}h logged</span>
                <span className="text-[var(--color-text-muted)]">{est}h est</span>
              </div>
              
              <div className="h-2 w-full bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isOverTime ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              
              {isOverTime && (
                <div className="mt-3 text-xs text-red-500 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  Over estimate by {Math.abs(est - act)}h
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
