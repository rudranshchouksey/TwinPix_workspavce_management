"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Briefcase, Mail, Shield, CheckCircle2, Calendar, Activity, Clock } from "lucide-react";
import { PremiumCard } from "@/components/ui/premium-card";
import { EditProfileDialog } from "@/components/users/edit-profile-dialog";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";

export function ProfileView({ initialUser }: { initialUser: any }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();

  if (!initialUser) return null;

  return (
    <>
      <div className="relative mb-24">
        {/* Banner */}
        <div className="h-64 w-full rounded-2xl bg-gradient-to-r from-[var(--color-brand-400)] via-[var(--color-brand-500)] to-purple-600 shadow-lg overflow-hidden">
          {/* Optional pattern overlay */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        </div>

        {/* Profile Info Overlap */}
        <div className="absolute -bottom-20 left-8 right-8 flex justify-between items-end">
          <div className="flex items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-[var(--color-surface-800)] shadow-2xl rounded-full bg-white">
              <AvatarImage src={initialUser.image || ""} alt={initialUser.name} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold bg-[rgba(0,0,0,0.05)] text-[var(--color-text-primary)]">
                {initialUser.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="pb-2">
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] drop-shadow-sm">
                {initialUser.name}
              </h1>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> 
                {initialUser.jobTitle || "Team Member"} 
                {initialUser.department && (
                  <span className="bg-[rgba(0,0,0,0.05)] px-2 py-0.5 rounded-full text-xs ml-2">
                    {initialUser.department}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="mb-2 flex items-center gap-2 bg-white text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] border border-[rgba(0,0,0,0.1)] shadow-sm px-5 py-2.5 rounded-xl font-semibold transition-all hover:shadow-md"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 px-2">
        {/* Left Column: Details & Stats */}
        <div className="space-y-8">
          <PremiumCard className="p-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 border-b border-[rgba(0,0,0,0.05)] pb-3">
              Contact & Info
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-[rgba(0,0,0,0.03)] rounded-lg text-[var(--color-text-secondary)]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Email</p>
                  <p className="font-medium text-[var(--color-text-primary)]">{initialUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-[rgba(0,0,0,0.03)] rounded-lg text-[var(--color-text-secondary)]">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Role</p>
                  <p className="font-medium text-[var(--color-text-primary)] capitalize">
                    {initialUser.role.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-[rgba(0,0,0,0.03)] rounded-lg text-[var(--color-text-secondary)]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Joined</p>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {format(new Date(initialUser.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </PremiumCard>

          <div className="grid grid-cols-2 gap-4">
            <PremiumCard className="p-5 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {initialUser.assignedTasks?.length || 0}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium uppercase tracking-wider">
                Active Tasks
              </p>
            </PremiumCard>
            
            <PremiumCard className="p-5 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-2">
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {initialUser.activityLogs?.length || 0}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium uppercase tracking-wider">
                Recent Actions
              </p>
            </PremiumCard>
          </div>
        </div>

        {/* Right Column: Activity & Tasks */}
        <div className="md:col-span-2 space-y-8">
          <PremiumCard className="p-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6 border-b border-[rgba(0,0,0,0.05)] pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-500)]" />
              My Active Tasks
            </h2>
            
            {initialUser.assignedTasks && initialUser.assignedTasks.length > 0 ? (
              <div className="space-y-4">
                {initialUser.assignedTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start justify-between p-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-[rgba(0,0,0,0.01)] hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-primary)]">{task.title}</h3>
                      {task.dueDate && (
                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3" />
                          Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      task.priority === "HIGH" || task.priority === "URGENT" 
                        ? "bg-red-50 text-red-600" 
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[var(--color-text-muted)] bg-[rgba(0,0,0,0.02)] rounded-xl border border-[rgba(0,0,0,0.05)]">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No active tasks assigned to you right now.</p>
              </div>
            )}
          </PremiumCard>

          <PremiumCard className="p-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6 border-b border-[rgba(0,0,0,0.05)] pb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--color-brand-500)]" />
              Recent Activity
            </h2>
            
            {initialUser.activityLogs && initialUser.activityLogs.length > 0 ? (
              <div className="space-y-5">
                {initialUser.activityLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="relative mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-400)] z-10 relative"></div>
                      <div className="absolute top-3 left-[4px] bottom-[-24px] w-[2px] bg-[rgba(0,0,0,0.05)] z-0"></div>
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm text-[var(--color-text-primary)]">
                        <span className="font-semibold">{initialUser.name}</span> {log.action}{" "}
                        {log.targetName && <span className="font-medium">&quot;{log.targetName}&quot;</span>}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[var(--color-text-muted)] bg-[rgba(0,0,0,0.02)] rounded-xl border border-[rgba(0,0,0,0.05)]">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No recent activity found.</p>
              </div>
            )}
          </PremiumCard>
        </div>
      </div>

      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={initialUser}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
