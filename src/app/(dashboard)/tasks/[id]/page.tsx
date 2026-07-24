import { Metadata } from "next";
import { getTaskByIdAction, getTaskNameAction } from "@/actions/tasks";
import { requireAuth } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flag, CheckCircle2, User, Clock, FileText, Activity, LayoutDashboard, Target, Briefcase, AlertCircle, Calendar, CheckSquare, Paperclip, Building2, Eye, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbLabel } from "@/components/layout/breadcrumb-label";
import { TaskDetailActions } from "@/components/tasks/task-detail-actions";
import { getAllUsersBasicAction } from "@/actions/users";
import { getCampaignsAction } from "@/actions/campaigns";
import { getProjectsAction } from "@/actions/projects";
import { InlineEdit } from "@/components/tasks/inline-edit";
import { TaskActivityTimeline } from "@/components/tasks/task-activity-timeline";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import { FileList } from "@/components/files/file-list";

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
    task = taskData as any;
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

  const breadcrumbText = task.campaign?.name ? `Campaigns / ${task.campaign.name} / ${task.title}` : `Tasks / ${task.title}`;

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto">
      <BreadcrumbLabel label={breadcrumbText} />

      {/* Premium Header */}
      <div className="flex items-start justify-between border-b border-[rgba(0,0,0,0.08)] pb-6 bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4 flex-1">
          <Link 
            href="/tasks"
            className="flex items-center justify-center w-10 h-10 mt-1 rounded-full bg-[rgba(0,0,0,0.03)] hover:bg-[rgba(0,0,0,0.06)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[var(--color-text-muted)] font-mono text-xs bg-[rgba(0,0,0,0.04)] px-2 py-1 rounded-md font-medium tracking-wide">
                TSK-{task.id.substring(0,4).toUpperCase()}
              </span>
              <Badge variant="outline" className={`${getStatusColor(task.status)} uppercase text-[10px] tracking-wider px-2 py-0.5 border-transparent`}>
                {task.status === "DONE" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                {task.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className={`${getPriorityColor(task.priority)} uppercase text-[10px] tracking-wider px-2 py-0.5 border-transparent`}>
                <Flag className="w-3 h-3 mr-1" />
                {task.priority}
              </Badge>
            </div>
            
            <InlineEdit 
              taskId={task.id}
              field="title"
              value={task.title}
              className="text-3xl font-bold text-[var(--color-text-primary)] hover:bg-[rgba(0,0,0,0.02)] p-1.5 -m-1.5 rounded-lg transition-colors w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-1 ml-4 shrink-0">
          <TaskDetailActions 
            task={task as any} 
            users={users} 
            campaigns={campaigns} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Main Content (70% -> 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Description Block */}
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--color-brand-500)]" />
              Description
            </h3>
            <InlineEdit
              taskId={task.id}
              field="description"
              value={task.description}
              type="textarea"
              placeholder="Add a detailed description..."
              className="text-base text-[var(--color-text-secondary)] min-h-[150px] items-start"
              displayValue={
                <div className="whitespace-pre-wrap leading-relaxed text-base">
                  {task.description || <span className="text-[var(--color-text-muted)] italic">Click to add a description...</span>}
                </div>
              }
            />
          </div>

          {/* Checklist Block */}
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[var(--color-brand-500)]" />
              Checklist
            </h3>
            <TaskChecklist taskId={task.id} initialChecklist={task.checklist} />
          </div>

          {/* Attachments Block */}
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[var(--color-brand-500)]" />
              Attachments
            </h3>
            <FileList entityType="TASK" entityId={task.id} title="" />
          </div>

          {/* Activity Timeline & Comments */}
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
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

        {/* RIGHT COLUMN: Properties Sidebar (30% -> 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm overflow-hidden divide-y divide-[rgba(0,0,0,0.04)] sticky top-6">
            
            {/* Status & Priority */}
            <div className="p-6 bg-[rgba(0,0,0,0.02)]">
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2">Status</span>
                  <InlineEdit
                    taskId={task.id}
                    field="status"
                    value={task.status}
                    type="select"
                    options={statusOptions}
                    displayValue={
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:bg-opacity-80 cursor-pointer ${getStatusColor(task.status)}`}>
                        {task.status === "DONE" ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {task.status.replace("_", " ")}
                      </div>
                    }
                  />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2">Priority</span>
                  <InlineEdit
                    taskId={task.id}
                    field="priority"
                    value={task.priority}
                    type="select"
                    options={priorityOptions}
                    displayValue={
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:bg-opacity-80 cursor-pointer ${getPriorityColor(task.priority)}`}>
                        <Flag className="w-4 h-4" />
                        {task.priority}
                      </div>
                    }
                  />
                </div>
              </div>
            </div>

            {/* People Section */}
            <div className="p-6 space-y-5">
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-3">Assignee</span>
                <InlineEdit
                  taskId={task.id}
                  field="assigneeId"
                  value={task.assigneeId || ""}
                  type="select"
                  options={userOptions}
                  displayValue={
                    <div className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 overflow-hidden border border-[rgba(0,0,0,0.08)]">
                        {task.assignee?.image ? (
                          <img src={task.assignee.image} alt={task.assignee.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {task.assignee?.name || "Unassigned"}
                        </span>
                        {task.assignee?.jobTitle && (
                          <span className="text-xs text-[var(--color-text-muted)]">{task.assignee.jobTitle}</span>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>
              
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-3">Reporter</span>
                <InlineEdit
                  taskId={task.id}
                  field="reporterId"
                  value={task.reporterId || task.authorId}
                  type="select"
                  options={userOptions}
                  displayValue={
                    <div className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 overflow-hidden border border-[rgba(0,0,0,0.08)]">
                        {(task.reporter || task.author)?.image ? (
                          <img src={(task.reporter || task.author).image} alt={(task.reporter || task.author).name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {(task.reporter || task.author)?.name || "Unknown"}
                        </span>
                        {(task.reporter || task.author)?.jobTitle && (
                          <span className="text-xs text-[var(--color-text-muted)]">{(task.reporter || task.author).jobTitle}</span>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Campaign & Client Section */}
            <div className="p-6 space-y-5">
              {task.campaign?.client && (
                <div>
                  <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Client
                  </span>
                  <div className="text-sm text-[var(--color-text-primary)] font-medium p-2 -m-2">
                    {task.campaign.client.companyName}
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Campaign
                </span>
                <InlineEdit
                  taskId={task.id}
                  field="campaignId"
                  value={task.campaignId || ""}
                  type="select"
                  options={campaignOptions}
                  displayValue={
                    <div className="text-sm text-[var(--color-brand-600)] font-medium hover:underline p-2 -m-2 cursor-pointer">
                      {task.campaign?.name || <span className="text-[var(--color-text-muted)] italic font-normal hover:no-underline">No Campaign</span>}
                    </div>
                  }
                />
              </div>
              
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Project
                </span>
                <InlineEdit
                  taskId={task.id}
                  field="projectId"
                  value={task.projectId || ""}
                  type="select"
                  options={projectOptions}
                  displayValue={
                    <div className="text-sm text-[var(--color-brand-600)] font-medium hover:underline p-2 -m-2 cursor-pointer">
                      {task.project?.name || <span className="text-[var(--color-text-muted)] italic font-normal hover:no-underline">No Project</span>}
                    </div>
                  }
                />
              </div>
            </div>

            {/* Dates & Watchers */}
            <div className="p-6 space-y-5">
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2">Due Date</span>
                <InlineEdit
                  taskId={task.id}
                  field="dueDate"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                  type="date"
                  displayValue={
                    <div className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer w-fit">
                      <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "Set Date"}
                    </div>
                  }
                />
              </div>

              {task.watchers && task.watchers.length > 0 && (
                <div>
                  <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold tracking-wider block mb-2 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Watchers ({task.watchers.length})
                  </span>
                  <div className="flex items-center gap-1">
                    {task.watchers.map((w: any) => (
                      <div key={w.id} className="w-7 h-7 rounded-full bg-[rgba(0,0,0,0.05)] border-2 border-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm" title={w.name}>
                        {w.image ? <img src={w.image} alt={w.name} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-gray-500">{w.name?.charAt(0) || "U"}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-[rgba(0,0,0,0.01)] flex flex-col gap-2">
               <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
                 <span>Created</span>
                 <span>{new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
               </div>
               <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
                 <span>Updated</span>
                 <span>{new Date(task.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
               </div>
            </div>

          </div>

          {/* Time Tracking Progress */}
          {est > 0 && (
            <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm p-6 relative overflow-hidden">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-brand-500)]" />
                Time Tracking
              </h3>
              
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-[var(--color-text-primary)]">{act}h logged</span>
                <span className="text-[var(--color-text-muted)]">{est}h estimated</span>
              </div>
              
              <div className="h-2 w-full bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isOverTime ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              
              {isOverTime && (
                <div className="mt-3 text-xs text-red-500 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
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
