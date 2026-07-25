"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, Megaphone, UserPlus, MessageSquare, 
  Calendar as CalendarIcon, FileText, CheckSquare, Activity 
} from "lucide-react";
import { getUnifiedProjectTimelineAction, UnifiedActivity, ActivityCategory } from "@/actions/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const CATEGORY_FILTERS: { label: string; value: ActivityCategory | 'ALL' }[] = [
  { label: "All", value: "ALL" },
  { label: "Tasks", value: "TASK" },
  { label: "Campaigns", value: "CAMPAIGN" },
  { label: "Influencers", value: "INFLUENCER" },
  { label: "Files", value: "FILE" },
  { label: "Meetings", value: "MEETING" },
  { label: "Approvals", value: "APPROVAL" },
];

export function UnifiedActivityTimeline({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<UnifiedActivity[]>([]);
  const [filter, setFilter] = useState<ActivityCategory | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await getUnifiedProjectTimelineAction(projectId);
      if (res.success && res.data) {
        setActivities(res.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [projectId]);

  const filteredActivities = activities.filter(a => filter === 'ALL' || a.category === filter);

  const getIconForCategory = (category: ActivityCategory) => {
    switch (category) {
      case 'TASK': return <CheckSquare className="h-4 w-4" />;
      case 'CAMPAIGN': return <Megaphone className="h-4 w-4" />;
      case 'INFLUENCER': return <UserPlus className="h-4 w-4" />;
      case 'FILE': return <FileText className="h-4 w-4" />;
      case 'MEETING': return <CalendarIcon className="h-4 w-4" />;
      case 'APPROVAL': return <CheckCircle className="h-4 w-4" />;
      case 'COMMENT': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (category: ActivityCategory) => {
    switch (category) {
      case 'TASK': return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      case 'CAMPAIGN': return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400";
      case 'INFLUENCER': return "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400";
      case 'FILE': return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
      case 'MEETING': return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400";
      case 'APPROVAL': return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      case 'COMMENT': return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full max-w-4xl mx-auto py-6">
      
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center bg-card p-3 rounded-xl border shadow-sm">
        <span className="text-sm font-medium text-muted-foreground mr-2">Filters:</span>
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 border ${
              filter === f.value 
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-4 md:pl-0">
        {/* Vertical Rail */}
        <div className="absolute left-10 md:left-24 top-4 bottom-0 w-px bg-border -ml-px hidden sm:block"></div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Activity className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Loading timeline...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-dashed shadow-sm">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Activity Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              There are no events matching your current filter. Try selecting "All" or interact with the project to generate new activity.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence initial={false}>
              {filteredActivities.map((activity, idx) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx < 10 ? idx * 0.05 : 0 }}
                  className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 group"
                >
                  
                  {/* Timestamp (Left column on md) */}
                  <div className="hidden sm:block w-20 shrink-0 text-right text-xs font-medium text-muted-foreground pt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </div>

                  {/* Icon Node */}
                  <div className="hidden sm:flex relative z-10 shrink-0 w-8 h-8 rounded-full items-center justify-center bg-background border-2 border-muted-foreground shadow-sm ring-4 ring-background transition-colors group-hover:border-primary group-hover:text-primary text-muted-foreground">
                    {getIconForCategory(activity.category)}
                  </div>

                  {/* Mobile Timestamp & Node */}
                  <div className="sm:hidden flex items-center gap-2 mb-2 w-full">
                    <div className="flex shrink-0 w-6 h-6 rounded-full items-center justify-center bg-background border-2 border-muted-foreground text-muted-foreground">
                      {getIconForCategory(activity.category)}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 min-w-0 bg-card rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0 border">
                        <AvatarImage src={activity.user?.image || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {activity.user?.name?.charAt(0) || "S"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-sm leading-tight">
                          <span className="font-semibold text-foreground truncate">
                            {activity.user?.name}
                          </span>
                          <span className="text-muted-foreground">
                            {activity.action}
                          </span>
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {activity.entityName}
                          </span>
                        </div>
                        
                        {activity.details && (
                          <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2.5 rounded-lg border">
                            {activity.details}
                          </p>
                        )}
                        
                        <div className="mt-3 flex items-center">
                          <Badge variant="outline" className={getBadgeColor(activity.category)}>
                            {activity.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
