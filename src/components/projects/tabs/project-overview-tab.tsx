import React, { useMemo } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { 
  FolderKanban, CheckCircle, Users, DollarSign, Calendar, Target,
  FileText, Activity, AlertCircle, Clock, Video, TrendingUp, CheckCircle2,
  CalendarDays, MessagesSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function ProjectOverviewTab({ project }: { project: any }) {
  // Aggregate data
  const {
    activeCampaigns,
    totalCampaigns,
    completedCampaigns,
    uniqueInfluencers,
    completedInfluencers,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    totalFiles,
    totalMeetings,
    totalBudget,
    upcomingDeadlines,
    recentActivities
  } = useMemo(() => {
    let activeCampaigns = 0;
    let completedCampaigns = 0;
    const uniqueInfluencers = new Set<string>();
    let completedInfluencers = 0;
    let totalFiles = 0;
    let totalMeetings = 0;
    let totalBudget = 0;
    const upcomingEvents: any[] = [];
    const activities: any[] = [];
    let allTasks: any[] = [];

    // Process tasks
    if (project.tasks) {
      allTasks = project.tasks;
      totalFiles += project.tasks.reduce((sum: number, t: any) => sum + (t.files?.length || 0), 0);
      activities.push(...project.tasks.flatMap((t: any) => (t.activities || []).map((a: any) => ({ ...a, source: 'Task', href: `/tasks/${t.id}` }))));
      activities.push(...project.tasks.flatMap((t: any) => (t.comments || []).map((c: any) => ({ 
        ...c, 
        type: 'COMMENT', 
        details: `Commented: ${c.content.substring(0, 30)}...`,
        source: 'Task',
        href: `/tasks/${t.id}`
      }))));
    }

    // Process Campaigns
    if (project.campaigns) {
      project.campaigns.forEach((c: any) => {
        if (c.status === "ACTIVE") activeCampaigns++;
        if (c.status === "COMPLETED") completedCampaigns++;
        totalBudget += c.budget || 0;
        
        c.influencers?.forEach((ci: any) => {
          uniqueInfluencers.add(ci.influencerId);
          if (ci.status === "COMPLETED" || ci.status === "DELIVERED") completedInfluencers++;
        });

        totalFiles += (c.files?.length || 0);

        c.events?.forEach((e: any) => {
          if (["MEETING", "CLIENT_MEETING", "TEAM_MEETING"].includes(e.type)) totalMeetings++;
          if (new Date(e.start) > new Date()) upcomingEvents.push(e);
        });

        activities.push(...(c.activities || []).map((a: any) => ({ ...a, source: 'Campaign', href: `/campaigns/${c.id}` })));
      });
    }

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === "DONE").length;
    const pendingTasks = totalTasks - completedTasks;
    const now = new Date();
    const overdueTasks = allTasks.filter(t => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now).length;
    
    const upcomingDeadlines = allTasks
      .filter(t => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    // Sort recent activities
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return {
      activeCampaigns,
      totalCampaigns: project.campaigns?.length || 0,
      completedCampaigns,
      uniqueInfluencers: uniqueInfluencers.size,
      completedInfluencers,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      totalFiles,
      totalMeetings,
      totalBudget,
      upcomingDeadlines,
      recentActivities: sortedActivities
    };
  }, [project]);

  // Derived Metrics
  const healthScore = Math.max(0, 100 - (overdueTasks * 5));
  const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const campaignProgress = totalCampaigns === 0 ? 0 : Math.round((completedCampaigns / totalCampaigns) * 100);
  const influencerProgress = uniqueInfluencers === 0 ? 0 : Math.round((completedInfluencers / uniqueInfluencers) * 100);
  
  const createdDate = new Date(project.createdAt).toLocaleDateString();
  const dueDate = project.milestoneDate ? new Date(project.milestoneDate).toLocaleDateString() : "N/A";

  const KpiCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
          <h4 className="text-xl font-bold text-gray-900">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div 
      className="space-y-6 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* 1. TOP HERO */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden border-none shadow-md bg-white">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-brand-500)] to-purple-500" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="space-y-5 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">{project.name}</h2>
                  <Badge variant="outline" className="bg-[var(--color-brand-50)] text-[var(--color-brand-600)] border-[var(--color-brand-200)] px-3 py-1 text-xs">
                    {project.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Client</p>
                    <p className="font-medium text-gray-800 mt-1">{project.client?.companyName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Owner</p>
                    <p className="font-medium text-gray-800 mt-1">Admin</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Timeline</p>
                    <p className="font-medium text-gray-800 mt-1">{createdDate} - {dueDate}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Budget</p>
                    <p className="font-medium text-gray-800 mt-1">${totalBudget.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-80 bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600">Health Score</span>
                  <span className={`text-lg font-bold ${healthScore >= 90 ? 'text-emerald-500' : healthScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                    {healthScore}/100
                  </span>
                </div>
                <Progress value={healthScore} className="h-2" />
                
                <div className="flex justify-between items-center mt-5 mb-2">
                  <span className="text-sm font-semibold text-gray-600">Overall Progress</span>
                  <span className="text-lg font-bold text-[var(--color-brand-600)]">{taskProgress}%</span>
                </div>
                <Progress value={taskProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. KPI CARDS */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Campaigns" value={totalCampaigns} icon={FolderKanban} colorClass="bg-blue-50 text-blue-600" />
        <KpiCard title="Influencers" value={uniqueInfluencers} icon={Users} colorClass="bg-purple-50 text-purple-600" />
        <KpiCard title="Tasks" value={totalTasks} icon={Target} colorClass="bg-indigo-50 text-indigo-600" />
        <KpiCard title="Completed" value={completedTasks} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600" />
        <KpiCard title="Pending" value={pendingTasks} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
        <KpiCard title="Files" value={totalFiles} icon={FileText} colorClass="bg-rose-50 text-rose-600" />
        <KpiCard title="Meetings" value={totalMeetings} icon={Video} colorClass="bg-sky-50 text-sky-600" />
        <KpiCard title="Deliverables" value={completedTasks} icon={CheckCircle} colorClass="bg-teal-50 text-teal-600" />
        <KpiCard title="Budget Used" value="$0" icon={DollarSign} colorClass="bg-red-50 text-red-600" />
        <KpiCard title="Revenue" value="N/A" icon={TrendingUp} colorClass="bg-gray-100 text-gray-600" />
      </motion.div>

      {/* 3. PROGRESS & 4. UPCOMING & 5. RECENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Progress Widgets */}
        <motion.div variants={item} className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-gray-100 h-full">
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/30">
              <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                <Activity className="w-4 h-4 text-[var(--color-brand-500)]" />
                Progress Widgets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-7 mt-2">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-600">Task Completion</span>
                  <span className="font-bold text-gray-900">{taskProgress}%</span>
                </div>
                <Progress value={taskProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-600">Campaign Completion</span>
                  <span className="font-bold text-gray-900">{campaignProgress}%</span>
                </div>
                <Progress value={campaignProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-600">Influencer Progress</span>
                  <span className="font-bold text-gray-900">{influencerProgress}%</span>
                </div>
                <Progress value={influencerProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-600">Budget Usage</span>
                  <span className="font-bold text-gray-900">0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Middle Column: Upcoming */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="shadow-sm border-gray-100 h-full">
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/30">
              <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingDeadlines.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {upcomingDeadlines.map((task: any) => (
                    <Link href={`/tasks/${task.id}`} key={task.id} className="block p-4 hover:bg-gray-50/50 transition-colors flex items-start gap-3">
                      <div className="mt-0.5 bg-amber-50 p-2 rounded-lg text-amber-600 border border-amber-100 flex-shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-[var(--color-brand-600)] transition-colors">{task.title}</h5>
                        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-medium truncate">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-gray-300" />
                  </div>
                  No upcoming deadlines.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Recent Activity */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="shadow-sm border-gray-100 h-full">
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/30">
              <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                <MessagesSquare className="w-4 h-4 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentActivities.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {recentActivities.map((activity: any, idx: number) => {
                    const content = (
                      <div className="p-4 hover:bg-gray-50/50 transition-colors flex items-start gap-3">
                        <Avatar className="w-8 h-8 border border-gray-100 shadow-sm flex-shrink-0">
                          <AvatarImage src={activity.user?.image || ""} />
                          <AvatarFallback className="bg-[var(--color-brand-50)] text-[var(--color-brand-600)] text-xs font-semibold">
                            {activity.user?.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 line-clamp-2">
                            <span className="font-semibold text-gray-900 hover:text-[var(--color-brand-600)] transition-colors">{activity.user?.name || "Someone"}</span> {activity.details}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1 font-medium">
                            {new Date(activity.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );

                    return activity.href ? (
                      <Link key={activity.id || idx} href={activity.href} className="block group">
                        {content}
                      </Link>
                    ) : (
                      <div key={activity.id || idx}>{content}</div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-gray-300" />
                  </div>
                  No recent activity.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}
